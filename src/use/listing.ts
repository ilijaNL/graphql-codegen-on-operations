import { ArgumentNode, Kind, ValueNode, print, visit } from 'graphql';
import { printExecutableGraphQLDocument } from '@graphql-tools/documents';
import { GenerateFn } from '../config';

function extractValue(value: ValueNode) {
  /*
  VariableNode | IntValueNode | FloatValueNode | StringValueNode | BooleanValueNode | NullValueNode | EnumValueNode | ListValueNode | ObjectValueNode
  */
  if (value.kind === Kind.INT || value.kind === Kind.FLOAT) {
    return +value.value;
  }
  if (value.kind === Kind.STRING) {
    return value.value;
  }
  if (value.kind === Kind.BOOLEAN) {
    return value.value;
  }
  if (value.kind === Kind.NULL) {
    return null;
  }
  if (value.kind === Kind.ENUM) {
    return value.value;
  }

  throw new Error('directive with argumentType ' + value.kind + ' not supported');
}

function extractArgumentValue(args: readonly ArgumentNode[]) {
  if (args.length === 0) {
    return true;
  }

  return args.reduce((agg, curr) => {
    agg[curr.name.value] = extractValue(curr.value);
    return agg;
  }, {} as Record<string, any>);
}

type OperationDefinition = {
  operationName: string;
  operationType: 'query' | 'mutation' | 'subscription';
  query: string;
  behaviour: Partial<{
    ttl: number;
  }> &
    Record<string, any>;
};

export interface ListConfig {
  /**
   * Prefix which is used to indicate custom directives on the operation
   * These directives will be removed from the final query
   * Defaults to `p__`
   *
   * @example
   * query cached @p__test(ttl: 2) {
   *   user {
   *     id
   *   }
   * }
   *
   * will results in query = query cached { user { id } } with "behaviour": { "test": { "ttl": 2 } }
   */
  directive_prefix?: string;
}

export default function createListFn(config?: ListConfig) {
  const gen: GenerateFn = (_schema, { documents }) => {
    const mOperationMap = new Map<string, OperationDefinition>();
    const mPrefix = config?.directive_prefix ?? 'p__';

    documents.forEach(({ node, operation }) => {
      const operationName = operation.name;

      if (!operationName) {
        throw new Error(
          `operation ${print(
            operation.node
          )} does not have an operationName. List requires all operations to have an operationName`
        );
      }

      const behaviour: Record<string, any> = {};

      let doc = node;

      doc = visit(doc, {
        [Kind.DIRECTIVE]: {
          enter(node) {
            if (node.name.value.startsWith(mPrefix) && node.name.value.length > mPrefix.length) {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              const key = node.name.value.split(mPrefix)[1]!;
              const value = node.arguments ? extractArgumentValue(node.arguments) : true;
              behaviour[key] = value;

              return null;
            }
            if (node.name.value === 'pcached') {
              visit(node, {
                [Kind.ARGUMENT]: {
                  enter(argNode) {
                    if (argNode.name.value === 'ttl') {
                      visit(argNode, {
                        [Kind.INT]: {
                          enter(intNode) {
                            behaviour.ttl = +intNode.value;
                          },
                        },
                      });
                    }
                  },
                },
              });
              // delete this node
              return null;
            }
            return;
          },
        },
      });

      const def: OperationDefinition = {
        behaviour: behaviour,
        operationName: operationName,
        operationType: operation.node.operation,
        query: printExecutableGraphQLDocument(doc),
      };

      if (mOperationMap.has(operationName)) {
        throw new Error(operationName + 'is defined multiple times, please ensure all operation names are unique');
      }

      mOperationMap.set(operationName, def);
    });

    return `${JSON.stringify(Array.from(mOperationMap.values()), null, 2)}`;
  };

  return gen;
}
