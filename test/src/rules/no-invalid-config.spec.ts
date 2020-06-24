import { TSESLint } from '@typescript-eslint/experimental-utils';
import dedent from 'dedent';
import rule from '../../../src/rules/no-invalid-config';
import { ESLintError, ESLintErrorType } from '../../../src/rules/utils';
import { RuleTester, mockEslintPluginPrettier } from '../../helpers';

const ruleTester = new RuleTester();

mockEslintPluginPrettier();

const expectedError = ({
  line,
  column,
  ...error
}: ESLintError & {
  line: number;
  column: number;
}): TSESLint.TestCaseError<ESLintError['type']> => ({
  messageId: error.type,
  data: { ...error },
  line,
  column
});

ruleTester.run('no-invalid-config', rule, {
  valid: [
    'module.exports = undefined;',
    'module.exports = "";',
    dedent`
      const { files } = require('./package.json');

      module.exports = {
        env: { node: true },
        overrides: [{ files, rules: { 'no-sync': 'off' } }]
      };
    `,
    dedent`
      const o = {
        '@typescript-eslint/array-type': 'error'
      }

      module.exports = {
        rules: {
          'no-shadow': 'error'
        }
      }
    `,
    dedent`
      const o = {
        '@typescript-eslint/array-type': 'error'
      }

      module.exports = {
        plugins: ['@typescript-eslint'],
        rules: {
          '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
          'spaced-comment': [
            'warn',
            'always',
            {
              markers: ['=', '#region'],
              exceptions: ['#endregion']
            }
          ]
        }
      }
    `
  ],
  invalid: [
    {
      code: 'module.exports = config',
      errors: [
        {
          messageId: 'UnknownError',
          data: { message: 'config is not defined' },
          line: 1,
          column: 1
        }
      ]
    },
    {
      code: dedent`
        module.exports = {
          plugins: ['prettier'],
          rules: { 'prettier/erroneous-rule': 'error' }
        }
      `,
      errors: [
        {
          messageId: 'UnknownError',
          data: {
            message: dedent`
              Unable to parse error from ESLint: Error while loading rule 'prettier/erroneous-rule': explosions!
              Occurred while linting ${require.resolve('../../../src/blank.js')}
            `.trim()
          },
          line: 1,
          column: 1
        }
      ]
    }
  ]
});

ruleTester.run('FailedToLoadModule', rule, {
  valid: ['module.exports = { parser: "" }'],
  invalid: [
    {
      code: 'module.exports = { parser: "@typescript-eslint/eslint-parser" }',
      errors: [
        expectedError({
          type: ESLintErrorType.FailedToLoadModule,
          name: '@typescript-eslint/eslint-parser',
          kind: 'parser',
          path: '',
          line: 1,
          column: 28
        })
      ]
    },
    {
      code: 'module.exports = { plugins: [""] }',
      errors: [
        expectedError({
          type: ESLintErrorType.FailedToLoadModule,
          name: '',
          kind: 'plugin',
          path: '',
          line: 1,
          column: 30
        })
      ]
    },
    {
      code: 'module.exports = { plugins: ["not-react"] }',
      errors: [
        expectedError({
          type: ESLintErrorType.FailedToLoadModule,
          name: 'not-react',
          kind: 'plugin',
          path: '',
          line: 1,
          column: 30
        })
      ]
    },
    {
      code: dedent`
        module.exports = {
          overrides: [
            {
              files: ['*.js'],
              plugins: ['not-react']
            }
          ]
        };
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.FailedToLoadModule,
          name: 'not-react',
          kind: 'plugin',
          path: '#overrides[0]',
          line: 5,
          column: 17
        })
      ]
    },
    {
      code: dedent`
        module.exports = {
          overrides: [
            {
              files: ['*.js'],
              parser: '@typescript-eslint/eslint-parser'
            }
          ]
        };
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.FailedToLoadModule,
          name: '@typescript-eslint/eslint-parser',
          kind: 'parser',
          path: '#overrides[0]',
          line: 5,
          column: 15
        })
      ]
    },
    {
      code: dedent`
        module.exports = {
          overrides: [
            {
              files: ['*'],
              parser: '@typescript-eslint/eslint-parser'
            }
          ]
        };
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.FailedToLoadModule,
          name: '@typescript-eslint/eslint-parser',
          kind: 'parser',
          path: '#overrides[0]',
          line: 5,
          column: 15
        })
      ]
    }
  ]
});

ruleTester.run('InvalidRuleConfig', rule, {
  valid: [
    dedent`
      module.exports = {
        overrides: [
          {
            files: ['*.tsx'],
            rules: {
              camelcase: ['error', { allow: ['child_process'] }],
            }
          }
        ],
        rules: {
          camelcase: ['error', { allow: ['child_process'] }],
        }
      };
    `
  ],
  invalid: [
    {
      code: dedent`
        module.exports = {
          rules: {
            [null]: 'warning',
          }
        };
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.InvalidRuleConfig,
          ruleId: 'null',
          reason:
            '\n\tSeverity should be one of the following: 0 = off, 1 = warn, 2 = error (you passed \'"warning"\').',
          path: '',
          line: 3,
          column: 6
        })
      ]
    },
    {
      code: dedent`
        module.exports = {
          rules: {
            [\`camelcase\`]: ['error', { ignore: ['child_process'] }],
          }
        };
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.InvalidRuleConfig,
          ruleId: 'camelcase',
          reason:
            '\n\tValue {"ignore":["child_process"],"ignoreDestructuring":false,"ignoreImports":false} should NOT have additional properties.',
          path: '',
          line: 3,
          column: 6
        })
      ]
    },
    {
      code: dedent`
        module.exports = {
          rules: {
            camelcase: ['error', { ignore: ['child_process'] }],
          }
        };
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.InvalidRuleConfig,
          ruleId: 'camelcase',
          reason:
            '\n\tValue {"ignore":["child_process"],"ignoreDestructuring":false,"ignoreImports":false} should NOT have additional properties.',
          path: '',
          line: 3,
          column: 5
        })
      ]
    },
    {
      code: dedent`
        module.exports = {
          overrides: [
            {
              files: ['*'],
              overrides: [
                {
                  files: ['*'],
                  rules: {
                    camelcase: ['error', { ignore: ['child_process'] }]
                  }
                }
              ]
            }
          ]
        };
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.InvalidRuleConfig,
          ruleId: 'camelcase',
          reason:
            '\n\tValue {"ignore":["child_process"],"ignoreDestructuring":false,"ignoreImports":false} should NOT have additional properties.',
          path: '',
          line: 9,
          column: 13
        })
      ]
    },
    {
      code: dedent`
        module.exports = {
          overrides: [
            {
              files: ['*.tsx'],
              rules: {
                camelcase: ['error', { ignore: ['child_process'] }],
              }
            }
          ],
          rules: {
            camelcase: ['error', { ignore: ['child_process'] }],
          }
        };
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.InvalidRuleConfig,
          ruleId: 'camelcase',
          reason:
            '\n\tValue {"ignore":["child_process"],"ignoreDestructuring":false,"ignoreImports":false} should NOT have additional properties.',
          path: '',
          line: 6,
          column: 9
        }),
        expectedError({
          type: ESLintErrorType.InvalidRuleConfig,
          ruleId: 'camelcase',
          reason:
            '\n\tValue {"ignore":["child_process"],"ignoreDestructuring":false,"ignoreImports":false} should NOT have additional properties.',
          path: '#overrides[0]',
          line: 11,
          column: 5
        })
      ]
    },
    {
      code: dedent`
        module.exports = {
          overrides: [
            {
              files: ['*.tsx'],
              rules: {
                camelcase: ['error', { ignore: ['child_process'] }],
              }
            }
          ],
          rules: {
            camelcase: ['error', { allow: ['child_process'] }],
          }
        };
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.InvalidRuleConfig,
          ruleId: 'camelcase',
          reason:
            '\n\tValue {"ignore":["child_process"],"ignoreDestructuring":false,"ignoreImports":false} should NOT have additional properties.',
          path: '',
          line: 6,
          column: 9
        }),
        expectedError({
          type: ESLintErrorType.InvalidRuleConfig,
          ruleId: 'camelcase',
          reason:
            '\n\tValue {"ignore":["child_process"],"ignoreDestructuring":false,"ignoreImports":false} should NOT have additional properties.',
          path: '#overrides[0]',
          line: 11,
          column: 5
        })
      ]
    },
    {
      code: dedent`
        module.exports = {
          overrides: [
            {
              files: ['*.tsx'],
              rules: {
                camelcase: ['error', { allow: ['child_process'] }],
              }
            }
          ],
          rules: {
            camelcase: ['error', { ignore: ['child_process'] }],
          }
        };
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.InvalidRuleConfig,
          ruleId: 'camelcase',
          reason:
            '\n\tValue {"ignore":["child_process"],"ignoreDestructuring":false,"ignoreImports":false} should NOT have additional properties.',
          path: '',
          line: 6,
          column: 9
        }),
        expectedError({
          type: ESLintErrorType.InvalidRuleConfig,
          ruleId: 'camelcase',
          reason:
            '\n\tValue {"ignore":["child_process"],"ignoreDestructuring":false,"ignoreImports":false} should NOT have additional properties.',
          path: '#overrides[0]',
          line: 11,
          column: 5
        })
      ]
    }
  ]
});

ruleTester.run('ProcessorNotFound', rule, {
  valid: ['module.exports = { processor: "" }'],
  invalid: [
    {
      code: 'module.exports = { processor: "@typescript-eslint/processor" }',
      errors: [
        expectedError({
          type: ESLintErrorType.ProcessorNotFound,
          name: '@typescript-eslint/processor',
          line: 1,
          column: 31
        })
      ]
    },
    {
      code: 'module.exports = { processor: `@typescript-eslint/processor` }',
      errors: [
        expectedError({
          type: ESLintErrorType.ProcessorNotFound,
          name: '@typescript-eslint/processor',
          line: 1,
          column: 31
        })
      ]
    },
    {
      code: dedent`
        module.exports = {
          overrides: [
            {
              files: ['*'],
              processor: '@typescript-eslint/processor'
            }
          ]
        };
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.ProcessorNotFound,
          name: '@typescript-eslint/processor',
          line: 5,
          column: 18
        })
      ]
    }
  ]
});

ruleTester.run('FailedToExtend', rule, {
  valid: [
    'module.exports = { extends: "" }',
    'module.exports = { extends: "eslint:recommended" }',
    'module.exports = { extends: ["eslint:recommended"] }'
  ],
  invalid: [
    {
      code: 'module.exports = { extends: "hello-world" }',
      errors: [
        expectedError({
          type: ESLintErrorType.FailedToExtend,
          name: 'hello-world',
          path: '',
          line: 1,
          column: 29
        })
      ]
    },
    {
      code: 'module.exports = { extends: ["hello-world"] }',
      errors: [
        expectedError({
          type: ESLintErrorType.FailedToExtend,
          name: 'hello-world',
          path: '',
          line: 1,
          column: 30
        })
      ]
    },
    {
      code:
        'module.exports = { extends: ["eslint:recommended", "hello-world"] }',
      errors: [
        expectedError({
          type: ESLintErrorType.FailedToExtend,
          name: 'hello-world',
          path: '',
          line: 1,
          column: 52
        })
      ]
    },
    {
      code: dedent`
        module.exports = {
          overrides: [{ extends: "hello-world" }]
        }
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.InvalidConfig,
          reason:
            '\n\t- "overrides[0]" should have required property \'files\'. Value: {"extends":"hello-world"}.',
          line: 1,
          column: 1
        }),
        expectedError({
          type: ESLintErrorType.FailedToExtend,
          name: 'hello-world',
          path: '',
          line: 2,
          column: 26
        })
      ]
    },
    {
      code: dedent`
        module.exports = {
          overrides: [{ extends: ["hello-world"] }]
        }
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.InvalidConfig,
          reason:
            '\n\t- "overrides[0]" should have required property \'files\'. Value: {"extends":["hello-world"]}.',
          line: 1,
          column: 1
        }),
        expectedError({
          type: ESLintErrorType.FailedToExtend,
          name: 'hello-world',
          path: '#overrides[0]',
          line: 2,
          column: 27
        })
      ]
    },
    {
      code: dedent`
        module.exports = {
          overrides: [{ files: ['*.ts'], extends: ['hello-world'] }]
        }
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.FailedToExtend,
          name: 'hello-world',
          path: '#overrides[0]',
          line: 2,
          column: 44
        })
      ]
    },
    {
      code: dedent`
        module.exports = {
          extends: "eslint:recommended",
          overrides: [{ extends: ["hello-world"] }]
        }
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.InvalidConfig,
          reason:
            '\n\t- "overrides[0]" should have required property \'files\'. Value: {"extends":["hello-world"]}.',
          line: 1,
          column: 1
        }),
        expectedError({
          type: ESLintErrorType.FailedToExtend,
          name: 'hello-world',
          path: '#overrides[0]',
          line: 3,
          column: 27
        })
      ]
    },
    {
      code: dedent`
        module.exports = {
          extends: "eslint:recommended",
          overrides: [{ extends: ["hello-world", "hello-sunshine"] }]
        }
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.InvalidConfig,
          reason:
            '\n\t- "overrides[0]" should have required property \'files\'. Value: {"extends":["hello-world","hello-sunshine"]}.',
          line: 1,
          column: 1
        }),
        expectedError({
          type: ESLintErrorType.FailedToExtend,
          name: 'hello-world',
          path: '#overrides[0]',
          line: 3,
          column: 27
        }),
        expectedError({
          type: ESLintErrorType.FailedToExtend,
          name: 'hello-sunshine',
          path: '#overrides[0]',
          line: 3,
          column: 42
        })
      ]
    },
    {
      code: dedent`
        module.exports = {
          extends: ["hello-world", "hello-sunshine"],
          overrides: [{  }]
        }
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.InvalidConfig,
          reason:
            '\n\t- "overrides[0]" should have required property \'files\'. Value: {}.',
          line: 1,
          column: 1
        }),
        expectedError({
          type: ESLintErrorType.FailedToExtend,
          name: 'hello-world',
          path: '',
          line: 2,
          column: 13
        }),
        expectedError({
          type: ESLintErrorType.FailedToExtend,
          name: 'hello-sunshine',
          path: '',
          line: 2,
          column: 28
        })
      ]
    },
    {
      code: dedent`
        module.exports = {
          extends: ["hello-world"],
          overrides: [{ files: ["*"], extends: ["hello-sunshine"] }]
        }
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.FailedToExtend,
          name: 'hello-world',
          path: '',
          line: 2,
          column: 13
        }),
        expectedError({
          type: ESLintErrorType.FailedToExtend,
          name: 'hello-sunshine',
          path: '#overrides[0]',
          line: 3,
          column: 41
        })
      ]
    }
  ]
});

ruleTester.run('InvalidConfig', rule, {
  valid: [],
  invalid: [
    {
      code: 'module.exports = { parser: [""] }',
      errors: [
        expectedError({
          type: ESLintErrorType.InvalidConfig,
          reason:
            '\n\t- Property "parser" is the wrong type (expected string/null but got `[""]`).',
          line: 1,
          column: 1
        })
      ]
    },
    {
      code: dedent`
        const v = { p: 1 };

        module.exports = { ...v };
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.InvalidConfig,
          reason: '\n\t- Unexpected top-level property "p".',
          line: 1,
          column: 1
        })
      ]
    },
    {
      code: dedent`
        module.exports = {
          overrides: [{ extends: ["eslint:recommended"] }]
        }
      `,
      errors: [
        expectedError({
          type: ESLintErrorType.InvalidConfig,
          reason:
            '\n\t- "overrides[0]" should have required property \'files\'. Value: {"extends":["eslint:recommended"]}.',
          line: 1,
          column: 1
        })
      ]
    }
  ]
});
