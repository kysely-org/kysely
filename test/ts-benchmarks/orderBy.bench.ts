import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import {
  type SelectQueryBuilder,
  sql,
  type Kysely,
} from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

let query: SelectQueryBuilder<
  DB,
  'my_table',
  {
    e862ca: string | null
  }
>
let queryAny: SelectQueryBuilder<any, 'my_table', { e862ca: string | null }>

console.log('orderBy.bench.ts:\n')

bench.baseline(() => {
  query = kysely
    .selectFrom('my_table')
    .select('my_table.col_6f7a0a5f582c69dd4c6be0a819e862cb as e862ca')

  queryAny = kyselyAny
    .selectFrom('my_table')
    .select('my_table.col_6f7a0a5f582c69dd4c6be0a819e862cb as e862ca')
})

bench('kysely..orderBy(column)', () =>
  query.orderBy('col_164b7896ec8e770207febe0812c5f052'),
).types([118, 'instantiations'])

bench('kysely..orderBy(~column)', () =>
  // @ts-expect-error
  query.orderBy('col_164b7896ec8e770207febe0812c5f052_'),
).types([365, 'instantiations'])

bench('kysely..orderBy(O)', () => query.orderBy('e862ca')).types([
  118,
  'instantiations',
])

bench('kysely..orderBy(column, asc)', () =>
  query.orderBy('col_164b7896ec8e770207febe0812c5f052', 'asc'),
).types([118, 'instantiations'])

bench('kysely..orderBy(~column, asc)', () =>
  // @ts-expect-error
  query.orderBy('col_164b7896ec8e770207febe0812c5f052_', 'asc'),
).types([136, 'instantiations'])

bench('kysely..orderBy(column, ~asc)', () =>
  // @ts-expect-error
  query.orderBy('col_164b7896ec8e770207febe0812c5f052', 'asc_'),
).types([124, 'instantiations'])

bench('kysely..orderBy(column, desc)', () =>
  query.orderBy('col_164b7896ec8e770207febe0812c5f052', 'desc'),
).types([118, 'instantiations'])

bench('kysely..orderBy(column, ob)', async () =>
  query.orderBy('col_164b7896ec8e770207febe0812c5f052', (ob) =>
    ob.asc().nullsLast(),
  ),
).types([119, 'instantiations'])

bench('kysely..orderBy(sql)', () =>
  query.orderBy(sql`col_164b7896ec8e770207febe0812c5f052 asc nulls first`),
).types([146, 'instantiations'])

bench('kysely..orderBy(select)', () =>
  query.orderBy(
    kysely
      .selectFrom('table_000a8a0cb7f265a624c851d3e7f8b946')
      .select(
        'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
      )
      .limit(1),
  ),
).types([671, 'instantiations'])

bench('kysely..orderBy(eb => select)', () =>
  query.orderBy((eb) =>
    eb
      .selectFrom('table_000a8a0cb7f265a624c851d3e7f8b946')
      .select(
        'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
      )
      .limit(1),
  ),
).types([882, 'instantiations'])

bench('deprecated - kysely..orderBy(column desc)', () =>
  query.orderBy('col_164b7896ec8e770207febe0812c5f052 desc'),
).types([346, 'instantiations'])

bench('deprecated - kysely..orderBy([column])', () =>
  query.orderBy(['col_164b7896ec8e770207febe0812c5f052']),
).types([307, 'instantiations'])

bench('kysely..orderBy(column).orderBy(column)', () =>
  query
    .orderBy('col_164b7896ec8e770207febe0812c5f052')
    .orderBy('col_1d726898491fbca9a8dac855d2be1be8'),
).types([124, 'instantiations'])

bench('deprecated - kysely..orderBy([column, column])', () =>
  query.orderBy([
    'col_164b7896ec8e770207febe0812c5f052',
    'col_6f7a0a5f582c69dd4c6be0a819e862cb',
  ]),
).types([307, 'instantiations'])

bench('kysely..orderBy(column).orderBy(column, desc)', () =>
  query
    .orderBy('col_1d726898491fbca9a8dac855d2be1be8')
    .orderBy('col_164b7896ec8e770207febe0812c5f052', 'desc'),
).types([124, 'instantiations'])

bench('deprecated - kysely..orderBy([column, column desc])', () =>
  query.orderBy([
    'col_6f7a0a5f582c69dd4c6be0a819e862cb',
    'col_164b7896ec8e770207febe0812c5f052 desc',
  ]),
).types([307, 'instantiations'])

bench('kysely..orderBy(column).orderBy(column).orderBy(column)', () =>
  query
    .orderBy('col_164b7896ec8e770207febe0812c5f052')
    .orderBy('col_1d726898491fbca9a8dac855d2be1be8')
    .orderBy('col_af4e225b70a9bbd83cc3bc0e7ef24cfa'),
).types([130, 'instantiations'])

bench('deprecated - kysely..orderBy([column, column, column])', () =>
  query.orderBy([
    'col_164b7896ec8e770207febe0812c5f052',
    'col_6f7a0a5f582c69dd4c6be0a819e862cb',
    'col_af4e225b70a9bbd83cc3bc0e7ef24cfa',
  ]),
).types([307, 'instantiations'])

//

bench('kyselyAny..orderBy(column)', () =>
  queryAny.orderBy('col_164b7896ec8e770207febe0812c5f052'),
).types([118, 'instantiations'])

bench('kyselyAny..orderBy(~column)', () =>
  queryAny.orderBy('col_164b7896ec8e770207febe0812c5f052_'),
).types([118, 'instantiations'])

bench('kyselyAny..orderBy(O)', () => queryAny.orderBy('e862ca')).types([
  118,
  'instantiations',
])

bench('kyselyAny..orderBy(column, asc)', () =>
  queryAny.orderBy('col_164b7896ec8e770207febe0812c5f052', 'asc'),
).types([118, 'instantiations'])

bench('kyselyAny..orderBy(~column, asc)', () =>
  queryAny.orderBy('col_164b7896ec8e770207febe0812c5f052_', 'asc'),
).types([118, 'instantiations'])

bench('kyselyAny..orderBy(column, ~asc)', () =>
  // @ts-expect-error
  queryAny.orderBy('col_164b7896ec8e770207febe0812c5f052', 'asc_'),
).types([124, 'instantiations'])

bench('kyselyAny..orderBy(column, desc)', () =>
  queryAny.orderBy('col_164b7896ec8e770207febe0812c5f052', 'desc'),
).types([118, 'instantiations'])

bench('kyselyAny..orderBy(column, ob)', async () =>
  queryAny.orderBy('col_164b7896ec8e770207febe0812c5f052', (ob) =>
    ob.asc().nullsLast(),
  ),
).types([119, 'instantiations'])

bench('kyselyAny..orderBy(sql)', () =>
  queryAny.orderBy(sql`col_164b7896ec8e770207febe0812c5f052 asc nulls first`),
).types([146, 'instantiations'])

bench('kyselyAny..orderBy(select)', () =>
  queryAny.orderBy(
    kyselyAny
      .selectFrom('table_000a8a0cb7f265a624c851d3e7f8b946')
      .select(
        'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
      )
      .limit(1),
  ),
).types([408, 'instantiations'])

bench('kyselyAny..orderBy(eb => select)', () =>
  queryAny.orderBy((eb) =>
    eb
      .selectFrom('table_000a8a0cb7f265a624c851d3e7f8b946')
      .select('col_164b7896ec8e770207febe0812c5f052')
      .limit(1),
  ),
).types([529, 'instantiations'])
