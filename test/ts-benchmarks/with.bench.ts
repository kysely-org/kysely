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
}).types([2867, 'instantiations'])

bench('kysely.with(cte, qc => qc.updateTable(table))', () => {
  return kysely.with('cte', (qc) => qc.updateTable('my_table').returningAll())
}).types([15311, 'instantiations'])

bench('kysely.with(cte, qc => qc.deleteFrom(table))', () => {
  return kysely.with('cte', (qc) => qc.deleteFrom('my_table').returningAll())
}).types([9311, 'instantiations'])

bench('kyselyAny.with(cte, qc => qc.selectFrom(table))', () => {
  return kyselyAny.with('cte', (qc) => qc.selectFrom('my_table').selectAll())
}).types([455, 'instantiations'])

bench('kyselyAny.with(cte, qc => qc.insertInto(table))', () => {
  return kyselyAny.with('cte', (qc) => qc.insertInto('my_table').returningAll())
}).types([2911, 'instantiations'])

bench('kyselyAny.with(cte, qc => qc.updateTable(table))', () => {
  return kyselyAny.with('cte', (qc) =>
    qc.updateTable('my_table').returningAll(),
  )
}).types([15101, 'instantiations'])

bench('kyselyAny.with(cte, qc => qc.deleteFrom(table))', () => {
  return kyselyAny.with('cte', (qc) => qc.deleteFrom('my_table').returningAll())
}).types([9107, 'instantiations'])

bench('kysely.with(cte, () => selectQuery)', () => {
  return kysely.with('cte', () => kysely.selectFrom('my_table').selectAll())
}).types([647, 'instantiations'])

bench('kysely.with(cte, () => insertQuery)', () => {
  return kysely.with('cte', () => kysely.insertInto('my_table').returningAll())
}).types([2855, 'instantiations'])

bench('kysely.with(cte, () => updateQuery)', () => {
  return kysely.with('cte', () => kysely.updateTable('my_table').returningAll())
}).types([15299, 'instantiations'])

bench('kysely.with(cte, () => deleteQuery)', () => {
  return kysely.with('cte', () => kysely.deleteFrom('my_table').returningAll())
}).types([9299, 'instantiations'])

bench('kyselyAny.with(cte, () => selectQuery)', () => {
  return kyselyAny.with('cte', () =>
    kyselyAny.selectFrom('my_table').selectAll(),
  )
}).types([443, 'instantiations'])

bench('kyselyAny.with(cte, () => insertQuery)', () => {
  return kyselyAny.with('cte', () =>
    kyselyAny.insertInto('my_table').returningAll(),
  )
}).types([2899, 'instantiations'])

bench('kyselyAny.with(cte, () => updateQuery)', () => {
  return kyselyAny.with('cte', () =>
    kyselyAny.updateTable('my_table').returningAll(),
  )
}).types([15089, 'instantiations'])

bench('kyselyAny.with(cte, () => deleteQuery)', () => {
  return kyselyAny.with('cte', () =>
    kyselyAny.deleteFrom('my_table').returningAll(),
  )
}).types([9095, 'instantiations'])

bench('kysely.with(cte, selectQuery)', () => {
  return kysely.with('cte', kysely.selectFrom('my_table').selectAll())
}).types([906, 'instantiations'])

bench('kysely.with(cte, insertQuery)', () => {
  return kysely.with('cte', kysely.insertInto('my_table').returningAll())
}).types([2824, 'instantiations'])

bench('kysely.with(cte, updateQuery)', () => {
  return kysely.with('cte', kysely.updateTable('my_table').returningAll())
}).types([15343, 'instantiations'])

bench('kysely.with(cte, deleteQuery)', () => {
  return kysely.with('cte', kysely.deleteFrom('my_table').returningAll())
}).types([9344, 'instantiations'])

bench('kyselyAny.with(cte, selectQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.selectFrom('my_table').selectAll())
}).types([680, 'instantiations'])

bench('kyselyAny.with(cte, insertQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.insertInto('my_table').returningAll())
}).types([2868, 'instantiations'])

bench('kyselyAny.with(cte, updateQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.updateTable('my_table').returningAll())
}).types([15133, 'instantiations'])

bench('kyselyAny.with(cte, deleteQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.deleteFrom('my_table').returningAll())
}).types([9140, 'instantiations'])

bench('kysely.with(cte, ...).selectFrom(cte)', () => {
  return kysely
    .with('cte', (qc) => qc.selectFrom('my_table').select('id'))
    .selectFrom('cte')
    .selectAll()
}).types([7559, 'instantiations'])

bench('kysely.with(table, ...).selectFrom(table)', () => {
  return kysely
    .with('my_table', (qc) => qc.selectFrom('my_table').select('id'))
    .selectFrom('my_table')
    .selectAll()
}).types([7552, 'instantiations'])

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
}).types([17632, 'instantiations'])

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
}).types([4019, 'instantiations'])

bench('kyselyAny.with(cte, ...).selectFrom(cte)', () => {
  return kyselyAny
    .with('cte', (qc) => qc.selectFrom('my_table').select('id'))
    .selectFrom('cte')
    .selectAll()
}).types([2060, 'instantiations'])

// Consume the returned query creator so these also measure CTE schema composition.
bench('select from a CTE in a large schema', () => {
  return kysely
    .with('cte', (qc) => qc.selectFrom('my_table').select('id'))
    .selectFrom('cte')
    .selectAll()
    .compile()
}).types([7595, 'instantiations'])

bench('chain three CTEs in a large schema', () => {
  return kysely
    .with('cte1', (qc) => qc.selectFrom('my_table').select('id'))
    .with('cte2', (qc) => qc.selectFrom('cte1').selectAll())
    .with('cte3', (qc) => qc.selectFrom('cte2').selectAll())
    .selectFrom('cte3')
    .selectAll()
    .compile()
}).types([8811, 'instantiations'])

bench('select from a CTE that shadows a table in a large schema', () => {
  return kysely
    .with('my_table', (qc) => qc.selectFrom('my_table').select('id'))
    .selectFrom('my_table')
    .select('id')
    .compile()
}).types([7638, 'instantiations'])

bench('select from a CTE in an any schema', () => {
  return kyselyAny
    .with('cte', (qc) => qc.selectFrom('my_table').select('id'))
    .selectFrom('cte')
    .selectAll()
    .compile()
}).types([2096, 'instantiations'])

declare const cteName: string

bench('select from a dynamically named CTE in a large schema', () => {
  return kysely
    .with(cteName, (qc) => qc.selectFrom('my_table').select('id'))
    .selectFrom(cteName)
    .select('id')
    .compile()
}).types([7373, 'instantiations'])
