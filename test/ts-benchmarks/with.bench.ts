import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import type { Kysely } from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

console.log('with.bench.ts:\n')

bench.baseline(() => {})

bench('kysely.with(cte, qc => qc.selectFrom(table))', () => {
  return kysely.with('cte', (qc) => qc.selectFrom('my_table').selectAll())
}).types([655, 'instantiations'])

bench('kysely.with(cte, qc => qc.insertInto(table))', () => {
  return kysely.with('cte', (qc) => qc.insertInto('my_table').returningAll())
}).types([3308, 'instantiations'])

bench('kysely.with(cte, qc => qc.updateTable(table))', () => {
  return kysely.with('cte', (qc) => qc.updateTable('my_table').returningAll())
}).types([23820, 'instantiations'])

bench('kysely.with(cte, qc => qc.deleteFrom(table))', () => {
  return kysely.with('cte', (qc) => qc.deleteFrom('my_table').returningAll())
}).types([20556, 'instantiations'])

bench('kyselyAny.with(cte, qc => qc.selectFrom(table))', () => {
  return kyselyAny.with('cte', (qc) => qc.selectFrom('my_table').selectAll())
}).types([451, 'instantiations'])

bench('kyselyAny.with(cte, qc => qc.insertInto(table))', () => {
  return kyselyAny.with('cte', (qc) => qc.insertInto('my_table').returningAll())
}).types([2966, 'instantiations'])

bench('kyselyAny.with(cte, qc => qc.updateTable(table))', () => {
  return kyselyAny.with('cte', (qc) =>
    qc.updateTable('my_table').returningAll(),
  )
}).types([23610, 'instantiations'])

bench('kyselyAny.with(cte, qc => qc.deleteFrom(table))', () => {
  return kyselyAny.with('cte', (qc) => qc.deleteFrom('my_table').returningAll())
}).types([20346, 'instantiations'])

bench('kysely.with(cte, () => selectQuery)', () => {
  return kysely.with('cte', () => kysely.selectFrom('my_table').selectAll())
}).types([643, 'instantiations'])

bench('kysely.with(cte, () => insertQuery)', () => {
  return kysely.with('cte', () => kysely.insertInto('my_table').returningAll())
}).types([3296, 'instantiations'])

bench('kysely.with(cte, () => updateQuery)', () => {
  return kysely.with('cte', () => kysely.updateTable('my_table').returningAll())
}).types([23808, 'instantiations'])

bench('kysely.with(cte, () => deleteQuery)', () => {
  return kysely.with('cte', () => kysely.deleteFrom('my_table').returningAll())
}).types([20544, 'instantiations'])

bench('kyselyAny.with(cte, () => selectQuery)', () => {
  return kyselyAny.with('cte', () =>
    kyselyAny.selectFrom('my_table').selectAll(),
  )
}).types([439, 'instantiations'])

bench('kyselyAny.with(cte, () => insertQuery)', () => {
  return kyselyAny.with('cte', () =>
    kyselyAny.insertInto('my_table').returningAll(),
  )
}).types([2954, 'instantiations'])

bench('kyselyAny.with(cte, () => updateQuery)', () => {
  return kyselyAny.with('cte', () =>
    kyselyAny.updateTable('my_table').returningAll(),
  )
}).types([23598, 'instantiations'])

bench('kyselyAny.with(cte, () => deleteQuery)', () => {
  return kyselyAny.with('cte', () =>
    kyselyAny.deleteFrom('my_table').returningAll(),
  )
}).types([20334, 'instantiations'])

bench('kysely.with(cte, selectQuery)', () => {
  return kysely.with('cte', kysely.selectFrom('my_table').selectAll())
}).types([898, 'instantiations'])

bench('kysely.with(cte, insertQuery)', () => {
  return kysely.with('cte', kysely.insertInto('my_table').returningAll())
}).types([3265, 'instantiations'])

bench('kysely.with(cte, updateQuery)', () => {
  return kysely.with('cte', kysely.updateTable('my_table').returningAll())
}).types([23852, 'instantiations'])

bench('kysely.with(cte, deleteQuery)', () => {
  return kysely.with('cte', kysely.deleteFrom('my_table').returningAll())
}).types([20589, 'instantiations'])

bench('kyselyAny.with(cte, selectQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.selectFrom('my_table').selectAll())
}).types([672, 'instantiations'])

bench('kyselyAny.with(cte, insertQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.insertInto('my_table').returningAll())
}).types([2923, 'instantiations'])

bench('kyselyAny.with(cte, updateQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.updateTable('my_table').returningAll())
}).types([23642, 'instantiations'])

bench('kyselyAny.with(cte, deleteQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.deleteFrom('my_table').returningAll())
}).types([20379, 'instantiations'])
