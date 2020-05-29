# Ensures that all rules are known (`no-unknown-rules`)

## Rule details

This rule checks that the rules named in a configuration exist at linting time.

Note that this rule, like others of its kind, works by mapping the results of
running the configs through ESLint to rule ids, and then checking every object
property in the file being linted against these rule ids.

This means that if an unknown rule is used anywhere in the exported config, then
_all_ the places that rule id is used be highlighted.

For example:

```js
const rules = {
  'react/no-unknown-property': 'warn'
};

module.exports = {
  overrides: [
    {
      files: ['*.tsx'],
      plugins: ['react'],
      rules: {
        'react/no-unknown-property': 'off'
      }
    }
  ],
  rules: {
    'react/no-unknown-property': ['error', { allow: ['class'] }]
  }
};
```

In the above configuration, all three `'react/no-unknown-property'` properties
would be marked with an error, due to the last configuration of the rule.
