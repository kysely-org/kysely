import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d.js'
import type { Kysely } from '../../dist/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

console.log('with.bench.ts:\n')

bench.baseline(() => {})

bench('kysely.with(cte, qc => qc.selectFrom(table))', () => {
  return kysely.with('cte', (qc) => qc.selectFrom('my_table').selectAll())
}).types([370, 'instantiations'])

bench('kysely.with(cte, qc => qc.insertInto(table))', () => {
  return kysely.with('cte', (qc) => qc.insertInto('my_table').returningAll())
}).types([3281, 'instantiations'])

bench('kysely.with(cte, qc => qc.updateTable(table))', () => {
  return kysely.with('cte', (qc) => qc.updateTable('my_table').returningAll())
}).types([32166, 'instantiations'])

bench('kysely.with(cte, qc => qc.deleteFrom(table))', () => {
  return kysely.with('cte', (qc) => qc.deleteFrom('my_table').returningAll())
}).types([17035, 'instantiations'])

bench('kyselyAny.with(cte, qc => qc.selectFrom(table))', () => {
  return kyselyAny.with('cte', (qc) => qc.selectFrom('my_table').selectAll())
}).types([414, 'instantiations'])

bench('kyselyAny.with(cte, qc => qc.insertInto(table))', () => {
  return kyselyAny.with('cte', (qc) => qc.insertInto('my_table').returningAll())
}).types([2966, 'instantiations'])

bench('kyselyAny.with(cte, qc => qc.updateTable(table))', () => {
  return kyselyAny.with('cte', (qc) =>
    qc.updateTable('my_table').returningAll(),
  )
}).types([32204, 'instantiations'])

bench('kyselyAny.with(cte, qc => qc.deleteFrom(table))', () => {
  return kyselyAny.with('cte', (qc) => qc.deleteFrom('my_table').returningAll())
}).types([17079, 'instantiations'])

bench('kysely.with(cte, () => selectQuery)', () => {
  return kysely.with('cte', () => kysely.selectFrom('my_table').selectAll())
}).types([358, 'instantiations'])

bench('kysely.with(cte, () => insertQuery)', () => {
  return kysely.with('cte', () => kysely.insertInto('my_table').returningAll())
}).types([3269, 'instantiations'])

bench('kysely.with(cte, () => updateQuery)', () => {
  return kysely.with('cte', () => kysely.updateTable('my_table').returningAll())
}).types([32154, 'instantiations'])

bench('kysely.with(cte, () => deleteQuery)', () => {
  return kysely.with('cte', () => kysely.deleteFrom('my_table').returningAll())
}).types([17023, 'instantiations'])

bench('kyselyAny.with(cte, () => selectQuery)', () => {
  return kyselyAny.with('cte', () =>
    kyselyAny.selectFrom('my_table').selectAll(),
  )
}).types([402, 'instantiations'])

bench('kyselyAny.with(cte, () => insertQuery)', () => {
  return kyselyAny.with('cte', () =>
    kyselyAny.insertInto('my_table').returningAll(),
  )
}).types([2954, 'instantiations'])

bench('kyselyAny.with(cte, () => updateQuery)', () => {
  return kyselyAny.with('cte', () =>
    kyselyAny.updateTable('my_table').returningAll(),
  )
}).types([32192, 'instantiations'])

bench('kyselyAny.with(cte, () => deleteQuery)', () => {
  return kyselyAny.with('cte', () =>
    kyselyAny.deleteFrom('my_table').returningAll(),
  )
}).types([17067, 'instantiations'])

bench('kysely.with(cte, selectQuery)', () => {
  return kysely.with('cte', kysely.selectFrom('my_table').selectAll())
}).types([617, 'instantiations'])

bench('kysely.with(cte, insertQuery)', () => {
  return kysely.with('cte', kysely.insertInto('my_table').returningAll())
}).types([3238, 'instantiations'])

bench('kysely.with(cte, updateQuery)', () => {
  return kysely.with('cte', kysely.updateTable('my_table').returningAll())
}).types([32198, 'instantiations'])

bench('kysely.with(cte, deleteQuery)', () => {
  return kysely.with('cte', kysely.deleteFrom('my_table').returningAll())
}).types([17068, 'instantiations'])

bench('kyselyAny.with(cte, selectQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.selectFrom('my_table').selectAll())
}).types([639, 'instantiations'])

bench('kyselyAny.with(cte, insertQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.insertInto('my_table').returningAll())
}).types([2923, 'instantiations'])

bench('kyselyAny.with(cte, updateQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.updateTable('my_table').returningAll())
}).types([32236, 'instantiations'])

bench('kyselyAny.with(cte, deleteQuery)', () => {
  return kyselyAny.with('cte', kyselyAny.deleteFrom('my_table').returningAll())
}).types([17112, 'instantiations'])
