import assert from 'node:assert/strict'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  caseDirectory,
  ddl,
  generate,
  libraries,
  queries,
  tableCounts,
} from './generate.mjs'

// Run through tsx: node --import tsx equivalence.mjs
if (process.argv.includes('--generate')) generate()

const seed = `
insert into person (name, description, owner_id, score, active, created_at) values
  ('Jennifer', null, 0, 54, true, '2026-01-01 00:00:00+00'),
  ('Arnold', 'actor', 0, 17, true, '2026-01-02 00:00:00+00'),
  ('Sylvester', null, 0, null, false, '2026-01-03 00:00:00+00');
insert into pet (name, description, owner_id, score, active, created_at) values
  ('Catto', null, 1, 9, true, '2026-01-01 00:00:00+00'),
  ('Doggo', null, 1, 3, true, '2026-01-02 00:00:00+00'),
  ('Birdo', null, 2, null, false, '2026-01-03 00:00:00+00');
insert into toy (name, description, owner_id, score, active, created_at) values
  ('Ball', null, 1, 6, true, '2026-01-01 00:00:00+00'),
  ('Rope', null, 2, null, true, '2026-01-02 00:00:00+00');
`

// count(*) is a bigint in PostgreSQL: Drizzle's count() converts it and
// Kysely returns what the driver gives, so compare it as a number.
const normalize = (rows) =>
  JSON.parse(
    JSON.stringify(rows, (key, value) =>
      key === 'pets' || typeof value === 'bigint' ? Number(value) : value,
    ),
  )

const results = {}
for (const library of Object.keys(libraries)) {
  const dir = caseDirectory(library, tableCounts[0])
  const load = (name) => import(pathToFileURL(join(dir, `${name}.ts`)).href)
  const { client } = await load('db')
  await client.exec(ddl)
  await client.exec(seed)
  results[library] = {}
  for (const query of queries) {
    const { run } = await load(query)
    results[library][query] = normalize(await run())
  }
  await client.close()
}

for (const query of queries) {
  const expected = results.kysely[query]
  assert.ok(expected.length > 0, `${query}: returns rows`)
  for (const library of Object.keys(libraries)) {
    assert.deepEqual(results[library][query], expected, `${library}: ${query}`)
  }
  console.log(`${query.padEnd(12)} ${expected.length} matching rows`)
}
console.log(
  `\nPASS: ${queries.length} queries return the same rows in Kysely and both Drizzle versions.`,
)
