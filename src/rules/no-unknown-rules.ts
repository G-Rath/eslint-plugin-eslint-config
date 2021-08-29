import { ESLintUtils, TSESTree } from '@typescript-eslint/experimental-utils';
import { tryGetConfigInfo } from './utils';

export = ESLintUtils.RuleCreator(name => name)({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensures that all rules are known',
      recommended: 'error'
    },
    messages: {
      unknownRule: "Unknown rule '{{ ruleId }}' - Have you forgotten a plugin?"
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

        if (results.unknownRules.includes(ruleId)) {
          context.report({
            data: { ruleId },
            messageId: 'unknownRule',
            node
          });
        }
      }
    };
  }
});
