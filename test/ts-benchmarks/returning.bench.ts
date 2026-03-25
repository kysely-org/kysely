import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import type { InsertQueryBuilder, Kysely } from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

let query: InsertQueryBuilder<DB, 'my_table', {}>
let queryAny: InsertQueryBuilder<any, 'my_table', {}>

console.log('returning.bench.ts:\n')

bench.baseline(() => {
  query = kysely.insertInto('my_table')
  queryAny = kyselyAny.insertInto('my_table')
})

bench('kysely..returning(column)', () =>
  query.returning('col_164b7896ec8e770207febe0812c5f052'),
).types([345, 'instantiations'])

bench('kysely..returning(~column)', () =>
  // @ts-expect-error
  query.returning('col_164b7896ec8e770207febe0812c5f052_'),
).types([7333, 'instantiations'])

bench('kysely..returning(table.column)', () =>
  query.returning('my_table.col_164b7896ec8e770207febe0812c5f052'),
).types([345, 'instantiations'])

bench('kysely..returning(~table.column)', () =>
  // @ts-expect-error
  query.returning('my_table_.col_164b7896ec8e770207febe0812c5f052'),
).types([7333, 'instantiations'])

bench('kysely..returning(table.column as alias)', () =>
  query.returning('my_table.col_164b7896ec8e770207febe0812c5f052 as foo'),
).types([345, 'instantiations'])

bench('kysely..returning(column as alias)', () =>
  query.returning('col_164b7896ec8e770207febe0812c5f052 as foo'),
).types([345, 'instantiations'])

bench('kysely..returningAll()', () => query.returningAll()).types([
  520,
  'instantiations',
])

bench('kyselyAny..returning(column)', () =>
  queryAny.returning('col_164b7896ec8e770207febe0812c5f052'),
).types([279, 'instantiations'])

bench('kyselyAny..returning(table.column)', () =>
  queryAny.returning('my_table.col_164b7896ec8e770207febe0812c5f052'),
).types([279, 'instantiations'])

bench('kyselyAny..returning(table.column as alias)', () =>
  queryAny.returning('my_table.col_164b7896ec8e770207febe0812c5f052 as foo'),
).types([279, 'instantiations'])

bench('kyselyAny..returningAll()', () => queryAny.returningAll()).types([
  173,
  'instantiations',
])
