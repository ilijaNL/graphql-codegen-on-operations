import tap from 'tap';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLOnOperationsOptions as Config } from '../src/config';
import { DocumentNode, parse } from 'graphql';
import { plugin } from '../src/plugin';
import createListFn from '../src/use/listing';

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

function runPlugin(
  docs: DocumentNode[],
  config: Config = {
    gen: createListFn({}),
  }
) {
  return plugin(
    schema,
    docs.map((d) => ({ document: d })),
    config
  );
}

tap.test('query', async (t) => {
  const result = await runPlugin([
    parse(gql`
      query test {
        test
      }
    `),
  ]);

  t.matchSnapshot(result.content);
});

tap.test('mutation', async (t) => {
  const result = await runPlugin([
    parse(gql`
      mutation mut {
        create
      }
    `),
  ]);

  t.matchSnapshot(result.content);
});

tap.test('nested fragment', async (t) => {
  const result = await runPlugin([
    parse(gql`
      fragment friend on Friend {
        id
        user {
          ...user
        }
      }
    `),
    parse(gql`
      fragment user on User {
        name
        friends {
          ...friend
        }
      }
    `),
    parse(gql`
      query user {
        user {
          ...user
          friends {
            ...friend
          }
        }
      }
    `),
  ]);

  t.matchSnapshot(result.content);
});

tap.test('cached directive', async (t) => {
  const result = await runPlugin([
    parse(gql`
      fragment user on User {
        name
      }
      query cachedUser @pcached(ttl: 1) {
        user {
          ...user
        }
      }
    `),
    parse(gql`
      query cUser @cached(ttl: 1) {
        user {
          ...user
        }
      }
    `),
  ]);

  t.matchSnapshot(result.content);
});

tap.test('public directive', async (t) => {
  const result = await runPlugin([
    parse(gql`
      fragment user on User {
        name
      }
      query pUser @p__public {
        user {
          ...user
        }
      }
    `),
    parse(gql`
      query cUser {
        user {
          ...user
        }
      }
    `),
  ]);

  t.matchSnapshot(result.content);
});

tap.test('throws on no operation name', async (t) => {
  t.rejects(
    async () =>
      await runPlugin([
        parse(gql`
          query {
            user {
              id
            }
          }
        `),
      ])
  );
});

tap.test('throws on duplicate operations', async (t) => {
  t.rejects(
    async () =>
      await runPlugin([
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
      ])
  );
});

tap.test('additional directives for default prefix', async (t) => {
  const result = await runPlugin([
    parse(gql`
      fragment user on User {
        name
      }
      query pUser @p__abc(abc: 123, works: "awdawd", bool: true) {
        user {
          ...user
        }
      }

      query kUser @p__ddd(n: null, n: 123.22) {
        user {
          ...user
        }
      }
    `),
    parse(gql`
      query cUser {
        user {
          ...user
        }
      }
    `),
  ]);

  t.matchSnapshot(result.content);

  t.rejects(
    async () =>
      await runPlugin([
        parse(gql`
          query cUser @p__c(ttl: {}) {
            user {
              ...user
            }
          }
        `),
      ])
  );
});

tap.test('additional directives for custom prefix', async (t) => {
  const result = await runPlugin(
    [
      parse(gql`
        fragment user on User {
          name
        }
        query pUser @custom_abc(abc: 123, works: "awdawd", bool: true) {
          user {
            ...user
          }
        }

        query kUser @customm_ddd(n: null, n: 123.22) {
          user {
            ...user
          }
        }
      `),
    ],
    {
      gen: createListFn({
        directive_prefix: 'custom_',
      }),
    }
  );

  t.matchSnapshot(result.content);
});
