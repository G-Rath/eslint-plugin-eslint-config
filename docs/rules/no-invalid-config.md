# Checks that the config exported by a file is valid (`no-invalid-config`)

## Rule details

This rule ensures that the export of the file being linted is considered a valid
config file for ESLint.

This is done using ESLint itself, and then processing the output, meaning it
should work for all ESLint versions. This does mean that any packages such as
plugins or configs used by the exported config must be installed.

Typically, any generic error thrown by ESLint is reported at the top of the
file, but some errors, such as missing plugins or mis-configured rules, have
special support, and will be reported on _all_ string literals or identifiers
that match.

This is done as a middle ground, as it's not possible to accurate determine the
exact section in the config that is considered invalid.

For example:

```js
const rules = {
  'react/no-unknown-property': 'warn'
};

module.exports = {
  plugins: ['react'],
  overrides: [
    {
      files: ['*.tsx'],
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
