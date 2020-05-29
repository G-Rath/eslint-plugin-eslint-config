# Checks for usage of deprecated eslint rules (`no-deprecated-rules`)

## Rule details

This rule checks for rules that have been marked as deprecated, and suggests
their replacements, if any.

Note that this rule, like others of its kind, works by mapping the results of
running the configs through ESLint to rule ids, and then checking every object
property in the file being linted against these rule ids.

This means that if a deprecated rule is used anywhere in the exported config,
then _all_ the places that rule id is used be highlighted.

For example:

```js
const rules = {
  '@typescript-eslint/camelcase': 'warn'
};

module.exports = {
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: ['*.tsx'],
      rules: {
        '@typescript-eslint/camelcase': 'off'
      }
    }
  ],
  rules: {
    '@typescript-eslint/camelcase': 'error'
  }
};
```

In the above configuration, all three `'@typescript-eslint/camelcase'`
properties would be marked.
