import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d.js'
import { type SelectQueryBuilder, type Kysely } from '../../dist/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

let query: SelectQueryBuilder<DB, 'my_table', object>
let queryAny: SelectQueryBuilder<any, 'my_table', object>

console.log('innerJoin.bench.ts:\n')

bench.baseline(() => {
  query = kysely.selectFrom('my_table')
  queryAny = kyselyAny.selectFrom('my_table')
})

bench('kysely..innerJoin(table, k1, k2)', () =>
  query.innerJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([797, 'instantiations'])

bench('kysely..innerJoin(~table, k1, k2)', () =>
  query.innerJoin(
    // @ts-expect-error
    'table_000a8a0cb7f265a624c851d3e7f8b946_',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([1350, 'instantiations'])

bench('kysely..innerJoin(table, ~k1, k2)', () =>
  query.innerJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946',
    // @ts-expect-error
    'my_table.col_164b7896ec8e770207febe0812c5f052_',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([1281, 'instantiations'])

bench('kysely..innerJoin(table, k1, ~k2)', () =>
  query.innerJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    // @ts-expect-error
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4_',
  ),
).types([1297, 'instantiations'])

bench('kysely..innerJoin(table as alias, k1, k2)', () =>
  query.innerJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t2',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    't2.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([793, 'instantiations'])

bench('kysely..innerJoin(table, cb)', () =>
  query.innerJoin('table_000a8a0cb7f265a624c851d3e7f8b946', (join) =>
    join.onRef(
      'my_table.col_164b7896ec8e770207febe0812c5f052',
      '=',
      'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
    ),
  ),
).types([2262, 'instantiations'])

bench('kysely..innerJoin(table, cb with ~column)', () =>
  query.innerJoin('table_000a8a0cb7f265a624c851d3e7f8b946', (join) =>
    join.onRef(
      // @ts-expect-error
      'my_table.col_164b7896ec8e770207febe0812c5f052_',
      '=',
      'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
    ),
  ),
).types([2318, 'instantiations'])

//

bench('kyselyAny..innerJoin(table, k1, k2)', () =>
  queryAny.innerJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([291, 'instantiations'])

bench('kyselyAny..innerJoin(~table, k1, k2)', () =>
  queryAny.innerJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946_',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([291, 'instantiations'])

bench('kyselyAny..innerJoin(table, ~k1, k2)', () =>
  queryAny.innerJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946',
    'my_table.col_164b7896ec8e770207febe0812c5f052_',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([291, 'instantiations'])

bench('kyselyAny..innerJoin(table, k1, ~k2)', () =>
  queryAny.innerJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4_',
  ),
).types([291, 'instantiations'])

bench('kyselyAny..innerJoin(table as alias, k1, k2)', () =>
  queryAny.innerJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t2',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    't2.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([289, 'instantiations'])

bench('kyselyAny..innerJoin(table, cb)', () =>
  queryAny.innerJoin('table_000a8a0cb7f265a624c851d3e7f8b946', (join) =>
    join.onRef(
      'my_table.col_164b7896ec8e770207febe0812c5f052',
      '=',
      'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
    ),
  ),
).types([1515, 'instantiations'])

bench('kyselyAny..innerJoin(table, cb with ~column)', () =>
  queryAny.innerJoin('table_000a8a0cb7f265a624c851d3e7f8b946', (join) =>
    join.onRef(
      'my_table.col_164b7896ec8e770207febe0812c5f052_',
      '=',
      'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
    ),
  ),
).types([1515, 'instantiations'])
