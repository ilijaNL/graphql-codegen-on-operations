/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`tests/plugin.test.ts TAP query > must match snapshot 1`] = `
fragment Test on user {
  id
}

query t2 {
  user {
    name
    id
    ...Test
  }
}
`
