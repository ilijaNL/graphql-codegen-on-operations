import type { Types } from '@graphql-codegen/plugin-helpers';
import type { DocumentNode, FragmentDefinitionNode, GraphQLSchema, OperationDefinitionNode } from 'graphql';

export interface Operation {
  name: string | null;
  node: OperationDefinitionNode;
}

export interface OperationDocument {
  /**
   * Combined (operation + fragments (nested)) DocumentNode.
   * The order is: [...requiredFragments, operation]
   */
  node: DocumentNode;
  operation: Operation;
  fragments: FragmentDefinitionNode[];
}

export type GenerateFn = (
  schema: GraphQLSchema,
  props: {
    documentFiles: Types.DocumentFile[];
    fragments: FragmentDefinitionNode[];
    operations: Operation[];
    documents: OperationDocument[];
  }
) => Promise<string> | string;

export interface GraphQLOnOperationsOptions {
  gen: GenerateFn;
}
