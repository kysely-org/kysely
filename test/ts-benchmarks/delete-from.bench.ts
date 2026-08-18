import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d.js'
import type { Kysely } from '../../dist/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

console.log('deleteFrom.bench.ts:\n')

bench.baseline(() => {})

bench('kysely.deleteFrom(table)', () => {
  return kysely.deleteFrom('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([53, 'instantiations'])

bench('kysely.deleteFrom(~table)', () => {
  // @ts-expect-error
  return kysely.deleteFrom('my_table2')
}).types([14579, 'instantiations'])

bench('kysely.deleteFrom(table as alias)', () => {
  return kysely.deleteFrom('my_table as mt')
}).types([150, 'instantiations'])

bench('kysely.deleteFrom([table])', () => {
  return kysely.deleteFrom(['my_table'])
}).types([467, 'instantiations'])

bench('kysely.deleteFrom([~table])', () => {
  // @ts-expect-error
  return kysely.deleteFrom(['my_table2'])
}).types([14631, 'instantiations'])

bench('kysely.deleteFrom([table as alias])', () => {
  return kysely.deleteFrom(['my_table as mt'])
}).types([467, 'instantiations'])

bench('kysely.deleteFrom([table, table])', () => {
  return kysely.deleteFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b946',
  ])
}).types([467, 'instantiations'])

bench('kysely.deleteFrom([table, ~table])', () => {
  return kysely.deleteFrom([
    'my_table',
    // @ts-expect-error
    'table_000a8a0cb7f265a624c851d3e7f8b9462',
  ])
}).types([14637, 'instantiations'])

bench('kysely.deleteFrom([table as alias, table as alias])', () => {
  return kysely.deleteFrom([
    'my_table as mt',
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t',
  ])
}).types([467, 'instantiations'])

bench('kysely.deleteFrom(kysely.selectFrom(table).as(t))', () => {
  return kysely.deleteFrom(kysely.selectFrom('my_table').as('t'))
}).types([579, 'instantiations'])

bench('kysely.$pickTables<tables>.deleteFrom(table)', () => {
  return kysely
    .$pickTables<'table_fff4c6195261874920bc7ce92d67d2c2'>()
    .deleteFrom('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([71, 'instantiations'])

bench('kysely.$pickTables<tables>.deleteFrom(~table)', () => {
  return (
    kysely
      .$pickTables<'my_table'>()
      // @ts-expect-error
      .deleteFrom('my_table2')
  )
}).types([893, 'instantiations'])

bench('kyselyAny.deleteFrom(table)', () => {
  return kyselyAny.deleteFrom('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([53, 'instantiations'])

bench('kyselyAny.deleteFrom(~table)', () => {
  return kyselyAny.deleteFrom('my_table2')
}).types([53, 'instantiations'])

bench('kyselyAny.deleteFrom(table as alias)', () => {
  return kyselyAny.deleteFrom('my_table as mt')
}).types([53, 'instantiations'])

bench('kyselyAny.deleteFrom([table])', () => {
  return kyselyAny.deleteFrom(['my_table'])
}).types([221, 'instantiations'])

bench('kyselyAny.deleteFrom([~table])', () => {
  return kyselyAny.deleteFrom(['my_table2'])
}).types([221, 'instantiations'])

bench('kyselyAny.deleteFrom([table as alias])', () => {
  return kyselyAny.deleteFrom(['my_table as mt'])
}).types([221, 'instantiations'])

bench('kyselyAny.deleteFrom([table, table])', () => {
  return kyselyAny.deleteFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b946',
  ])
}).types([221, 'instantiations'])

bench('kyselyAny.deleteFrom([table, ~table])', () => {
  return kyselyAny.deleteFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b9462',
  ])
}).types([221, 'instantiations'])

bench('kyselyAny.deleteFrom([table as alias, table as alias])', () => {
  return kyselyAny.deleteFrom([
    'my_table as mt',
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t',
  ])
}).types([221, 'instantiations'])
