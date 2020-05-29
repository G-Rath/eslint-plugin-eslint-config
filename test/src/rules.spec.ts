import { TSESLint } from '@typescript-eslint/experimental-utils';
import { existsSync } from 'fs';
import { resolve } from 'path';
import plugin from '../../src';

const ruleNames = Object.keys(plugin.rules);
const numberOfRules = 4;

const requireRule = (name: string): TSESLint.RuleModule<string, unknown[]> =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports,global-require
  require(`../../src/rules/${name}`) as TSESLint.RuleModule<string, unknown[]>;

describe('rules', () => {
  describe.each(ruleNames)('%s', rule => {
    it('should have a corresponding doc', () => {
      const docPath = resolve(
        __dirname,
        '..',
        '..',
        'docs',
        'rules',
        `${rule}.md`
      );

      expect(() => {
        if (!existsSync(docPath)) {
          throw new Error(
            `Could not find documentation file for rule "${rule}" in path "${docPath}"`
          );
        }
      }).not.toThrow();
    });

    it('should have a corresponding spec', () => {
      const specPath = resolve(__dirname, 'rules', `${rule}.spec.ts`);

      expect(() => {
        if (!existsSync(specPath)) {
          throw new Error(
            `Could not find spec file for rule "${rule}" in path "${specPath}"`
          );
        }
      }).not.toThrow();
    });
  });

  it('should have the correct amount of rules', () => {
    const { length } = ruleNames;

    expect(() => {
      if (length !== numberOfRules) {
        throw new Error(
          `There should be exactly ${numberOfRules} rules, but there are ${length}. If you've added a new rule, please update this number.`
        );
      }
    }).not.toThrow();
  });

  it('should export configs that refer to actual rules', () => {
    const presets = plugin.configs;

    expect(presets).toMatchInlineSnapshot(`
      Object {
        "all": Object {
          "plugins": Array [
            "eslint-config",
          ],
          "rules": Object {
            "eslint-config/no-deprecated-rules": "error",
            "eslint-config/no-invalid-config": "error",
            "eslint-config/no-unknown-rules": "error",
            "eslint-config/sort-rules": "error",
          },
        },
        "rc": Object {
          "overrides": Array [
            Object {
              "files": Array [
                ".eslintrc.js",
              ],
              "rules": Object {
                "eslint-config/no-deprecated-rules": "warn",
              },
            },
          ],
          "plugins": Array [
            "eslint-config",
          ],
        },
        "recommended-rules": Object {
          "plugins": Array [
            "eslint-config",
          ],
          "rules": Object {
            "eslint-config/no-deprecated-rules": "warn",
            "eslint-config/no-invalid-config": "error",
            "eslint-config/no-unknown-rules": "error",
          },
        },
      }
    `);
    expect(Object.keys(presets)).toStrictEqual([
      'all',
      'recommended-rules',
      'rc'
    ]);
    expect(Object.keys(presets.all.rules)).toHaveLength(ruleNames.length);

    const allConfigRules = Object.values(presets)
      .map(config => Object.keys(config.rules ?? {}))
      .reduce((previousValue, currentValue) => [
        ...previousValue,
        ...currentValue
      ]);

    allConfigRules.forEach(rule => {
      const ruleNamePrefix = 'eslint-config/';
      const ruleName = rule.slice(ruleNamePrefix.length);

      expect(rule.startsWith(ruleNamePrefix)).toBe(true);
      expect(ruleNames).toContain(ruleName);
      expect(() => requireRule(ruleName)).not.toThrow();

      const { meta } = requireRule(ruleName);

      const recommendedLevel = meta.docs?.recommended;

      if (recommendedLevel) {
        expect(presets['recommended-rules'].rules).toHaveProperty(
          rule,
          recommendedLevel
        );
      } else {
        expect(presets['recommended-rules'].rules).not.toHaveProperty(rule);
      }
    });
  });
});
