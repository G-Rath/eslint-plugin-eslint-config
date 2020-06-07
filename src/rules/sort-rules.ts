import {
  AST_NODE_TYPES,
  ESLintUtils,
  TSESTree
} from '@typescript-eslint/experimental-utils';

const getPropertyName = (node: TSESTree.Property): string | null => {
  const key = node.key;

  switch (key.type) {
    case AST_NODE_TYPES.Literal:
      return String(key.value);
    case AST_NODE_TYPES.TemplateLiteral:
      if (key.expressions.length === 0 && key.quasis.length === 1) {
        return key.quasis[0].value.cooked;
      }
      break;

    case AST_NODE_TYPES.Identifier:
      break;

    // no default
  }

  return null;
};

const trimPluginName = (rule: string): string => {
  return rule.substring(rule.indexOf('/'));
};

const isRuleSorted = (a: string, b: string): boolean => {
  if (a.includes('/') && b.includes('/')) {
    return a <= b;
  }

  return trimPluginName(a) <= trimPluginName(b);
};

const isPropertyInRulesConfig = (node: TSESTree.Property): boolean =>
  Boolean(
    node.parent?.parent?.type === AST_NODE_TYPES.Property &&
      node.parent.parent.key.type === AST_NODE_TYPES.Identifier &&
      node.parent.parent.key.name === 'rules'
  );

export = ESLintUtils.RuleCreator(name => name)({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensures that rules are sorted in a consistent order',
      category: 'Best Practices',
      recommended: false
    },
    fixable: 'code',
    messages: {
      incorrectOrder:
        "Rules should be in ascending order, with core rules last. '{{ thisName }}' should be before '{{ prevName }}'."
    },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    interface Stack {
      upper: Stack | null;
      prevName: string | null;
      prevNode: TSESTree.Node | null;
      numKeys: number;
    }

    // The stack to save the previous property's name for each object literals.
    let stack: Stack | null = null;

    return {
      [AST_NODE_TYPES.ObjectExpression](node: TSESTree.ObjectExpression): void {
        stack = {
          upper: stack,
          prevName: null,
          prevNode: null,
          numKeys: node.properties.length
        };
      },

      [`${AST_NODE_TYPES.ObjectExpression}:exit`](): void {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        stack = stack!.upper;
      },

      [AST_NODE_TYPES.SpreadElement](node: TSESTree.SpreadElement): void {
        if (node.parent?.type === AST_NODE_TYPES.ObjectExpression && stack) {
          stack.prevName = null;
        }
      },

      [AST_NODE_TYPES.Property](node: TSESTree.Property): void {
        if (
          node.parent?.type === AST_NODE_TYPES.ObjectPattern ||
          !isPropertyInRulesConfig(node) ||
          !stack
        ) {
          return;
        }

        const prevName = stack.prevName;
        const prevNode = stack.prevNode ?? node;
        const thisName = getPropertyName(node);

        if (thisName !== null) {
          stack.prevName = thisName;
          stack.prevNode = node;
        }

        if (prevName === null || thisName === null) {
          return;
        }

        if (!isRuleSorted(prevName, thisName)) {
          context.report({
            messageId: 'incorrectOrder',
            data: { thisName, prevName },
            node,
            loc: node.key.loc,
            fix(fixer) {
              const sourceCode = context.getSourceCode();
              const thisText = sourceCode.getText(node);
              const prevText = sourceCode.getText(prevNode);

              return [
                fixer.replaceText(node, prevText),
                fixer.replaceText(prevNode, thisText)
              ];
            }
          });
        }
      }
    };
  }
});
