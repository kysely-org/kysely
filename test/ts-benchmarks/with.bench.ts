import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d.js'
import type { Kysely } from '../../dist/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

console.log('with.bench.ts:\n')

bench.baseline(() => {})

bench('kysely.with(cte, qc => qc.selectFrom(table))', () => {
  return kysely.with('cte', (qc) => qc.selectFrom('my_table').selectAll())
}).types([659, 'instantiations'])

bench('kysely.with(cte, qc => qc.insertInto(table))', () => {
  return kysely.with('cte', (qc) => qc.insertInto('my_table').returningAll())
}).types([3281, 'instantiations'])

bench('kysely.with(cte, qc => qc.updateTable(table))', () => {
  return kysely.with('cte', (qc) => qc.updateTable('my_table').returningAll())
}).types([23938, 'instantiations'])

bench('kysely.with(cte, qc => qc.deleteFrom(table))', () => {
  return kysely.with('cte', (qc) => qc.deleteFrom('my_table').returningAll())
}).types([11503, 'instantiations'])

bench('kyselyAny.with(cte, qc => qc.selectFrom(table))', () => {
  return kyselyAny.with('cte', (qc) => qc.selectFrom('my_table').selectAll())
}).types([455, 'instantiations'])

bench('kyselyAny.with(cte, qc => qc.insertInto(table))', () => {
  return kyselyAny.with('cte', (qc) => qc.insertInto('my_table').returningAll())
}).types([2966, 'instantiations'])

bench('kyselyAny.with(cte, qc => qc.updateTable(table))', () => {
  return kyselyAny.with('cte', (qc) =>
    qc.updateTable('my_table').returningAll(),
  )
}).types([23728, 'instantiations'])

bench('kyselyAny.with(cte, qc => qc.deleteFrom(table))', () => {
  return kyselyAny.with('cte', (qc) => qc.deleteFrom('my_table').returningAll())
}).types([11299, 'instantiations'])

bench('kysely.with(cte, () => selectQuery)', () => {
  return kysely.with('cte', () => kysely.selectFrom('my_table').selectAll())
}).types([647, 'instantiations'])

bench('kysely.with(cte, () => insertQuery)', () => {
  return kysely.with('cte', () => kysely.insertInto('my_table').returningAll())
}).types([3269, 'instantiations'])

bench('kysely.with(cte, () => updateQuery)', () => {
  return kysely.with('cte', () => kysely.updateTable('my_table').returningAll())
}).types([23926, 'instantiations'])

bench('kysely.with(cte, () => deleteQuery)', () => {
  return kysely.with('cte', () => kysely.deleteFrom('my_table').returningAll())
}).types([11491, 'instantiations'])

bench('kyselyAny.with(cte, () => selectQuery)', () => {
  return kyselyAny.with('cte', () =>
    kyselyAny.selectFrom('my_table').selectAll(),
  )
}).types([443, 'instantiations'])

bench('kyselyAny.with(cte, () => insertQuery)', () => {
  return kyselyAny.with('cte', () =>
    kyselyAny.insertInto('my_table').returningAll(),
  )
}).types([2954, 'instantiations'])

bench('kyselyAny.with(cte, () => updateQuery)', () => {
  return kyselyAny.with('cte', () =>
    kyselyAny.updateTable('my_table').returningAll(),
  )
}).types([23716, 'instantiations'])

bench('kyselyAny.with(cte, () => deleteQuery)', () => {
  return kyselyAny.with('cte', () =>
    kyselyAny.deleteFrom('my_table').returningAll(),
  )
}).types([11287, 'instantiations'])

bench('kysely.with(cte, selectQuery)', () => {
  return kysely.with('cte', kysely.selectFrom('my_table').selectAll())
}).types([906, 'instantiations'])

bench('kysely.with(cte, insertQuery)', () => {
  return kysely.with('cte', kysely.insertInto('my_table').returningAll())
}).types([3238, 'instantiations'])

bench('kysely.with(cte, updateQuery)', () => {
  return kysely.with('cte', kysely.updateTable('my_table').returningAll())
}).types([23970, 'instantiations'])

bench('kysely.with(cte, deleteQuery)', () => {
  return kysely.with('cte', kysely.deleteFrom('my_table').returningAll())
}).types([11536, 'instantiations'])

bench('kyselyAny.with(cte, selectQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.selectFrom('my_table').selectAll())
}).types([680, 'instantiations'])

bench('kyselyAny.with(cte, insertQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.insertInto('my_table').returningAll())
}).types([2923, 'instantiations'])

bench('kyselyAny.with(cte, updateQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.updateTable('my_table').returningAll())
}).types([23760, 'instantiations'])

bench('kyselyAny.with(cte, deleteQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.deleteFrom('my_table').returningAll())
}).types([11332, 'instantiations'])

bench('kysely.with(cte, ...).selectFrom(cte)', () => {
  return kysely
    .with('cte', (qc) => qc.selectFrom('my_table').select('id'))
    .selectFrom('cte')
    .selectAll()
}).types([66957, 'instantiations'])

bench('kysely.with(table, ...).selectFrom(table)', () => {
  return kysely
    .with('my_table', (qc) => qc.selectFrom('my_table').select('id'))
    .selectFrom('my_table')
    .selectAll()
}).types([66950, 'instantiations'])

bench('kysely.with(cte1, ...)...with(cte8, ...).selectFrom(cte8)', () => {
  return kysely
    .with('cte1', (qc) => qc.selectFrom('my_table').select('id'))
    .with('cte2', (qc) => qc.selectFrom('cte1').select('id'))
    .with('cte3', (qc) => qc.selectFrom('cte2').select('id'))
    .with('cte4', (qc) => qc.selectFrom('cte3').select('id'))
    .with('cte5', (qc) => qc.selectFrom('cte4').select('id'))
    .with('cte6', (qc) => qc.selectFrom('cte5').select('id'))
    .with('cte7', (qc) => qc.selectFrom('cte6').select('id'))
    .with('cte8', (qc) => qc.selectFrom('cte7').select('id'))
    .selectFrom('cte8')
    .selectAll()
}).types([77100, 'instantiations'])

bench('kysely.withRecursive(cte, ...).selectFrom(cte)', () => {
  return kysely
    .withRecursive('cte(id)', (qc) =>
      qc
        .selectFrom('my_table')
        .select('id')
        .unionAll(qc.selectFrom('cte').select('id')),
    )
    .selectFrom('cte')
    .selectAll()
}).types([63423, 'instantiations'])

bench('kyselyAny.with(cte, ...).selectFrom(cte)', () => {
  return kyselyAny
    .with('cte', (qc) => qc.selectFrom('my_table').select('id'))
    .selectFrom('cte')
    .selectAll()
}).types([2085, 'instantiations'])
