import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d.js'
import { type SelectQueryBuilder, type Kysely, sql } from '../../dist/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

let query: SelectQueryBuilder<DB, 'my_table', object>
let queryAny: SelectQueryBuilder<any, 'my_table', object>

console.log('where.bench.ts:\n')

bench.baseline(() => {
  query = kysely.selectFrom('my_table')
  queryAny = kyselyAny.selectFrom('my_table')
})

bench('kysely..where(column, op, value)', () =>
  query.where('col_1d726898491fbca9a8dac855d2be1be8', '=', 123),
).types([2102, 'instantiations'])

bench('kysely..where(~column, op, value)', () =>
  // @ts-expect-error
  query.where('col_1d726898491fbca9a8dac855d2be1be8_', '=', 123),
).types([3353, 'instantiations'])

bench('kysely..where(table.column, op, value)', () =>
  query.where('my_table.col_1d726898491fbca9a8dac855d2be1be8', '=', 123),
).types([2105, 'instantiations'])

bench('kysely..where(~table.column, op, value)', () =>
  // @ts-expect-error
  query.where('my_table_.col_1d726898491fbca9a8dac855d2be1be8', '=', 123),
).types([3353, 'instantiations'])

bench('kysely..where(column, is, null)', () =>
  query.where('col_6f5e1903664b084bf6197f2b86849d5e', 'is', null),
).types([2108, 'instantiations'])

bench('kysely..where(column, op, select)', () =>
  query.where(
    'col_1d726898491fbca9a8dac855d2be1be8',
    '=',
    kysely
      .selectFrom('my_table as t2')
      .select('t2.col_1d726898491fbca9a8dac855d2be1be8')
      .limit(1),
  ),
).types([3078, 'instantiations'])

bench('kysely..where(eb => eb(...))', () =>
  query.where((eb) => eb('col_1d726898491fbca9a8dac855d2be1be8', '=', 123)),
).types([2691, 'instantiations'])

bench('kysely..where(eb => eb.and([...]))', () =>
  query.where((eb) =>
    eb.and([
      eb('col_1d726898491fbca9a8dac855d2be1be8', '=', 123),
      eb('col_4d742b2f247bec99b41a60acbebc149a', '=', 456),
    ]),
  ),
).types([2786, 'instantiations'])

bench('kysely..where(sql`...`)', () =>
  query.where(sql<boolean>`col = 'foo'`),
).types([45, 'instantiations'])

bench('kysely..whereRef(column, op, column)', () =>
  query.whereRef(
    'col_1d726898491fbca9a8dac855d2be1be8',
    '=',
    'col_4d742b2f247bec99b41a60acbebc149a',
  ),
).types([142, 'instantiations'])

bench('kysely..whereRef(~column, op, column)', () =>
  query.whereRef(
    // @ts-expect-error
    'col_1d726898491fbca9a8dac855d2be1be8_',
    '=',
    'col_4d742b2f247bec99b41a60acbebc149a',
  ),
).types([155, 'instantiations'])

//

bench('kyselyAny..where(column, op, value)', () =>
  queryAny.where('col_1d726898491fbca9a8dac855d2be1be8', '=', 123),
).types([709, 'instantiations'])

bench('kyselyAny..where(~column, op, value)', () =>
  queryAny.where('col_1d726898491fbca9a8dac855d2be1be8_', '=', 123),
).types([709, 'instantiations'])

bench('kyselyAny..where(table.column, op, value)', () =>
  queryAny.where('my_table.col_1d726898491fbca9a8dac855d2be1be8', '=', 123),
).types([695, 'instantiations'])

bench('kyselyAny..where(eb => eb(...))', () =>
  queryAny.where((eb) => eb('col_1d726898491fbca9a8dac855d2be1be8', '=', 123)),
).types([981, 'instantiations'])

bench('kyselyAny..where(sql`...`)', () =>
  queryAny.where(sql<boolean>`col = 'foo'`),
).types([45, 'instantiations'])

bench('kyselyAny..whereRef(column, op, column)', () =>
  queryAny.whereRef(
    'col_1d726898491fbca9a8dac855d2be1be8',
    '=',
    'col_4d742b2f247bec99b41a60acbebc149a',
  ),
).types([142, 'instantiations'])
