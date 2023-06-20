/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`tests/listing.test.ts TAP additional directives for custom prefix > must match snapshot 1`] = `
[
  {
    "behaviour": {
      "abc": {
        "abc": 123,
        "works": "awdawd",
        "bool": true
      }
    },
    "operationName": "pUser",
    "operationType": "query",
    "query": "fragment user on User { name } query pUser { user { ...user } }"
  },
  {
    "behaviour": {},
    "operationName": "kUser",
    "operationType": "query",
    "query": "fragment user on User { name } query kUser @customm_ddd(n: null, n: 123.22) { user { ...user } }"
  }
]
`

exports[`tests/listing.test.ts TAP additional directives for default prefix > must match snapshot 1`] = `
[
  {
    "behaviour": {
      "abc": {
        "abc": 123,
        "works": "awdawd",
        "bool": true
      }
    },
    "operationName": "pUser",
    "operationType": "query",
    "query": "fragment user on User { name } query pUser { user { ...user } }"
  },
  {
    "behaviour": {
      "ddd": {
        "n": 123.22
      }
    },
    "operationName": "kUser",
    "operationType": "query",
    "query": "fragment user on User { name } query kUser { user { ...user } }"
  },
  {
    "behaviour": {},
    "operationName": "cUser",
    "operationType": "query",
    "query": "fragment user on User { name } query cUser { user { ...user } }"
  }
]
`

exports[`tests/listing.test.ts TAP cached directive > must match snapshot 1`] = `
[
  {
    "behaviour": {
      "ttl": 1
    },
    "operationName": "cachedUser",
    "operationType": "query",
    "query": "fragment user on User { name } query cachedUser { user { ...user } }"
  },
  {
    "behaviour": {},
    "operationName": "cUser",
    "operationType": "query",
    "query": "fragment user on User { name } query cUser @cached(ttl: 1) { user { ...user } }"
  }
]
`

exports[`tests/listing.test.ts TAP mutation > must match snapshot 1`] = `
[
  {
    "behaviour": {},
    "operationName": "mut",
    "operationType": "mutation",
    "query": "mutation mut { create }"
  }
]
`

exports[`tests/listing.test.ts TAP nested fragment > must match snapshot 1`] = `
[
  {
    "behaviour": {},
    "operationName": "user",
    "operationType": "query",
    "query": "fragment friend on Friend { id user { ...user } } fragment user on User { friends { ...friend } name } query user { user { friends { ...friend } ...user } }"
  }
]
`

exports[`tests/listing.test.ts TAP public directive > must match snapshot 1`] = `
[
  {
    "behaviour": {
      "public": true
    },
    "operationName": "pUser",
    "operationType": "query",
    "query": "fragment user on User { name } query pUser { user { ...user } }"
  },
  {
    "behaviour": {},
    "operationName": "cUser",
    "operationType": "query",
    "query": "fragment user on User { name } query cUser { user { ...user } }"
  }
]
`

exports[`tests/listing.test.ts TAP query > must match snapshot 1`] = `
[
  {
    "behaviour": {},
    "operationName": "test",
    "operationType": "query",
    "query": "query test { test }"
  }
]
`
