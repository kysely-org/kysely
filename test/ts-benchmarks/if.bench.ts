import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d.js'
import type { Kysely } from '../../dist/index.js'

// `$if` is how conditional filters, optional selections and optional joins get
// built in application code, so it tends to appear in every non-trivial query.
//
// Each of these numbers includes the one-time cost of relating two
// instantiations of the builder under test, because that is what a `$if` call
// site makes the compiler do: it has to match the callback's return type
// against the builder type in the signature. Keep the callback return types
// pointed at the smallest interface that still identifies the builder - see the
// comment on `SelectQueryBuilder.$if`.

declare const kysely: Kysely<DB>
declare const condition: boolean

console.log('if.bench.ts:\n')

bench.baseline(() => {})

bench('kysely..select..$if(qb => qb.select(column))', () => {
  return kysely
    .selectFrom('my_table')
    .select('my_table.id')
    .$if(condition, (qb) =>
      qb.select('my_table.col_2e66a5c7e24d1d066230f368ce8b094e'),
    )
}).types([7027, 'instantiations'])

bench('kysely..select..$if(qb => qb.where(...))', () => {
  return kysely
    .selectFrom('my_table')
    .select('my_table.id')
    .$if(condition, (qb) =>
      qb.where('my_table.col_1d726898491fbca9a8dac855d2be1be8', '=', 1),
    )
}).types([3509, 'instantiations'])

bench('kysely..select..$if(qb => qb.innerJoin(...))', () => {
  return kysely
    .selectFrom('my_table')
    .select('my_table.id')
    .$if(condition, (qb) =>
      qb.innerJoin(
        'table_0b5ac72e03509e06683edcba4b3887ab',
        'table_0b5ac72e03509e06683edcba4b3887ab.id',
        'my_table.id',
      ),
    )
}).types([8742, 'instantiations'])

bench('kysely..select..$if x3', () => {
  return kysely
    .selectFrom('my_table')
    .select('my_table.id')
    .$if(condition, (qb) =>
      qb.where('my_table.col_1d726898491fbca9a8dac855d2be1be8', '=', 1),
    )
    .$if(condition, (qb) =>
      qb.select('my_table.col_2e66a5c7e24d1d066230f368ce8b094e'),
    )
    .$if(condition, (qb) =>
      qb.select('my_table.col_4f84013a8b5e4c2b7529058c8fafcaa8'),
    )
}).types([10196, 'instantiations'])

bench('kysely..update..$if(qb => qb.returning(column))', () => {
  return kysely
    .updateTable('my_table')
    .set('my_table.col_2e66a5c7e24d1d066230f368ce8b094e', 'x')
    .returning('my_table.id')
    .$if(condition, (qb) =>
      qb.returning('my_table.col_2e66a5c7e24d1d066230f368ce8b094e'),
    )
}).types([27600, 'instantiations'])

bench('kysely..delete..$if(qb => qb.returning(column))', () => {
  return kysely
    .deleteFrom('my_table')
    .returning('my_table.id')
    .$if(condition, (qb) =>
      qb.returning('my_table.col_2e66a5c7e24d1d066230f368ce8b094e'),
    )
}).types([12710, 'instantiations'])

bench('kysely..insert..$if(qb => qb.returning(column))', () => {
  return kysely
    .insertInto('my_table')
    .defaultValues()
    .returning('my_table.id')
    .$if(condition, (qb) =>
      qb.returning('my_table.col_2e66a5c7e24d1d066230f368ce8b094e'),
    )
}).types([4083, 'instantiations'])

bench('kysely..$call(qb => qb.select(column))', () => {
  return kysely
    .selectFrom('my_table')
    .select('my_table.id')
    .$call((qb) => qb.select('my_table.col_2e66a5c7e24d1d066230f368ce8b094e'))
}).types([968, 'instantiations'])
