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
}).types([23861, 'instantiations'])

bench('kysely.with(cte, qc => qc.deleteFrom(table))', () => {
  return kysely.with('cte', (qc) => qc.deleteFrom('my_table').returningAll())
}).types([20597, 'instantiations'])

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
}).types([23651, 'instantiations'])

bench('kyselyAny.with(cte, qc => qc.deleteFrom(table))', () => {
  return kyselyAny.with('cte', (qc) => qc.deleteFrom('my_table').returningAll())
}).types([20387, 'instantiations'])

bench('kysely.with(cte, () => selectQuery)', () => {
  return kysely.with('cte', () => kysely.selectFrom('my_table').selectAll())
}).types([643, 'instantiations'])

bench('kysely.with(cte, () => insertQuery)', () => {
  return kysely.with('cte', () => kysely.insertInto('my_table').returningAll())
}).types([3296, 'instantiations'])

bench('kysely.with(cte, () => updateQuery)', () => {
  return kysely.with('cte', () => kysely.updateTable('my_table').returningAll())
}).types([23849, 'instantiations'])

bench('kysely.with(cte, () => deleteQuery)', () => {
  return kysely.with('cte', () => kysely.deleteFrom('my_table').returningAll())
}).types([20585, 'instantiations'])

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
}).types([23639, 'instantiations'])

bench('kyselyAny.with(cte, () => deleteQuery)', () => {
  return kyselyAny.with('cte', () =>
    kyselyAny.deleteFrom('my_table').returningAll(),
  )
}).types([20375, 'instantiations'])

bench('kysely.with(cte, selectQuery)', () => {
  return kysely.with('cte', kysely.selectFrom('my_table').selectAll())
}).types([898, 'instantiations'])

bench('kysely.with(cte, insertQuery)', () => {
  return kysely.with('cte', kysely.insertInto('my_table').returningAll())
}).types([3265, 'instantiations'])

bench('kysely.with(cte, updateQuery)', () => {
  return kysely.with('cte', kysely.updateTable('my_table').returningAll())
}).types([23893, 'instantiations'])

bench('kysely.with(cte, deleteQuery)', () => {
  return kysely.with('cte', kysely.deleteFrom('my_table').returningAll())
}).types([20630, 'instantiations'])

bench('kyselyAny.with(cte, selectQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.selectFrom('my_table').selectAll())
}).types([672, 'instantiations'])

bench('kyselyAny.with(cte, insertQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.insertInto('my_table').returningAll())
}).types([2923, 'instantiations'])

bench('kyselyAny.with(cte, updateQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.updateTable('my_table').returningAll())
}).types([23683, 'instantiations'])

bench('kyselyAny.with(cte, deleteQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.deleteFrom('my_table').returningAll())
}).types([20420, 'instantiations'])
