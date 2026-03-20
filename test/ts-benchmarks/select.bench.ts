import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import type { Kysely, SelectQueryBuilder } from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

let query: SelectQueryBuilder<DB, 'my_table', {}>
let queryAny: SelectQueryBuilder<any, 'my_table', {}>

console.log('select.bench.ts:\n')

bench.baseline(() => {
  query = kysely.selectFrom('my_table')
  queryAny = kyselyAny.selectFrom('my_table')
})

bench('kysely..select(column)', () =>
  query.select('col_164b7896ec8e770207febe0812c5f052'),
).types([295, 'instantiations'])

bench('kysely..select(~column)', () =>
  // @ts-expect-error
  query.select('col_164b7896ec8e770207febe0812c5f052_'),
).types([7258, 'instantiations'])

bench('kysely..select(table.column)', () =>
  query.select('my_table.col_164b7896ec8e770207febe0812c5f052'),
).types([295, 'instantiations'])

bench('kysely..select(~table.column)', () =>
  // @ts-expect-error
  query.select('my_table_.col_164b7896ec8e770207febe0812c5f052'),
).types([7258, 'instantiations'])

bench('kysely..select(table.column as alias)', () =>
  query.select('my_table.col_164b7896ec8e770207febe0812c5f052 as foo'),
).types([295, 'instantiations'])

bench('kysely..select(column as alias)', () =>
  query.select('col_164b7896ec8e770207febe0812c5f052 as foo'),
).types([295, 'instantiations'])

bench('kyselyAny..select(column)', () =>
  queryAny.select('col_164b7896ec8e770207febe0812c5f052'),
).types([229, 'instantiations'])

bench('kyselyAny..select(table.column)', () =>
  queryAny.select('my_table.col_164b7896ec8e770207febe0812c5f052'),
).types([229, 'instantiations'])

bench('kyselyAny..select(table.column as alias)', () =>
  queryAny.select('my_table.col_164b7896ec8e770207febe0812c5f052 as foo'),
).types([229, 'instantiations'])
