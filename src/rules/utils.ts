import ESLint from 'eslint';
import requireRelative from 'require-relative';
import { runInNewContext } from 'vm';

const pathToBlankFile = require.resolve('../blank.js');

const getsertCache = <T>(
  cache: Map<string, T>,
  key: string,
  fn: () => T,
  _name: string
): T => {
  const cached = cache.get(key);

  if (cached) {
    // console.debug(`${_name}: hit`);

    return cached;
  }

  // console.debug(`${_name}: miss`);
  const fresh = fn();

  cache.set(key, fresh);

  return fresh;
};

const relativeRequire = (name: string): unknown =>
  requireRelative(name, process.cwd()) as unknown;

relativeRequire.resolve = (name: string): string =>
  requireRelative.resolve(name, process.cwd());

const compileConfigCodeCache = new Map<string, ESLint.Linter.Config>();

const compileConfigCode = (fileCode: string): ESLint.Linter.Config => {
  return getsertCache(
    compileConfigCodeCache,
    fileCode,
    () =>
      (runInNewContext(fileCode, {
        module: { exports: {} },
        require: relativeRequire
      }) ?? {}) as ESLint.Linter.Config,
    'compileConfigCode'
  );
};

const createCliEngineCache = new Map<string, ESLint.CLIEngine>();

const createCLIEngine = (config: ESLint.Linter.Config): ESLint.CLIEngine => {
  const extraConfig: ESLint.Linter.Config = {
    parserOptions: {
      ...config.parserOptions,
      project: require.resolve('../../tsconfig.fake.json'),
      projectFolderIgnoreList: []
    }
  };

  if (config.ignorePatterns) {
    const patterns = Array.isArray(config.ignorePatterns)
      ? config.ignorePatterns
      : [config.ignorePatterns];

    extraConfig.ignorePatterns = patterns.filter(
      pattern => typeof pattern !== 'string'
    );
  }

  return getsertCache(
    createCliEngineCache,
    JSON.stringify(config),
    () =>
      new ESLint.CLIEngine({
        useEslintrc: false,
        ignorePath: pathToBlankFile,
        ignorePattern: ['!node_modules/*'],
        cache: false,
        envs: ['node'],
        baseConfig: {
          ...config,
          ...extraConfig
        }
      }),
    'createCLIEngine'
  );
};

interface ConfigInfo {
  deprecatedRules: ESLint.CLIEngine.DeprecatedRuleUse[];
  unknownRules: string[];
  errors: ESLintError[];
}

const mergeConfigInfo = (a: ConfigInfo, b: ConfigInfo): ConfigInfo => ({
  deprecatedRules: [...a.deprecatedRules, ...b.deprecatedRules],
  unknownRules: [...a.unknownRules, ...b.unknownRules],
  errors: [...a.errors, ...b.errors]
});

const ensureArray = <T>(v: T | T[] = []): T[] => (Array.isArray(v) ? v : [v]);

/**
 * Merges two ESLint configs, favoring the second config over the first.
 *
 * Merging is done at the top level only, and based on explicit named properties,
 * so any additional properties on either config will be lost.
 */
const mergeConfigs = (
  a: ESLint.Linter.Config,
  b: ESLint.Linter.Config
): ESLint.Linter.Config => ({
  parser: b.parser ?? a.parser,
  parserOptions: { ...a.parserOptions, ...b.parserOptions },
  processor: b.processor ?? a.processor,
  env: { ...a.env, ...b.env },
  globals: { ...a.globals, ...b.globals },
  plugins: [
    ...ensureArray(a.plugins),
    ...(Array.isArray(b.plugins) ? b.plugins : [])
  ],
  extends: [...ensureArray(a.extends), ...ensureArray(b.extends)],
  settings: { ...a.settings, ...b.settings },
  overrides: [...ensureArray(a.overrides), ...ensureArray(b.overrides)],
  rules: { ...a.rules, ...b.rules }
});

const extractRelevantConfigs = (
  config: ESLint.Linter.Config
): ESLint.Linter.Config[] => [
  { ...config, overrides: [] },
  ...(config.overrides ?? [])
    .map(override =>
      extractRelevantConfigs(
        mergeConfigs({ ...config, overrides: [], rules: {} }, override)
      )
    )
    .reduce((prev, curr) => prev.concat(curr), [])
];

export enum ESLintErrorType {
  FailedToLoadModule = 'FailedToLoadModule',
  InvalidRuleConfig = 'InvalidRuleConfig',
  ProcessorNotFound = 'ProcessorNotFound',
  FailedToExtend = 'FailedToExtend',
  InvalidConfig = 'InvalidConfig'
}

interface ESLintFailedToLoadModuleError {
  type: ESLintErrorType.FailedToLoadModule;
  kind: 'parser' | 'plugin' | string;
  name: string;
  path: string;
}

interface ESLintInvalidRuleConfigError {
  type: ESLintErrorType.InvalidRuleConfig;
  reason: string;
  ruleId: string;
  path: string;
}

interface ESLintProcessorNotFoundError {
  type: ESLintErrorType.ProcessorNotFound;
  name: string;
  path?: never;
}

interface ESLintFailedToExtendError {
  type: ESLintErrorType.FailedToExtend;
  name: string;
  path: string;
}

interface ESLintInvalidConfigError {
  type: ESLintErrorType.InvalidConfig;
  reason: string;
  path?: never;
}

export type ESLintError =
  | ESLintFailedToLoadModuleError
  | ESLintInvalidRuleConfigError
  | ESLintProcessorNotFoundError
  | ESLintFailedToExtendError
  | ESLintInvalidConfigError;

export type ESLintErrorParser = (error: Error) => ESLintError | null;

const tryParseAsFailedToLoadModuleError = (
  error: Error
): ESLintFailedToLoadModuleError | null => {
  // noinspection RegExpRedundantEscape
  const [, kind, name, path] =
    /Failed to load (.+) '(.*)' declared in 'BaseConfig((?:#overrides\[\d*?\])*)': Cannot find module '/isu.exec(
      error.message.trim()
    ) ?? [];

  return kind //
    ? { type: ESLintErrorType.FailedToLoadModule, kind, name, path }
    : null;
};

const tryParseAsInvalidRuleConfigError = (
  error: Error
): ESLintInvalidRuleConfigError | null => {
  // noinspection RegExpRedundantEscape
  const [, path, ruleId, reason] =
    /BaseConfig((?:#overrides\[\d*?\])*):\s+Configuration for rule "(.+)" is invalid:(.+)/isu.exec(
      error.message.trim()
    ) ?? [];

  return ruleId //
    ? { type: ESLintErrorType.InvalidRuleConfig, reason, ruleId, path }
    : null;
};

const tryParseAsFailedToExtendError = (
  error: Error
): ESLintFailedToExtendError | null => {
  // noinspection RegExpRedundantEscape
  const [, name, path] =
    /Failed to load config "(.+)" to extend from\.\nReferenced from: BaseConfig((?:#overrides\[\d*?\])*)/isu.exec(
      error.message.trim()
    ) ?? [];

  return name //
    ? { type: ESLintErrorType.FailedToExtend, name, path }
    : null;
};

const tryToParseAsProcessorNotFoundError = (
  error: Error
): ESLintProcessorNotFoundError | null => {
  const [, name] =
    /ESLint configuration of processor in '(?:.+)' is invalid: '(.+)' was not found\./isu.exec(
      error.message.trim()
    ) ?? [];

  return name //
    ? { type: ESLintErrorType.ProcessorNotFound, name }
    : null;
};

const tryParseAsInvalidConfigError = (
  error: Error
): ESLintInvalidConfigError | null => {
  const [, reason] =
    /ESLint configuration (?:.+) is invalid:(.+)/isu.exec(
      error.message.trim()
    ) ?? [];

  return reason //
    ? { type: ESLintErrorType.InvalidConfig, reason }
    : null;
};

const errorParsers: ESLintErrorParser[] = [
  tryParseAsFailedToLoadModuleError,
  tryParseAsInvalidRuleConfigError,
  tryToParseAsProcessorNotFoundError,
  tryParseAsFailedToExtendError,
  tryParseAsInvalidConfigError
];

const parseESLintError = (error: Error): ESLintError => {
  for (const errorParser of errorParsers) {
    const parsedError = errorParser(error);

    if (parsedError) {
      return parsedError;
    }
  }

  error.message = `Unable to parse error from ESLint: ${error.message}`;

  throw error;
};

const followErrorPathToConfig = (
  config: ESLint.Linter.Config,
  error: ESLintError
): ESLint.Linter.Config => {
  if (!error.path || !config.overrides) {
    return config;
  }

  const levels = error.path
    .substr(1)
    .split('#')
    .map(p => parseInt(p.substring(p.indexOf('[') + 1, p.length - 1)));

  /* istanbul ignore next */
  return levels.reduce((conf, i) => conf.overrides?.[i] ?? {}, config);
};

const tryRemoveErrorPointFromConfig = (
  config: ESLint.Linter.Config,
  error: ESLintError
): boolean => {
  const configToDeleteFrom = followErrorPathToConfig(config, error);

  if (error.type === ESLintErrorType.FailedToExtend) {
    if (typeof configToDeleteFrom.extends === 'string') {
      delete configToDeleteFrom.extends;

      return true;
    }

    configToDeleteFrom.extends = ensureArray(configToDeleteFrom.extends).filter(
      extend => extend !== error.name
    );

    return true;
  }

  if (error.type === ESLintErrorType.FailedToLoadModule) {
    switch (error.kind) {
      case 'plugin':
        configToDeleteFrom.plugins = configToDeleteFrom.plugins?.filter(
          plugin => plugin !== error.name
        );

        return true;
      case 'parser':
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete configToDeleteFrom[error.kind];

        return true;

      // no default
    }
  }

  if (error.type === ESLintErrorType.InvalidRuleConfig) {
    const { ruleId } = error;

    /* istanbul ignore if */
    if (!(configToDeleteFrom.rules && ruleId in configToDeleteFrom.rules)) {
      throw new Error('Cannot delete InvalidRuleConfig error - please report');
    }

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete configToDeleteFrom.rules[ruleId];

    return true;
  }

  return false;
};

const collectConfigInfoFromESLint = (
  config: ESLint.Linter.Config
): ConfigInfo => {
  const theConfig = { rules: {}, ...config };
  const errors: ESLintError[] = [];
  let counter = 0;

  do {
    /* istanbul ignore if */
    if ((counter += 1) > 20) {
      throw new Error('inf. loop detected - please report');
    }

    try {
      const results = createCLIEngine(theConfig).executeOnText(
        '',
        pathToBlankFile
      );

      return {
        deprecatedRules: results.usedDeprecatedRules,
        unknownRules: results.results[0].messages
          .filter(({ message }) =>
            /Definition for rule .+ was not found\./iu.test(message)
          )
          .map(({ ruleId }) => ruleId)
          .filter((ruleId): ruleId is string => !!ruleId),
        errors
      };
    } catch (error) {
      const eslintError = parseESLintError(error as Error);

      errors.push(eslintError);

      if (tryRemoveErrorPointFromConfig(theConfig, eslintError)) {
        continue;
      }

      return {
        deprecatedRules: [],
        unknownRules: [],
        errors
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition,no-constant-condition
  } while (true);
};

const collectConfigInfoCache = new Map<string, ConfigInfo>();

/**
 * Collects information about the given `config` using ESLint.
 *
 * Info about any `overrides` the `config` might have will be collected and
 * merged into the returned info object.
 */
const collectConfigInfo = (config: ESLint.Linter.Config): ConfigInfo => {
  return getsertCache(
    collectConfigInfoCache,
    JSON.stringify(config),
    () => collectConfigInfoFromESLint(config),
    'collectConfigInfo'
  );
};

const getConfigInfoCache = new Map<string, ConfigInfo>();

export const getConfigInfo = (configText: string): ConfigInfo => {
  return getsertCache(
    getConfigInfoCache,
    configText,
    () => {
      const config = compileConfigCode(configText);
      const topLevelInfo = collectConfigInfo(config);

      return (
        extractRelevantConfigs(config)
          .map(collectConfigInfo)
          .map(info => ({
            ...info,
            errors: info.errors.filter(
              error =>
                ![
                  ESLintErrorType.InvalidRuleConfig,
                  ESLintErrorType.InvalidConfig
                ].includes(error.type)
            )
          }))
          //
          .concat(topLevelInfo)
          .reduce(mergeConfigInfo)
      );
    },
    'getConfigInfo'
  );
};

export const tryGetConfigInfo = (configText: string): ConfigInfo | null => {
  try {
    return getConfigInfo(configText);
  } catch {
    return null;
  }
};
