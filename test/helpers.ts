import { ESLintUtils, TSESLint } from '@typescript-eslint/experimental-utils';
import dedent from 'dedent';
import requireRelative from 'require-relative';

export class RuleTester extends TSESLint.RuleTester {
  public constructor() {
    super({
      parser: requireRelative.resolve('espree', require.resolve('eslint')),
      parserOptions: { sourceType: 'module', ecmaVersion: 2018 }
    });
  }
}

export const validConfigSamples = [
  'module.exports = { rules: { "no-shadow": "error" } };',
  dedent`
    const o = { '@typescript-eslint/array-type': 'error' }

    module.exports = { rules: { 'no-shadow': 'error' } };
  `,
  dedent`
    module.exports = {
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      }
    }
  `,
  dedent`
    const ruleName = '@typescript-eslint/array-type';

    module.exports = {
      plugins: ['@typescript-eslint'],
      rules: {
        [ruleName]: ['error', { default: 'array-simple' }],
      }
    }
  `,
  dedent`
    const o = { '@typescript-eslint/array-type': 'error' }

    module.exports = {
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
        'spaced-comment': [
          'warn',
          'always',
          { markers: ['=', '#region'], exceptions: ['#endregion'] }
        ]
      }
    }
  `,
  dedent`
    const packageJson = require(require.resolve('./package.json'));

    module.exports = {};
  `,
  dedent`
    module.exports = {
      extends: [],
      overrides: [{ files: [], extends: [] }]
    };
  `,
  dedent`
    module.exports = {
      extends: 'eslint:recommended',
      overrides: [{ files: [], extends: 'eslint:recommended' }]
    };
  `
];

export const mockEslintPluginPrettier = (): void => {
  jest.doMock('eslint-plugin-prettier', () => {
    return {
      rules: {
        'deprecated-rule': ESLintUtils.RuleCreator(name => name)({
          name: __filename,
          meta: {
            type: 'problem',
            docs: {
              description: 'Fake rule that is deprecated, for use in testing',
              recommended: 'warn'
            },
            deprecated: true,
            replacedBy: ['replacement-rule'],
            messages: {},
            schema: []
          },
          defaultOptions: [],
          create() {
            return {};
          }
        }),
        'erroneous-rule': ESLintUtils.RuleCreator(name => name)({
          name: __filename,
          meta: {
            type: 'problem',
            docs: {
              description: 'Fake rule that always throws, for use in testing',
              recommended: 'warn'
            },
            messages: {},
            schema: []
          },
          defaultOptions: [],
          create() {
            throw new Error('explosions!');
          }
        })
      }
    };
  });
};
