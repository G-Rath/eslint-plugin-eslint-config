import dedent from 'dedent';
import rule from '../../../src/rules/no-deprecated-rules';
import {
  RuleTester,
  mockEslintPluginPrettier,
  validConfigSamples
} from '../../helpers';

const ruleTester = new RuleTester();

mockEslintPluginPrettier();

ruleTester.run('no-deprecated-rules', rule, {
  valid: [
    ...validConfigSamples,
    'module.exports = { ...iDoNotExist };',
    'module.exports = { invalidProperty: "oh noes!" };',
    'module.exports = { rules: { [null]: "error" } };',
    'module.exports = { rules: { "no-shadow": "error" } };',
    'const o = { rules: { "no-shadow": "error" } };',
    dedent`
      module.exports = {
        rules: {
          'camelcase': ['error', { ignore: ['child_process'] }],
        }
      };
    `
  ],
  invalid: [
    {
      code: dedent`
        module.exports = {
          rules: {
            'no-shadow': 'error',
            'newline-before-return': 'error'
          }
        };
      `,
      errors: [
        {
          messageId: 'deprecatedRule',
          data: {
            ruleId: 'newline-before-return',
            replacedBy: 'padding-line-between-statements'
          },
          line: 4,
          column: 5,
          suggestions: [
            {
              messageId: 'suggestReplaceWith',
              data: { replacement: 'padding-line-between-statements' },
              output: dedent`
                module.exports = {
                  rules: {
                    'no-shadow': 'error',
                    'padding-line-between-statements': 'error'
                  }
                };
              `
            }
          ]
        }
      ]
    },
    {
      code: dedent`
        const rules = {
          'no-shadow': 'error',
          'newline-before-return': 'error'
        };

        module.exports = { rules };
      `,
      errors: [
        {
          messageId: 'deprecatedRule',
          data: {
            ruleId: 'newline-before-return',
            replacedBy: 'padding-line-between-statements'
          },
          line: 3,
          column: 3,
          suggestions: [
            {
              messageId: 'suggestReplaceWith',
              data: { replacement: 'padding-line-between-statements' },
              output: dedent`
                const rules = {
                  'no-shadow': 'error',
                  'padding-line-between-statements': 'error'
                };

                module.exports = { rules };
              `
            }
          ]
        }
      ]
    },
    {
      code: dedent`
        const rules = {
          'newline-before-return': 'error'
        };

        module.exports = {
          rules: {
            'newline-before-return': 'error',
            'no-shadow': 'error'
          }
        };
      `,
      errors: [
        {
          messageId: 'deprecatedRule',
          data: {
            ruleId: 'newline-before-return',
            replacedBy: 'padding-line-between-statements'
          },
          line: 2,
          column: 3,
          suggestions: [
            {
              messageId: 'suggestReplaceWith',
              data: { replacement: 'padding-line-between-statements' },
              output: dedent`
                const rules = {
                  'padding-line-between-statements': 'error'
                };

                module.exports = {
                  rules: {
                    'newline-before-return': 'error',
                    'no-shadow': 'error'
                  }
                };
              `
            }
          ]
        },
        {
          messageId: 'deprecatedRule',
          data: {
            ruleId: 'newline-before-return',
            replacedBy: 'padding-line-between-statements'
          },
          line: 7,
          column: 5,
          suggestions: [
            {
              messageId: 'suggestReplaceWith',
              data: { replacement: 'padding-line-between-statements' },
              output: dedent`
                const rules = {
                  'newline-before-return': 'error'
                };

                module.exports = {
                  rules: {
                    'padding-line-between-statements': 'error',
                    'no-shadow': 'error'
                  }
                };
              `
            }
          ]
        }
      ]
    },
    {
      code: dedent`
        module.exports = {
          rules: {
            'newline-before-return': 'error'
          }
        };
      `,
      errors: [
        {
          messageId: 'deprecatedRule',
          data: {
            ruleId: 'newline-before-return',
            replacedBy: 'padding-line-between-statements'
          },
          line: 3,
          column: 5,
          suggestions: [
            {
              messageId: 'suggestReplaceWith',
              data: { replacement: 'padding-line-between-statements' },
              output: dedent`
                module.exports = {
                  rules: {
                    'padding-line-between-statements': 'error'
                  }
                };
              `
            }
          ]
        }
      ]
    },
    {
      code: dedent`
        module.exports = {
          plugins: ['prettier'],
          rules: {
            'prettier/deprecated-rule': 'error'
          }
        };
      `,
      errors: [
        {
          messageId: 'deprecatedRule',
          data: {
            ruleId: 'prettier/deprecated-rule',
            replacedBy: 'replacement-rule'
          },
          line: 4,
          column: 5,
          suggestions: [
            {
              messageId: 'suggestReplaceWith',
              data: { replacement: 'prettier/replacement-rule' },
              output: dedent`
                module.exports = {
                  plugins: ['prettier'],
                  rules: {
                    'prettier/replacement-rule': 'error'
                  }
                };
              `
            }
          ]
        }
      ]
    },
    {
      code: dedent`
        const moreRules = {
          'newline-before-return': 'error'
        }

        module.exports = {
          plugins: ['prettier'],
          rules: {
            'prettier/deprecated-rule': 'error',
            ...moreRules
          }
        };
      `,
      errors: [
        {
          messageId: 'deprecatedRule',
          data: {
            ruleId: 'newline-before-return',
            replacedBy: 'padding-line-between-statements'
          },
          line: 2,
          column: 3,
          suggestions: [
            {
              messageId: 'suggestReplaceWith',
              data: { replacement: 'padding-line-between-statements' },
              output: dedent`
                const moreRules = {
                  'padding-line-between-statements': 'error'
                }

                module.exports = {
                  plugins: ['prettier'],
                  rules: {
                    'prettier/deprecated-rule': 'error',
                    ...moreRules
                  }
                };
              `
            }
          ]
        },
        {
          messageId: 'deprecatedRule',
          data: {
            ruleId: 'prettier/deprecated-rule',
            replacedBy: 'replacement-rule'
          },
          line: 8,
          column: 5,
          suggestions: [
            {
              messageId: 'suggestReplaceWith',
              data: { replacement: 'prettier/replacement-rule' },
              output: dedent`
                const moreRules = {
                  'newline-before-return': 'error'
                }

                module.exports = {
                  plugins: ['prettier'],
                  rules: {
                    'prettier/replacement-rule': 'error',
                    ...moreRules
                  }
                };
              `
            }
          ]
        }
      ]
    },
    {
      code: dedent`
        const moreRules = {
          'react/no-danger': 'error'
        }

        module.exports = {
          plugins: ['prettier'],
          rules: {
            'prettier/deprecated-rule': 'error',
            ...moreRules
          }
        };
      `,
      errors: [
        {
          messageId: 'deprecatedRule',
          data: {
            ruleId: 'prettier/deprecated-rule',
            replacedBy: 'replacement-rule'
          },
          line: 8,
          column: 5,
          suggestions: [
            {
              messageId: 'suggestReplaceWith',
              data: { replacement: 'prettier/replacement-rule' },
              output: dedent`
                const moreRules = {
                  'react/no-danger': 'error'
                }

                module.exports = {
                  plugins: ['prettier'],
                  rules: {
                    'prettier/replacement-rule': 'error',
                    ...moreRules
                  }
                };
              `
            }
          ]
        }
      ]
    },
    {
      code: dedent`
        const moreRules = {
          'react/no-danger': 'error'
        }

        module.exports = {
          overrides: [
            {
              files: ['*.tsx'],
              plugins: ['prettier'],
              rules: {
                'prettier/deprecated-rule': 'error'
              }
            }
          ],
          rules: {
            'prettier/deprecated-rule': 'error'
          }
        };
      `,
      errors: [
        {
          messageId: 'deprecatedRule',
          data: {
            ruleId: 'prettier/deprecated-rule',
            replacedBy: 'replacement-rule'
          },
          line: 11,
          column: 9,
          suggestions: [
            {
              messageId: 'suggestReplaceWith',
              data: { replacement: 'prettier/replacement-rule' },
              output: dedent`
                const moreRules = {
                  'react/no-danger': 'error'
                }

                module.exports = {
                  overrides: [
                    {
                      files: ['*.tsx'],
                      plugins: ['prettier'],
                      rules: {
                        'prettier/replacement-rule': 'error'
                      }
                    }
                  ],
                  rules: {
                    'prettier/deprecated-rule': 'error'
                  }
                };
              `
            }
          ]
        },
        {
          messageId: 'deprecatedRule',
          data: {
            ruleId: 'prettier/deprecated-rule',
            replacedBy: 'replacement-rule'
          },
          line: 16,
          column: 5,
          suggestions: [
            {
              messageId: 'suggestReplaceWith',
              data: { replacement: 'prettier/replacement-rule' },
              output: dedent`
                const moreRules = {
                  'react/no-danger': 'error'
                }

                module.exports = {
                  overrides: [
                    {
                      files: ['*.tsx'],
                      plugins: ['prettier'],
                      rules: {
                        'prettier/deprecated-rule': 'error'
                      }
                    }
                  ],
                  rules: {
                    'prettier/replacement-rule': 'error'
                  }
                };
              `
            }
          ]
        }
      ]
    }
  ]
});
