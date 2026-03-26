import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import type { InsertQueryBuilder, Kysely } from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

let insertQuery: InsertQueryBuilder<DB, 'my_table', {}>
let insertQueryAny: InsertQueryBuilder<any, 'my_table', {}>

console.log('insert-returning.bench.ts:\n')

bench.baseline(() => {
  insertQuery = kysely.insertInto('my_table')
  insertQueryAny = kyselyAny.insertInto('my_table')
})

bench('kysely.insertInto(table).returning(column)', () =>
  insertQuery.returning('col_164b7896ec8e770207febe0812c5f052'),
).types([345, 'instantiations'])

bench('kysely.insertInto(table)..returning(~column)', () =>
  // @ts-expect-error
  insertQuery.returning('col_164b7896ec8e770207febe0812c5f052_'),
).types([7333, 'instantiations'])

bench('kysely.insertInto(table)..returning(table.column)', () =>
  insertQuery.returning('my_table.col_164b7896ec8e770207febe0812c5f052'),
).types([345, 'instantiations'])

bench('kysely.insertInto(table)..returning(~table.column)', () =>
  // @ts-expect-error
  insertQuery.returning('my_table_.col_164b7896ec8e770207febe0812c5f052'),
).types([7333, 'instantiations'])

bench('kysely.insertInto(table)..returning(table.column as alias)', () =>
  insertQuery.returning('my_table.col_164b7896ec8e770207febe0812c5f052 as foo'),
).types([345, 'instantiations'])

bench('kysely.insertInto(table)..returning(column as alias)', () =>
  insertQuery.returning('col_164b7896ec8e770207febe0812c5f052 as foo'),
).types([345, 'instantiations'])

bench('kysely.insertInto(table)..returningAll()', () =>
  insertQuery.returningAll(),
).types([520, 'instantiations'])

bench('kyselyAny.insertInto(table)..returning(column)', () =>
  insertQueryAny.returning('col_164b7896ec8e770207febe0812c5f052'),
).types([279, 'instantiations'])

bench('kyselyAny.insertInto(table)..returning(table.column)', () =>
  insertQueryAny.returning('my_table.col_164b7896ec8e770207febe0812c5f052'),
).types([279, 'instantiations'])

bench('kyselyAny.insertInto(table)..returning(table.column as alias)', () =>
  insertQueryAny.returning(
    'my_table.col_164b7896ec8e770207febe0812c5f052 as foo',
  ),
).types([279, 'instantiations'])

bench('kyselyAny.insertInto(table)..returningAll()', () =>
  insertQueryAny.returningAll(),
).types([173, 'instantiations'])
