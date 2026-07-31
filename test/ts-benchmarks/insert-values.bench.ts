import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d.js'
import type { Kysely } from '../../dist/index.js'

// `insert-into.bench.ts` only covers picking the table. These cover the parts
// that carry data - the values themselves, upserts and `set` - which is where a
// row type gets matched against the table's insertable columns. Bulk inserts
// are worth watching in particular: the cost should stay flat in the number of
// rows, since every row is checked against the same type.

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

const row = {
  col_1d726898491fbca9a8dac855d2be1be8: 1,
  col_2e66a5c7e24d1d066230f368ce8b094e: 'a',
  col_2f76db193eac6ad0f152563313673ac9: new Date(),
  col_4f84013a8b5e4c2b7529058c8fafcaa8: 'b',
  col_d2508118d0d39e198d1129d87d692d59: new Date(),
  col_454ff479a3b5a9ef082d9be9ac02a6f4: 'c',
  col_3917508388f24a50271f7088b657123c: 'd',
}

declare const rows: (typeof row)[]

console.log('insert-values.bench.ts:\n')

bench.baseline(() => {
  return kysely.insertInto('my_table')
})

bench('kysely.insertInto(table).values(row)', () => {
  return kysely.insertInto('my_table').values(row)
}).types([1038, 'instantiations'])

bench('kysely.insertInto(table).values(~row)', () => {
  // @ts-expect-error
  return kysely.insertInto('my_table').values({ ...row, no_such_column: 1 })
}).types([1171, 'instantiations'])

bench('kysely.insertInto(table).values([row])', () => {
  return kysely.insertInto('my_table').values([row])
}).types([1047, 'instantiations'])

bench('kysely.insertInto(table).values([row x5])', () => {
  return kysely.insertInto('my_table').values([row, row, row, row, row])
}).types([1047, 'instantiations'])

bench('kysely.insertInto(table).values([row x10])', () => {
  return kysely
    .insertInto('my_table')
    .values([row, row, row, row, row, row, row, row, row, row])
}).types([1047, 'instantiations'])

bench('kysely.insertInto(table).values(row[])', () => {
  return kysely.insertInto('my_table').values(rows)
}).types([1045, 'instantiations'])

bench('kysely.insertInto(table).values(eb => row)', () => {
  return kysely.insertInto('my_table').values((eb) => ({
    ...row,
    col_1d726898491fbca9a8dac855d2be1be8: eb
      .selectFrom('my_table as t2')
      .select('t2.col_1d726898491fbca9a8dac855d2be1be8')
      .limit(1),
  }))
}).types([2522, 'instantiations'])

bench('kysely..onConflict(oc => oc.column(column).doNothing())', () => {
  return kysely
    .insertInto('my_table')
    .values(row)
    .onConflict((oc) =>
      oc.column('col_1d726898491fbca9a8dac855d2be1be8').doNothing(),
    )
}).types([1102, 'instantiations'])

bench('kysely..onConflict(oc => oc.column(column).doUpdateSet(row))', () => {
  return kysely
    .insertInto('my_table')
    .values(row)
    .onConflict((oc) =>
      oc.column('col_1d726898491fbca9a8dac855d2be1be8').doUpdateSet(row),
    )
}).types([2131, 'instantiations'])

bench('kysely..onConflict(oc => oc..doUpdateSet(eb => excluded ref))', () => {
  return kysely
    .insertInto('my_table')
    .values(row)
    .onConflict((oc) =>
      oc.column('col_1d726898491fbca9a8dac855d2be1be8').doUpdateSet({
        col_2e66a5c7e24d1d066230f368ce8b094e: (eb) =>
          eb.ref('excluded.col_2e66a5c7e24d1d066230f368ce8b094e'),
      }),
    )
}).types([4458, 'instantiations'])

bench('kysely.updateTable(table).set(row)', () => {
  return kysely.updateTable('my_table').set(row)
}).types([848, 'instantiations'])

bench('kysely.updateTable(table).set(column, value)', () => {
  return kysely
    .updateTable('my_table')
    .set('my_table.col_2e66a5c7e24d1d066230f368ce8b094e', 'x')
}).types([3078, 'instantiations'])

bench('kysely.updateTable(table).set(eb => row)', () => {
  return kysely.updateTable('my_table').set((eb) => ({
    col_1d726898491fbca9a8dac855d2be1be8: eb(
      'col_1d726898491fbca9a8dac855d2be1be8',
      '+',
      1,
    ),
  }))
}).types([3520, 'instantiations'])

bench('kyselyAny.insertInto(table).values(row)', () => {
  return kyselyAny.insertInto('my_table').values(row)
}).types([421, 'instantiations'])

bench('kyselyAny.updateTable(table).set(row)', () => {
  return kyselyAny.updateTable('my_table').set(row)
}).types([333, 'instantiations'])
