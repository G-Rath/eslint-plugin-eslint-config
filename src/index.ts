import ESLint from 'eslint';
import { readdirSync } from 'fs';
import { join, parse } from 'path';

const rulesDir = join(__dirname, 'rules');
const excludedFiles = ['utils', 'prefer-valid-rules', 'no-unneeded-rules'];

const rules = readdirSync(rulesDir)
  .map(rule => parse(rule).name)
  .filter(rule => !excludedFiles.includes(rule))
  .reduce(
    (acc, curr) =>
      // eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires,node/global-require
      Object.assign(acc, { [curr]: require(join(rulesDir, curr)) as unknown }),
    {}
  );

const allRules = Object.keys(rules).reduce<
  Record<string, ESLint.Linter.RuleLevel>
>(
  (theRules, key) => ({
    ...theRules,
    [`eslint-config/${key}`]: 'error'
  }),
  {}
);

interface PluginConfig extends ESLint.Linter.Config {
  plugins: ['eslint-config'];
}

const plugin: {
  configs: Record<
    'all' | 'recommended-rules',
    PluginConfig & Required<Pick<PluginConfig, 'rules'>>
  > &
    Record<string, PluginConfig>;
  rules: Record<string, ESLint.Rule.RuleModule>;
} = {
  configs: {
    'all': {
      plugins: ['eslint-config'],
      rules: allRules
    },
    'recommended-rules': {
      plugins: ['eslint-config'],
      rules: {
        'eslint-config/no-deprecated-rules': 'warn',
        'eslint-config/no-invalid-config': 'error',
        'eslint-config/no-unknown-rules': 'error'
      }
    },
    'rc': {
      plugins: ['eslint-config'],
      overrides: [
        {
          files: ['.eslintrc.js'],
          rules: {
            'eslint-config/no-deprecated-rules': 'warn'
          }
        }
      ]
    }
  },
  rules
};

export = plugin;
