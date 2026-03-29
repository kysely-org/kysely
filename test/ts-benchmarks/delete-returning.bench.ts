import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import type { DeleteQueryBuilder, Kysely } from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

let deleteQuery: DeleteQueryBuilder<DB, 'my_table', {}>
let deleteQueryAny: DeleteQueryBuilder<any, 'my_table', {}>

console.log('delete-returning.bench.ts:\n')

bench.baseline(() => {
  deleteQuery = kysely.deleteFrom('my_table')
  deleteQueryAny = kyselyAny.deleteFrom('my_table')
})

bench('kysely.deleteFrom(table).returning(column)', () =>
  deleteQuery.returning('col_164b7896ec8e770207febe0812c5f052'),
).types([300, 'instantiations'])

bench('kysely.deleteFrom(table)..returning(~column)', () =>
  // @ts-expect-error
  deleteQuery.returning('col_164b7896ec8e770207febe0812c5f052_'),
).types([7306, 'instantiations'])

bench('kysely.deleteFrom(table)..returning(table.column)', () =>
  deleteQuery.returning('my_table.col_164b7896ec8e770207febe0812c5f052'),
).types([300, 'instantiations'])

bench('kysely.deleteFrom(table)..returning(~table.column)', () =>
  // @ts-expect-error
  deleteQuery.returning('my_table_.col_164b7896ec8e770207febe0812c5f052'),
).types([7306, 'instantiations'])

bench('kysely.deleteFrom(table)..returning(table.column as alias)', () =>
  deleteQuery.returning('my_table.col_164b7896ec8e770207febe0812c5f052 as foo'),
).types([300, 'instantiations'])

bench('kysely.deleteFrom(table)..returning(column as alias)', () =>
  deleteQuery.returning('col_164b7896ec8e770207febe0812c5f052 as foo'),
).types([300, 'instantiations'])

bench('kysely.deleteFrom(table)..returningAll()', () =>
  deleteQuery.returningAll(),
).types([87, 'instantiations'])

bench('kyselyAny.deleteFrom(table)..returning(column)', () =>
  deleteQueryAny.returning('col_164b7896ec8e770207febe0812c5f052'),
).types([234, 'instantiations'])

bench('kyselyAny.deleteFrom(table)..returning(table.column)', () =>
  deleteQueryAny.returning('my_table.col_164b7896ec8e770207febe0812c5f052'),
).types([234, 'instantiations'])

bench('kyselyAny.deleteFrom(table)..returning(table.column as alias)', () =>
  deleteQueryAny.returning(
    'my_table.col_164b7896ec8e770207febe0812c5f052 as foo',
  ),
).types([234, 'instantiations'])

bench('kyselyAny.deleteFrom(table)..returningAll()', () =>
  deleteQueryAny.returningAll(),
).types([87, 'instantiations'])
