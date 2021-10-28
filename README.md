<div align="center">
  <a href="https://eslint.org/">
    <img
      width="150"
      height="150"
      src="https://eslint.org/assets/img/logo.svg"
      alt="ESLint Logo"
    />
  </a>
  <h1>eslint-plugin-eslint-config</h1>
  <p>ESLint plugin for ESLint configs</p>
</div>

This plugin provides rules for linting files that export configs meant for use
with ESLint, to ensure that they're valid.

## Installation

    npm install --dev eslint eslint-plugin-eslint-config

**Note:** If you installed ESLint globally then you must also install
`eslint-plugin-eslint-config` globally.

## Usage

Add `config` to the plugins section of your `.eslintrc.js` configuration file.
You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": ["eslint-config"]
}
```

Then configure the rules you want to use _for your config(s)_ using `overrides`:

```json
{
  "overrides": [
    {
      "files": [".eslintrc.js", "react.js", "@typescript-eslint.js"],
      "rules": {
        "eslint-config/no-deprecated-rules": "warn"
      }
    }
  ]
}
```

The rules assume that the files they're linting are configs meant for ESLint.
Also note that while ESLint can be configured using JSON and YAML files, it
doesn't support linting those file types meaning this plugin will not work if
you're not using a `.js` config file.

## Shareable configurations

This plugin provides three presets:

- `recommended-rules`
- `rc`
- `all`

The `rc` preset generally should be used by all projects, as it applies
recommended rules to supported eslintrc files.

If a project contains other files that export eslint configs (such as an eslint
config package), the `recommended-rules` preset can be used to apply the
recommended rules to those files using `overrides`.

<!-- The reason behind having two presets instead of the standard `recommended`
preset is because the rules provided by this plugin work by executing the source
code that they're linting to capture the configuration they export that gets
used by eslint.

This means that they can trigger side effects in the same way importing a file
might, and so should not be applied to every file in a code base.

To facilitate this ESLint allows configs to provide an `overrides` property that
applies rules to files based on globs (which is what `eslint-config/rc` does),
but while shared configs can use `overrides` there isn't a way to nicely to add
to the glob patterns to reuse the rules. -->

While the `recommended-rules` and `rc` presets only change in major versions,
the `all` preset may change in any release and is thus unsuited for
installations requiring long-term consistency.

## Rules

<!-- begin rules list -->

| Rule                                                     | Description                                         | Configurations   | Fixable      |
| -------------------------------------------------------- | --------------------------------------------------- | ---------------- | ------------ |
| [no-deprecated-rules](docs/rules/no-deprecated-rules.md) | Checks for usage of deprecated eslint rules         | ![recommended][] |              |
| [no-invalid-config](docs/rules/no-invalid-config.md)     | Checks that the config exported by a file is valid  | ![recommended][] |              |
| [no-unknown-rules](docs/rules/no-unknown-rules.md)       | Ensures that all rules are known                    | ![recommended][] |              |
| [sort-rules](docs/rules/sort-rules.md)                   | Ensures that rules are sorted in a consistent order |                  | ![fixable][] |

<!-- end rules list -->

[recommended]: https://img.shields.io/badge/-recommended-lightgrey.svg
[fixable]: https://img.shields.io/badge/-fixable-green.svg
