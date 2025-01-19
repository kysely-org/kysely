import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import { sql, type Kysely } from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

console.log('orderBy.bench.ts:\n')

bench.baseline(() => {
  return kysely.selectFrom('my_table')
})

bench('kysely..orderBy(column)', () => {
  return kysely
    .selectFrom('my_table')
    .orderBy('col_164b7896ec8e770207febe0812c5f052')
}).types([532, 'instantiations'])

bench('kysely..orderBy(~column)', () => {
  return kysely
    .selectFrom('my_table')
    .orderBy('col_164b7896ec8e770207febe0812c5f052_')
}).types([958, 'instantiations'])

bench('kysely..orderBy(column, asc)', () => {
  return kysely
    .selectFrom('my_table')
    .orderBy('col_164b7896ec8e770207febe0812c5f052', 'asc')
}).types([532, 'instantiations'])

bench('kysely..orderBy(column, ~asc)', () => {
  return kysely
    .selectFrom('my_table')
    .orderBy('col_164b7896ec8e770207febe0812c5f052', 'asc_')
}).types([538, 'instantiations'])

bench('kysely..orderBy(column, desc)', () => {
  return kysely
    .selectFrom('my_table')
    .orderBy('col_164b7896ec8e770207febe0812c5f052', 'desc')
}).types([532, 'instantiations'])

bench('kysely..orderBy(column asc)', () => {
  return kysely
    .selectFrom('my_table')
    .orderBy('col_164b7896ec8e770207febe0812c5f052 asc')
}).types([667, 'instantiations'])

bench('kysely..orderBy(column desc)', () => {
  return kysely
    .selectFrom('my_table')
    .orderBy('col_164b7896ec8e770207febe0812c5f052 desc')
}).types([667, 'instantiations'])

bench('kysely..orderBy(sql)', () => {
  return kysely
    .selectFrom('my_table')
    .orderBy(sql`col_164b7896ec8e770207febe0812c5f052 asc nulls first`)
}).types([564, 'instantiations'])

bench('kysely..orderBy(eb)', () => {
  return kysely
    .selectFrom('my_table')
    .orderBy((eb) => eb.ref('col_164b7896ec8e770207febe0812c5f052'))
}).types([1482, 'instantiations'])

bench('kysely..orderBy([column])', async () => {
  return kysely
    .selectFrom('my_table')
    .orderBy(['col_164b7896ec8e770207febe0812c5f052'])
}).types([974, 'instantiations'])

bench('kysely..orderBy([~column])', async () => {
  return kysely
    .selectFrom('my_table')
    .orderBy(['col_164b7896ec8e770207febe0812c5f052_'])
}).types([999, 'instantiations'])

bench('kysely..orderBy([column asc])', async () => {
  return kysely
    .selectFrom('my_table')
    .orderBy(['col_164b7896ec8e770207febe0812c5f052 asc'])
}).types([974, 'instantiations'])

bench('kysely..orderBy([column desc])', async () => {
  return kysely
    .selectFrom('my_table')
    .orderBy(['col_164b7896ec8e770207febe0812c5f052 desc'])
}).types([974, 'instantiations'])

bench('kysely..orderBy([sql])', () => {
  return kysely
    .selectFrom('my_table')
    .orderBy([sql`col_164b7896ec8e770207febe0812c5f052 asc nulls first`])
}).types([971, 'instantiations'])

bench('kysely..orderBy([eb])', () => {
  return kysely
    .selectFrom('my_table')
    .orderBy([(eb) => eb.ref('col_164b7896ec8e770207febe0812c5f052')])
}).types([1894, 'instantiations'])

bench('kyselyAny..orderBy(column)', () => {
  return kyselyAny
    .selectFrom('my_table')
    .orderBy('col_164b7896ec8e770207febe0812c5f052')
}).types([373, 'instantiations'])

bench('kyselyAny..orderBy(~column)', () => {
  return kyselyAny
    .selectFrom('my_table')
    .orderBy('col_164b7896ec8e770207febe0812c5f052_')
}).types([373, 'instantiations'])

bench('kyselyAny..orderBy(column, asc)', () => {
  return kyselyAny
    .selectFrom('my_table')
    .orderBy('col_164b7896ec8e770207febe0812c5f052', 'asc')
}).types([373, 'instantiations'])

bench('kyselyAny..orderBy(column, ~asc)', () => {
  return kyselyAny
    .selectFrom('my_table')
    .orderBy('col_164b7896ec8e770207febe0812c5f052', 'asc_')
}).types([379, 'instantiations'])

bench('kyselyAny..orderBy(column, desc)', () => {
  return kyselyAny
    .selectFrom('my_table')
    .orderBy('col_164b7896ec8e770207febe0812c5f052', 'desc')
}).types([373, 'instantiations'])

bench('kyselyAny..orderBy(column asc)', () => {
  return kyselyAny
    .selectFrom('my_table')
    .orderBy('col_164b7896ec8e770207febe0812c5f052 asc')
}).types([373, 'instantiations'])

bench('kyselyAny..orderBy(column desc)', () => {
  return kyselyAny
    .selectFrom('my_table')
    .orderBy('col_164b7896ec8e770207febe0812c5f052 desc')
}).types([373, 'instantiations'])

bench('kyselyAny..orderBy(sql)', () => {
  return kyselyAny
    .selectFrom('my_table')
    .orderBy(sql`col_164b7896ec8e770207febe0812c5f052 asc nulls first`)
}).types([405, 'instantiations'])

bench('kyselyAny..orderBy(eb)', () => {
  return kyselyAny
    .selectFrom('my_table')
    .orderBy((eb) => eb.ref('col_164b7896ec8e770207febe0812c5f052'))
}).types([935, 'instantiations'])

bench('kyselyAny..orderBy([column])', async () => {
  return kyselyAny
    .selectFrom('my_table')
    .orderBy(['col_164b7896ec8e770207febe0812c5f052'])
}).types([825, 'instantiations'])

bench('kyselyAny..orderBy([~column])', async () => {
  return kyselyAny
    .selectFrom('my_table')
    .orderBy(['col_164b7896ec8e770207febe0812c5f052_'])
}).types([825, 'instantiations'])

bench('kyselyAny..orderBy([column asc])', async () => {
  return kyselyAny
    .selectFrom('my_table')
    .orderBy(['col_164b7896ec8e770207febe0812c5f052 asc'])
}).types([825, 'instantiations'])

bench('kyselyAny..orderBy([column desc])', async () => {
  return kyselyAny
    .selectFrom('my_table')
    .orderBy(['col_164b7896ec8e770207febe0812c5f052 desc'])
}).types([825, 'instantiations'])

bench('kyselyAny..orderBy([sql])', () => {
  return kyselyAny
    .selectFrom('my_table')
    .orderBy([sql`col_164b7896ec8e770207febe0812c5f052 asc nulls first`])
}).types([822, 'instantiations'])

bench('kyselyAny..orderBy([eb])', () => {
  return kyselyAny
    .selectFrom('my_table')
    .orderBy([(eb) => eb.ref('col_164b7896ec8e770207febe0812c5f052')])
}).types([1357, 'instantiations'])
