import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import type { Kysely, UpdateQueryBuilder } from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

let updateQuery: UpdateQueryBuilder<DB, 'my_table', 'my_table', {}>
let updateQueryAny: UpdateQueryBuilder<any, 'my_table', 'my_table', {}>

console.log('update-returning.bench.ts:\n')

bench.baseline(() => {
  updateQuery = kysely.updateTable('my_table')
  updateQueryAny = kyselyAny.updateTable('my_table')
})

bench('kysely.updateTable(table).returning(column)', () =>
  updateQuery.returning('col_164b7896ec8e770207febe0812c5f052'),
).types([331, 'instantiations'])

bench('kysely.updateTable(table)..returning(~column)', () =>
  // @ts-expect-error
  updateQuery.returning('col_164b7896ec8e770207febe0812c5f052_'),
).types([7186, 'instantiations'])

bench('kysely.updateTable(table)..returning(table.column)', () =>
  updateQuery.returning('my_table.col_164b7896ec8e770207febe0812c5f052'),
).types([331, 'instantiations'])

bench('kysely.updateTable(table)..returning(~table.column)', () =>
  // @ts-expect-error
  updateQuery.returning('my_table_.col_164b7896ec8e770207febe0812c5f052'),
).types([7186, 'instantiations'])

bench('kysely.updateTable(table)..returning(table.column as alias)', () =>
  updateQuery.returning('my_table.col_164b7896ec8e770207febe0812c5f052 as foo'),
).types([331, 'instantiations'])

bench('kysely.updateTable(table)..returning(column as alias)', () =>
  updateQuery.returning('col_164b7896ec8e770207febe0812c5f052 as foo'),
).types([331, 'instantiations'])

bench('kysely.updateTable(table)..returningAll()', () =>
  updateQuery.returningAll(),
).types([88, 'instantiations'])

bench('kyselyAny.updateTable(table)..returning(column)', () =>
  updateQueryAny.returning('col_164b7896ec8e770207febe0812c5f052'),
).types([265, 'instantiations'])

bench('kyselyAny.updateTable(table)..returning(table.column)', () =>
  updateQueryAny.returning('my_table.col_164b7896ec8e770207febe0812c5f052'),
).types([265, 'instantiations'])

bench('kyselyAny.updateTable(table)..returning(table.column as alias)', () =>
  updateQueryAny.returning(
    'my_table.col_164b7896ec8e770207febe0812c5f052 as foo',
  ),
).types([265, 'instantiations'])

bench('kyselyAny.updateTable(table)..returningAll()', () =>
  updateQueryAny.returningAll(),
).types([88, 'instantiations'])
