import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import {
  type SelectQueryBuilder,
  type Kysely,
  sql,
} from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

let query: SelectQueryBuilder<DB, 'my_table', object>
let queryAny: SelectQueryBuilder<any, 'my_table', object>

console.log('having.bench.ts:\n')

bench.baseline(() => {
  query = kysely.selectFrom('my_table')
  queryAny = kyselyAny.selectFrom('my_table')
})

bench('kysely..having(column, op, value)', () =>
  query.having('col_1d726898491fbca9a8dac855d2be1be8', '=', 123),
).types([2186, 'instantiations'])

bench('kysely..having(~column, op, value)', () =>
  // @ts-expect-error
  query.having('col_1d726898491fbca9a8dac855d2be1be8_', '=', 123),
).types([3437, 'instantiations'])

bench('kysely..having(table.column, op, value)', () =>
  query.having('my_table.col_1d726898491fbca9a8dac855d2be1be8', '=', 123),
).types([2189, 'instantiations'])

bench('kysely..having(~table.column, op, value)', () =>
  // @ts-expect-error
  query.having('my_table_.col_1d726898491fbca9a8dac855d2be1be8', '=', 123),
).types([3437, 'instantiations'])

bench('kysely..having(column, is, null)', () =>
  query.having('col_6f5e1903664b084bf6197f2b86849d5e', 'is', null),
).types([2207, 'instantiations'])

bench('kysely..having(column, op, select)', () =>
  query.having(
    'col_1d726898491fbca9a8dac855d2be1be8',
    '=',
    kysely
      .selectFrom('my_table as t2')
      .select('t2.col_1d726898491fbca9a8dac855d2be1be8')
      .limit(1),
  ),
).types([3302, 'instantiations'])

bench('kysely..having(eb => eb(...))', () =>
  query.having((eb) => eb('col_1d726898491fbca9a8dac855d2be1be8', '=', 123)),
).types([2829, 'instantiations'])

bench('kysely..having(eb => eb.and([...]))', () =>
  query.having((eb) =>
    eb.and([
      eb('col_1d726898491fbca9a8dac855d2be1be8', '=', 123),
      eb('col_4d742b2f247bec99b41a60acbebc149a', '=', 456),
    ]),
  ),
).types([2933, 'instantiations'])

bench('kysely..having(sql`...`)', () =>
  query.having(sql<boolean>`col = 'foo'`),
).types([37, 'instantiations'])

bench('kysely..havingRef(column, op, column)', () =>
  query.havingRef(
    'col_1d726898491fbca9a8dac855d2be1be8',
    '=',
    'col_4d742b2f247bec99b41a60acbebc149a',
  ),
).types([134, 'instantiations'])

bench('kysely..havingRef(~column, op, column)', () =>
  query.havingRef(
    // @ts-expect-error
    'col_1d726898491fbca9a8dac855d2be1be8_',
    '=',
    'col_4d742b2f247bec99b41a60acbebc149a',
  ),
).types([143, 'instantiations'])

//

bench('kyselyAny..having(column, op, value)', () =>
  queryAny.having('col_1d726898491fbca9a8dac855d2be1be8', '=', 123),
).types([683, 'instantiations'])

bench('kyselyAny..having(~column, op, value)', () =>
  queryAny.having('col_1d726898491fbca9a8dac855d2be1be8_', '=', 123),
).types([683, 'instantiations'])

bench('kyselyAny..having(table.column, op, value)', () =>
  queryAny.having('my_table.col_1d726898491fbca9a8dac855d2be1be8', '=', 123),
).types([669, 'instantiations'])

bench('kyselyAny..having(eb => eb(...))', () =>
  queryAny.having((eb) => eb('col_1d726898491fbca9a8dac855d2be1be8', '=', 123)),
).types([1009, 'instantiations'])

bench('kyselyAny..having(sql`...`)', () =>
  queryAny.having(sql<boolean>`col = 'foo'`),
).types([37, 'instantiations'])

bench('kyselyAny..havingRef(column, op, column)', () =>
  queryAny.havingRef(
    'col_1d726898491fbca9a8dac855d2be1be8',
    '=',
    'col_4d742b2f247bec99b41a60acbebc149a',
  ),
).types([134, 'instantiations'])
