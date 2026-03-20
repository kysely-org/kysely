import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import {
  type SelectQueryBuilder,
  sql,
  type Kysely,
} from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

let query: SelectQueryBuilder<DB, 'my_table', object>
let queryAny: SelectQueryBuilder<any, 'my_table', object>

console.log('groupBy.bench.ts:\n')

bench.baseline(() => {
  query = kysely.selectFrom('my_table')
  queryAny = kyselyAny.selectFrom('my_table')
})

bench('kysely..groupBy(column)', () =>
  query.groupBy('col_164b7896ec8e770207febe0812c5f052'),
).types([182, 'instantiations'])

bench('kysely..groupBy(~column)', () =>
  // @ts-expect-error
  query.groupBy('col_164b7896ec8e770207febe0812c5f052_'),
).types([211, 'instantiations'])

bench('kysely..groupBy(table.column)', () =>
  query.groupBy('my_table.col_164b7896ec8e770207febe0812c5f052'),
).types([182, 'instantiations'])

bench('kysely..groupBy(~table.column)', () =>
  // @ts-expect-error
  query.groupBy('my_table.col_164b7896ec8e770207febe0812c5f052_'),
).types([211, 'instantiations'])

bench('kysely..groupBy(sql)', () =>
  query.groupBy(sql`col_164b7896ec8e770207febe0812c5f052`),
).types([224, 'instantiations'])

bench('kysely..groupBy(eb => ref)', () =>
  query.groupBy((eb) => eb.ref('col_164b7896ec8e770207febe0812c5f052')),
).types([967, 'instantiations'])

bench('kysely..groupBy(column).groupBy(column)', () =>
  query
    .groupBy('col_164b7896ec8e770207febe0812c5f052')
    .groupBy('col_1d726898491fbca9a8dac855d2be1be8'),
).types([186, 'instantiations'])

bench('kysely..groupBy([column, column])', () =>
  query.groupBy([
    'col_164b7896ec8e770207febe0812c5f052',
    'col_6f7a0a5f582c69dd4c6be0a819e862cb',
  ]),
).types([213, 'instantiations'])

bench('kysely..groupBy([column, ~column])', () =>
  query.groupBy([
    'col_164b7896ec8e770207febe0812c5f052',
    // @ts-expect-error
    'col_6f7a0a5f582c69dd4c6be0a819e862cb_',
  ]),
).types([255, 'instantiations'])

//

bench('kyselyAny..groupBy(column)', () =>
  queryAny.groupBy('col_164b7896ec8e770207febe0812c5f052'),
).types([182, 'instantiations'])

bench('kyselyAny..groupBy(~column)', () =>
  queryAny.groupBy('col_164b7896ec8e770207febe0812c5f052_'),
).types([182, 'instantiations'])

bench('kyselyAny..groupBy(table.column)', () =>
  queryAny.groupBy('my_table.col_164b7896ec8e770207febe0812c5f052'),
).types([182, 'instantiations'])

bench('kyselyAny..groupBy(sql)', () =>
  queryAny.groupBy(sql`col_164b7896ec8e770207febe0812c5f052`),
).types([224, 'instantiations'])

bench('kyselyAny..groupBy(eb => ref)', () =>
  queryAny.groupBy((eb) => eb.ref('col_164b7896ec8e770207febe0812c5f052')),
).types([635, 'instantiations'])

bench('kyselyAny..groupBy([column, column])', () =>
  queryAny.groupBy([
    'col_164b7896ec8e770207febe0812c5f052',
    'col_6f7a0a5f582c69dd4c6be0a819e862cb',
  ]),
).types([213, 'instantiations'])
