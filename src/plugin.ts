import {
  ExecutableDefinitionNode,
  FragmentDefinitionNode,
  Kind,
  OperationDefinitionNode,
  parse,
  print,
  visit,
} from 'graphql';
import { PluginFunction, PluginValidateFn, Types } from '@graphql-codegen/plugin-helpers';
import { GraphQLOnOperationsOptions, Operation, OperationDocument } from './config';

export * from './config';

/**
 * Returns an array of fragments required for a given operation, recursively.
 * Will throw an error if it cannot find one of the fragments required for the operation.
 * @param operationDefinition the operation we want to find fragements for.
 * @param fragmentDefinitions a list of fragments from the same document, some of which may be required by the operation.
 * @param documentLocation location of the document the operation is sourced from. Only used to improve error messages.
 * @returns an array of fragments required for the operation.
 */
export function getOperationFragmentsRecursively(
  operationDefinition: OperationDefinitionNode,
  fragmentDefinitions: FragmentDefinitionNode[],
  documentLocation: string
): FragmentDefinitionNode[] {
  const requiredFragmentNames = new Set<string>();

  getRequiredFragments(operationDefinition);

  // note: we first get a list of required fragments names, then filter the original list.
  // this means order of fragments is preserved.
  return fragmentDefinitions.filter((definition) => requiredFragmentNames.has(definition.name.value));

  /**
   * Given a definition adds required fragments to requieredFragmentsNames, recursively.
   * @param definition either an operation definition or a fragment definition.
   */
  function getRequiredFragments(definition: ExecutableDefinitionNode) {
    visit(definition, {
      FragmentSpread(fragmentSpreadNode) {
        // added this check to prevent infinite recursion on recursive fragment definition (which itself isn't legal graphql)
        // it seems graphql crashes anyways if a recursive fragment is defined, so maybe remove this check?
        if (!requiredFragmentNames.has(fragmentSpreadNode.name.value)) {
          requiredFragmentNames.add(fragmentSpreadNode.name.value);

          const fragmentDefinition = fragmentDefinitions.find(
            (definition) => definition.name.value === fragmentSpreadNode.name.value
          );

          if (!fragmentDefinition) {
            throw new Error(
              `Missing fragment ${fragmentSpreadNode.name.value} for ${
                definition.kind === Kind.FRAGMENT_DEFINITION ? 'fragment' : 'operation'
              } ${definition.name!.value} in file ${documentLocation}`
            );
          } else {
            getRequiredFragments(fragmentDefinition);
          }
        }
        return fragmentSpreadNode;
      },
    });
  }
}

export const plugin: PluginFunction<GraphQLOnOperationsOptions, Types.ComplexPluginOutput> = async (
  schema,
  documentFiles: Types.DocumentFile[],
  config
) => {
  const allFragments = documentFiles.reduce((agg, document) => {
    const documentFragments = document.document!.definitions.filter(
      (definition): definition is FragmentDefinitionNode =>
        definition.kind === Kind.FRAGMENT_DEFINITION && !!definition.name
    );

    agg.push(...documentFragments);

    return agg;
  }, [] as FragmentDefinitionNode[]);

  // filter out anonymous fragments
  const ops: Operation[] = [];
  const docs: OperationDocument[] = [];

  for (const document of documentFiles) {
    // filter out anonymous operations
    const documentOperations = document.document!.definitions.filter(
      (definition): definition is OperationDefinitionNode => definition.kind === Kind.OPERATION_DEFINITION
    );

    const operations = documentOperations.map((node) => ({
      name: node.name?.value ?? null,
      node: node,
    }));

    ops.push(...operations);

    // for each operation in the document
    for (const operation of operations) {
      // get fragments required by the operations
      const requiredFragmentDefinitions = getOperationFragmentsRecursively(
        operation.node,
        allFragments,
        document.location!
      );
      const doc = parse([...requiredFragmentDefinitions, operation.node].map(print).join('\n'));
      docs.push({
        fragments: requiredFragmentDefinitions,
        node: doc,
        operation: operation,
      });
    }
  }

  return {
    content: await config.gen(schema, {
      documentFiles: documentFiles,
      documents: docs,
      fragments: allFragments,
      operations: ops,
    }),
  };
};

export const validate: PluginValidateFn<GraphQLOnOperationsOptions> = async (_schema, _documents, config) => {
  if (!config.gen) {
    throw new Error(`Plugin "graphql-codegen-on-operations" requires config.gen to be set`);
  }
};
