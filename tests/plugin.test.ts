import tap from 'tap';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLOnOperationsOptions as Config } from '../src/config';
import { DocumentNode, parse, print } from 'graphql';
import { plugin, validate } from '../src/plugin';

const schema = makeExecutableSchema({
  typeDefs: `
    type User {
      name: String!
      id: String!
      friends: [Friend!]!
    }
    type Friend {
      id: String!
      user: User!
    }
    type Query {
      test: String!
      user: User!
    }
    type Mutation {
      create: String!
    }
`,
});

// Nooop gql fn for prettier
function gql(...things: TemplateStringsArray[]) {
  return things.join('');
}

async function runPlugin(docs: DocumentNode[], config: Config, file = 'dummy.json') {
  // const documents = docs.map((doc: any) => ({
  //   filePath: '',
  //   content: doc,
  // }));
  const d = docs.map((d) => ({ document: d }));

  await validate(schema, d, config, file, []);

  return plugin(schema, d, config);
}

tap.test('query', async (t) => {
  const parsedDocument = parse(gql`
    query test {
      test
    }
  `);
  const result = await runPlugin(
    [
      parsedDocument,
      parse(gql`
        fragment Test on user {
          id
        }
      `),
      parse(
        gql`
          query t1 {
            user {
              id
              name
            }
          }
        `
      ),
      parse(
        gql`
          query t2 {
            user {
              name
              id
              ...Test
            }
          }
        `
      ),
    ],
    {
      gen: (_schema, { documents, fragments, operations }) => {
        t.equal(fragments.length, 1);
        t.equal(operations.length, 3);
        t.matchSnapshot(print(documents[2]!.node));
        return 'works';
      },
    }
  );

  t.equal(result.content, 'works');
});

tap.test('throws when fragment not defined', async (t) => {
  t.rejects(() =>
    runPlugin(
      [
        parse(gql`
          query user {
            user {
              ...user
            }
          }
        `),
      ],
      {
        gen: () => '',
      }
    )
  );
});

tap.test('throws when invalid config', async (t) => {
  t.rejects(
    async () =>
      await runPlugin(
        [
          parse(gql`
            query cUser {
              user {
                id
              }
            }
          `),
          parse(gql`
            query cUser {
              user {
                name
              }
            }
          `),
        ],
        {} as any
      )
  );
});
