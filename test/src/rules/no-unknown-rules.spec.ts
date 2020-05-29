import dedent from 'dedent';
import rule from '../../../src/rules/no-unknown-rules';
import {
  RuleTester,
  mockEslintPluginPrettier,
  validConfigSamples
} from '../../helpers';

const ruleTester = new RuleTester();

mockEslintPluginPrettier();

ruleTester.run('no-unknown-rules', rule, {
  valid: [
    ...validConfigSamples,
    'module.exports = { invalidProperty: "oh noes!" };',
    'module.exports = { ...iDoNotExist };',
    'module.exports = { rules: { [null]: "error" } };',
    'module.exports = { rules: { "no-shadow": "error" } };',
    'const o = { rules: { "no-shadow": "error" } };'
  ],
  invalid: [
    {
      code: 'module.exports = { rules: { 1: "error" } };',
      errors: [
        {
          messageId: 'unknownRule',
          data: { ruleId: 1 },
          line: 1,
          column: 29
        }
      ]
    },
    {
      code: dedent`
        const rules = { 'react/no-danger': 'error' };

        module.exports = { rules };
      `,
      errors: [
        {
          messageId: 'unknownRule',
          data: { ruleId: 'react/no-danger' },
          line: 1,
          column: 17
        }
      ]
    },
    {
      code: dedent`
        const rules = { 'react/no-danger': 'error' };

        module.exports = {
          rules: {
            'react/no-danger': 'error',
            'no-shadow': 'error'
          }
        };
      `,
      errors: [
        {
          messageId: 'unknownRule',
          data: { ruleId: 'react/no-danger' },
          line: 1,
          column: 17
        },
        {
          messageId: 'unknownRule',
          data: { ruleId: 'react/no-danger' },
          line: 5,
          column: 5
        }
      ]
    },
    {
      code: dedent`
        module.exports = {
          plugins: ['prettier'],
          rules: {
            'prettier/deprecated-rule': 'error',
            'react/no-danger': 'error'
          }
        };
      `,
      errors: [
        {
          messageId: 'unknownRule',
          data: { ruleId: 'react/no-danger' },
          line: 5,
          column: 5
        }
      ]
    },
    {
      code: dedent`
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
          messageId: 'unknownRule',
          data: { ruleId: 'prettier/deprecated-rule' },
          line: 7,
          column: 9
        },
        {
          messageId: 'unknownRule',
          data: { ruleId: 'prettier/deprecated-rule' },
          line: 12,
          column: 5
        }
      ]
    }
  ]
});
