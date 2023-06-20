import { DocumentNode, print } from 'graphql';
import { printExecutableGraphQLDocument } from '@graphql-tools/documents';
import { createHmac } from 'node:crypto';
import { GenerateFn } from '../config';

function createStableSignedHash(document: DocumentNode, secret: string, algo = 'sha256') {
  // this will print it in a stable way
  const printedDoc = printExecutableGraphQLDocument(document);
  // hash with hmac
  return createHmac(algo, secret).update(printedDoc).digest('hex');
}

export type SignOptions = {
  /**
   * A secret which is used to sign the graphql operations.
   * This secret should not be exposed in the client and only be available during build time.
   * The same secret needs to be used on the server to validate the request.
   */
  secret: string;
  /**
   * Algorithm used for creating the signed hash.
   * @Default sha256
   */
  algorithm?: string;
};

export default function createSignFn(config: SignOptions) {
  const gen: GenerateFn = (_schema, { documents }) => {
    const mOperationMap: Record<string, string> = {};

    documents.forEach(({ node, operation }) => {
      if (!operation.name) {
        throw new Error(
          `operation ${print(
            operation.node
          )} does not have an operationName. Signing requires all operations to have operationName`
        );
      }

      if (mOperationMap[operation.name]) {
        throw new Error(operation.name + 'is defined multiple times, please ensure all operation names are unique');
      }

      const signedDoc = createStableSignedHash(node, config.secret, config.algorithm);

      mOperationMap[operation.name] = signedDoc;
    });

    return `${JSON.stringify(mOperationMap, null, 2)}`;
  };

  return gen;
}
