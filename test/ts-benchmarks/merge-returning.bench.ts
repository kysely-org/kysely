import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import type { MergeQueryBuilder, Kysely } from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

let mergeQuery: MergeQueryBuilder<DB, 'my_table', {}>
let mergeQueryAny: MergeQueryBuilder<any, 'my_table', {}>

console.log('merge-returning.bench.ts:\n')

bench.baseline(() => {
  mergeQuery = kysely.mergeInto('my_table')
  mergeQueryAny = kysely.mergeInto('my_table')
})

bench('kysely.mergeInto(table).returning(column)', () =>
  mergeQuery.returning('col_164b7896ec8e770207febe0812c5f052'),
).types([307, 'instantiations'])

bench('kysely.mergeInto(table)..returning(~column)', () =>
  // @ts-expect-error
  mergeQuery.returning('col_164b7896ec8e770207febe0812c5f052_'),
).types([7321, 'instantiations'])

bench('kysely.mergeInto(table)..returning(table.column)', () =>
  mergeQuery.returning('my_table.col_164b7896ec8e770207febe0812c5f052'),
).types([307, 'instantiations'])

bench('kysely.mergeInto(table)..returning(~table.column)', () =>
  // @ts-expect-error
  mergeQuery.returning('my_table_.col_164b7896ec8e770207febe0812c5f052'),
).types([7321, 'instantiations'])

bench('kysely.mergeInto(table)..returning(table.column as alias)', () =>
  mergeQuery.returning('my_table.col_164b7896ec8e770207febe0812c5f052 as foo'),
).types([307, 'instantiations'])

bench('kysely.mergeInto(table)..returning(column as alias)', () =>
  mergeQuery.returning('col_164b7896ec8e770207febe0812c5f052 as foo'),
).types([307, 'instantiations'])

bench('kysely.mergeInto(table)..returningAll()', () =>
  mergeQuery.returningAll(),
).types([88, 'instantiations'])

bench('kyselyAny.mergeInto(table)..returning(column)', () =>
  mergeQueryAny.returning('col_164b7896ec8e770207febe0812c5f052'),
).types([241, 'instantiations'])

bench('kyselyAny.mergeInto(table)..returning(table.column)', () =>
  mergeQueryAny.returning('my_table.col_164b7896ec8e770207febe0812c5f052'),
).types([241, 'instantiations'])

bench('kyselyAny.mergeInto(table)..returning(table.column as alias)', () =>
  mergeQueryAny.returning(
    'my_table.col_164b7896ec8e770207febe0812c5f052 as foo',
  ),
).types([241, 'instantiations'])

bench('kyselyAny.mergeInto(table)..returningAll()', () =>
  mergeQueryAny.returningAll(),
).types([88, 'instantiations'])
