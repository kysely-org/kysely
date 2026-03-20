import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import { type SelectQueryBuilder, type Kysely } from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

let query: SelectQueryBuilder<DB, 'my_table', object>
let queryAny: SelectQueryBuilder<any, 'my_table', object>

console.log('leftJoin.bench.ts:\n')

bench.baseline(() => {
  query = kysely.selectFrom('my_table')
  queryAny = kyselyAny.selectFrom('my_table')
})

bench('kysely..leftJoin(table, k1, k2)', () =>
  query.leftJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([6283, 'instantiations'])

bench('kysely..leftJoin(~table, k1, k2)', () =>
  query.leftJoin(
    // @ts-expect-error
    'table_000a8a0cb7f265a624c851d3e7f8b946_',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([33476, 'instantiations'])

bench('kysely..leftJoin(table, ~k1, k2)', () =>
  query.leftJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946',
    // @ts-expect-error
    'my_table.col_164b7896ec8e770207febe0812c5f052_',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([6831, 'instantiations'])

bench('kysely..leftJoin(table, k1, ~k2)', () =>
  query.leftJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    // @ts-expect-error
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4_',
  ),
).types([6834, 'instantiations'])

bench('kysely..leftJoin(table as alias, k1, k2)', () =>
  query.leftJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t2',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    't2.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([6271, 'instantiations'])

bench('kysely..leftJoin(table, cb)', () =>
  query.leftJoin('table_000a8a0cb7f265a624c851d3e7f8b946', (join) =>
    join.onRef(
      'my_table.col_164b7896ec8e770207febe0812c5f052',
      '=',
      'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
    ),
  ),
).types([3119, 'instantiations'])

bench('kysely..leftJoin(table, cb with ~column)', () =>
  query.leftJoin('table_000a8a0cb7f265a624c851d3e7f8b946', (join) =>
    join.onRef(
      // @ts-expect-error
      'my_table.col_164b7896ec8e770207febe0812c5f052_',
      '=',
      'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
    ),
  ),
).types([3171, 'instantiations'])

//

bench('kyselyAny..leftJoin(table, k1, k2)', () =>
  queryAny.leftJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([875, 'instantiations'])

bench('kyselyAny..leftJoin(~table, k1, k2)', () =>
  queryAny.leftJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946_',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([875, 'instantiations'])

bench('kyselyAny..leftJoin(table, ~k1, k2)', () =>
  queryAny.leftJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946',
    'my_table.col_164b7896ec8e770207febe0812c5f052_',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([875, 'instantiations'])

bench('kyselyAny..leftJoin(table, k1, ~k2)', () =>
  queryAny.leftJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4_',
  ),
).types([875, 'instantiations'])

bench('kyselyAny..leftJoin(table as alias, k1, k2)', () =>
  queryAny.leftJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t2',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    't2.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([865, 'instantiations'])

bench('kyselyAny..leftJoin(table, cb)', () =>
  queryAny.leftJoin('table_000a8a0cb7f265a624c851d3e7f8b946', (join) =>
    join.onRef(
      'my_table.col_164b7896ec8e770207febe0812c5f052',
      '=',
      'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
    ),
  ),
).types([2619, 'instantiations'])

bench('kyselyAny..leftJoin(table, cb with ~column)', () =>
  queryAny.leftJoin('table_000a8a0cb7f265a624c851d3e7f8b946', (join) =>
    join.onRef(
      'my_table.col_164b7896ec8e770207febe0812c5f052_',
      '=',
      'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
    ),
  ),
).types([2619, 'instantiations'])
