import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import type { CodegenConfig } from '@graphql-codegen/cli';
import createSignFn from 'graphql-codegen-on-operations/lib/use/signing';
import createListFn from 'graphql-codegen-on-operations/lib/use/listing';
import { GenerateFn } from 'graphql-codegen-on-operations';
import { print } from 'graphql';

const customGen: GenerateFn = (_schema, { documents }) => {
  return JSON.stringify(documents.map((d) => print(d.node)).join('\n'), null, 2);
};

const config: CodegenConfig = {
  schema: 'http://localhost:3000/api/graphql',
  documents: ['gql/**/*.graphql'],
  generates: {
    './__generated__/gql.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
    },
    './__generated__/signed-operations.json': {
      plugins: ['graphql-codegen-on-operations'],
      config: {
        gen: createSignFn({
          // should be long and not exposed to public
          secret: process.env.SIGNING_SECRET,
        }),
      },
    },
    './__generated__/list-operations.json': {
      plugins: ['graphql-codegen-on-operations'],
      config: {
        gen: createListFn(),
      },
    },
    './__generated__/custom.json': {
      plugins: ['graphql-codegen-on-operations'],
      config: {
        gen: customGen,
      },
    },
  },
};
export default config;
