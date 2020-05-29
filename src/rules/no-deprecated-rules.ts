import {
  ESLintUtils,
  TSESLint,
  TSESTree
} from '@typescript-eslint/experimental-utils';
import { tryGetConfigInfo } from './utils';

const replaceDeprecatedRule = (
  fullRule: string,
  replacement: string
): string => {
  const split = fullRule.split('/');

  split[split.length - 1] = replacement;

  return split.join('/');
};

export = ESLintUtils.RuleCreator(name => name)({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Checks for usage of deprecated eslint rules',
      category: 'Best Practices',
      recommended: 'warn',
      suggestion: true
    },
    messages: {
      deprecatedRule:
        "'{{ ruleId }}' is deprecated in favor of '{{ replacedBy }}'",
      suggestReplaceWith: 'Replace with "{{ replacement }}"'
    },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    const results = tryGetConfigInfo(context.getSourceCode().getText());

    if (!results) {
      return {};
    }

    return {
      Literal(node: TSESTree.Literal): void {
        if (node.value === null) {
          return;
        }

        const ruleId = node.value.toString();
        const deprecation = results.deprecatedRules.find(
          rule => rule.ruleId === node.value
        );

        if (deprecation) {
          context.report({
            data: { ruleId, replacedBy: deprecation.replacedBy.join(', ') },
            messageId: 'deprecatedRule',
            node,
            suggest: deprecation.replacedBy
              .map(replacement => replaceDeprecatedRule(ruleId, replacement))
              .map(replacement => ({
                messageId: 'suggestReplaceWith',
                data: { replacement },
                fix: (fixer): TSESLint.RuleFix =>
                  fixer.replaceText(node, node.raw.replace(ruleId, replacement))
              }))
          });
        }
      }
    };
  }
});
