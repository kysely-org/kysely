import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import type { Kysely } from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

console.log('selectFrom.bench.ts:\n')

bench.baseline(() => {})

bench('kysely.selectFrom(table)', () => {
  return kysely.selectFrom('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([343, 'instantiations'])

bench('kysely.selectFrom(~table)', () => {
  // @ts-expect-error
  return kysely.selectFrom('my_table2')
}).types([5086, 'instantiations'])

bench('kysely.selectFrom(table as alias)', () => {
  return kysely.selectFrom('my_table as mt')
}).types([357, 'instantiations'])

bench('kysely.selectFrom([table])', () => {
  return kysely.selectFrom(['my_table'])
}).types([380, 'instantiations'])

bench('kysely.selectFrom([~table])', () => {
  // @ts-expect-error
  return kysely.selectFrom(['my_table2'])
}).types([5127, 'instantiations'])

bench('kysely.selectFrom([table as alias])', () => {
  return kysely.selectFrom(['my_table as mt'])
}).types([380, 'instantiations'])

bench('kysely.selectFrom([table, table])', () => {
  return kysely.selectFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b946',
  ])
}).types([380, 'instantiations'])

bench('kysely.selectFrom([table, ~table])', () => {
  return kysely.selectFrom([
    'my_table',
    // @ts-expect-error
    'table_000a8a0cb7f265a624c851d3e7f8b9462',
  ])
}).types([5130, 'instantiations'])

bench('kysely.selectFrom([table as alias, table as alias])', () => {
  return kysely.selectFrom([
    'my_table as mt',
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t',
  ])
}).types([380, 'instantiations'])

bench('kysely.selectFrom(kysely.selectFrom(table).as(t))', () => {
  return kysely.selectFrom(kysely.selectFrom('my_table').as('t'))
}).types([1230, 'instantiations'])

bench('kysely.$pickTables<tables>.selectFrom(table)', () => {
  return kysely
    .$pickTables<'table_fff4c6195261874920bc7ce92d67d2c2'>()
    .selectFrom('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([113, 'instantiations'])

bench('kysely.$pickTables<tables>.selectFrom(~table)', () => {
  return (
    kysely
      .$pickTables<'my_table'>()
      // @ts-expect-error
      .selectFrom('my_table2')
  )
}).types([206, 'instantiations'])

bench('kyselyAny.selectFrom(table)', () => {
  return kyselyAny.selectFrom('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([95, 'instantiations'])

bench('kyselyAny.selectFrom(~table)', () => {
  return kyselyAny.selectFrom('my_table2')
}).types([95, 'instantiations'])

bench('kyselyAny.selectFrom(table as alias)', () => {
  return kyselyAny.selectFrom('my_table as mt')
}).types([95, 'instantiations'])

bench('kyselyAny.selectFrom([table])', () => {
  return kyselyAny.selectFrom(['my_table'])
}).types([132, 'instantiations'])

bench('kyselyAny.selectFrom([~table])', () => {
  return kyselyAny.selectFrom(['my_table2'])
}).types([132, 'instantiations'])

bench('kyselyAny.selectFrom([table as alias])', () => {
  return kyselyAny.selectFrom(['my_table as mt'])
}).types([132, 'instantiations'])

bench('kyselyAny.selectFrom([table, table])', () => {
  return kyselyAny.selectFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b946',
  ])
}).types([132, 'instantiations'])

bench('kyselyAny.selectFrom([table, ~table])', () => {
  return kyselyAny.selectFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b9462',
  ])
}).types([132, 'instantiations'])

bench('kyselyAny.selectFrom([table as alias, table as alias])', () => {
  return kyselyAny.selectFrom([
    'my_table as mt',
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t',
  ])
}).types([132, 'instantiations'])
