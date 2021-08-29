import {
  AST_NODE_TYPES,
  ESLintUtils,
  TSESTree
} from '@typescript-eslint/experimental-utils';
import { ESLintError, ESLintErrorType, getConfigInfo } from './utils';

const getNodeValue = (
  node: TSESTree.Identifier | TSESTree.LiteralExpression
): string => {
  switch (node.type) {
    case AST_NODE_TYPES.Identifier:
      return node.name;
    case AST_NODE_TYPES.TemplateLiteral:
      return node.quasis[0].value.raw;
    default:
      return node.value?.toString() ?? 'null';
  }
};

export = ESLintUtils.RuleCreator(name => name)({
  name: __filename,
  meta: {
    type: 'problem',
    docs: {
      description: 'Checks that the config exported by a file is valid',
      recommended: 'error'
    },
    messages: {
      FailedToLoadModule:
        "Cannot load {{ kind }} '{{ name }}' - is the package installed?",
      InvalidRuleConfig:
        "The config for '{{ ruleId }}' is invalid: {{ reason }}",
      ProcessorNotFound: "Cannot load processor '{{ name }}'",
      FailedToExtend:
        "Cannot extend '{{ name }}' - ensure file exists and exports a valid config",
      InvalidConfig: 'This config is invalid: {{ reason }}',
      UnknownError: 'An unknown error occurred: {{ message }}'
    },
    schema: []
  },
  defaultOptions: [],
  create(context) {
    const reportedErrors = new Set<ESLintError>();
    const createErrorReporter = (
      node: TSESTree.Node
    ): ((error: ESLintError) => void) => {
      const errorsReportedForNode = new Set<string>();

      return (error): void => {
        reportedErrors.add(error);
        const stringifiedError = JSON.stringify({ ...error, path: undefined });

        if (errorsReportedForNode.has(stringifiedError)) {
          return;
        }

        errorsReportedForNode.add(stringifiedError);
        context.report({
          messageId: error.type,
          data: { ...error },
          node,
          loc: node.loc
        });
      };
    };

    try {
      const { errors } = getConfigInfo(context.getSourceCode().getText());

      if (errors.length === 0) {
        return {};
      }

      return {
        [[
          AST_NODE_TYPES.Identifier,
          AST_NODE_TYPES.TemplateLiteral,
          AST_NODE_TYPES.Literal
        ].join()](
          node: TSESTree.Identifier | TSESTree.LiteralExpression
        ): void {
          const reportError = createErrorReporter(node);
          const value = getNodeValue(node);

          errors
            .filter(error => {
              switch (error.type) {
                case ESLintErrorType.InvalidRuleConfig:
                  return error.ruleId === value;
                case ESLintErrorType.FailedToExtend:
                case ESLintErrorType.FailedToLoadModule:
                case ESLintErrorType.ProcessorNotFound:
                  return error.name === value;
                case ESLintErrorType.InvalidConfig:
                default:
                  return false;
              }
            })
            .forEach(reportError);
        },
        [`${AST_NODE_TYPES.Program}:exit`](node): void {
          const reportError = createErrorReporter(node);

          errors
            .filter(error => !reportedErrors.has(error))
            .forEach(reportError);
        }
      };
    } catch (error) {
      return {
        Program(node): void {
          context.report({
            messageId: 'UnknownError',
            data: { message: (error as Error).message },
            node
          });
        }
      };
    }
  }
});
