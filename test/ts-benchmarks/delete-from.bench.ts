import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import type { Kysely } from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

console.log('deleteFrom.bench.ts:\n')

bench.baseline(() => {})

bench('kysely.deleteFrom(table)', () => {
  return kysely.deleteFrom('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([342, 'instantiations'])

bench('kysely.deleteFrom(~table)', () => {
  // @ts-expect-error
  return kysely.deleteFrom('my_table2')
}).types([5085, 'instantiations'])

bench('kysely.deleteFrom(table as alias)', () => {
  return kysely.deleteFrom('my_table as mt')
}).types([356, 'instantiations'])

bench('kysely.deleteFrom([table])', () => {
  return kysely.deleteFrom(['my_table'])
}).types([379, 'instantiations'])

bench('kysely.deleteFrom([~table])', () => {
  // @ts-expect-error
  return kysely.deleteFrom(['my_table2'])
}).types([5126, 'instantiations'])

bench('kysely.deleteFrom([table as alias])', () => {
  return kysely.deleteFrom(['my_table as mt'])
}).types([379, 'instantiations'])

bench('kysely.deleteFrom([table, table])', () => {
  return kysely.deleteFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b946',
  ])
}).types([379, 'instantiations'])

bench('kysely.deleteFrom([table, ~table])', () => {
  return kysely.deleteFrom([
    'my_table',
    // @ts-expect-error
    'table_000a8a0cb7f265a624c851d3e7f8b9462',
  ])
}).types([5129, 'instantiations'])

bench('kysely.deleteFrom([table as alias, table as alias])', () => {
  return kysely.deleteFrom([
    'my_table as mt',
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t',
  ])
}).types([379, 'instantiations'])

bench('kysely.deleteFrom(kysely.selectFrom(table).as(t))', () => {
  return kysely.deleteFrom(kysely.selectFrom('my_table').as('t'))
}).types([1261, 'instantiations'])

bench('kysely.$pickTables<tables>.deleteFrom(table)', () => {
  return kysely
    .$pickTables<'table_fff4c6195261874920bc7ce92d67d2c2'>()
    .deleteFrom('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([112, 'instantiations'])

bench('kysely.$pickTables<tables>.deleteFrom(~table)', () => {
  return (
    kysely
      .$pickTables<'my_table'>()
      // @ts-expect-error
      .deleteFrom('my_table2')
  )
}).types([205, 'instantiations'])

bench('kyselyAny.deleteFrom(table)', () => {
  return kyselyAny.deleteFrom('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([94, 'instantiations'])

bench('kyselyAny.deleteFrom(~table)', () => {
  return kyselyAny.deleteFrom('my_table2')
}).types([94, 'instantiations'])

bench('kyselyAny.deleteFrom(table as alias)', () => {
  return kyselyAny.deleteFrom('my_table as mt')
}).types([94, 'instantiations'])

bench('kyselyAny.deleteFrom([table])', () => {
  return kyselyAny.deleteFrom(['my_table'])
}).types([131, 'instantiations'])

bench('kyselyAny.deleteFrom([~table])', () => {
  return kyselyAny.deleteFrom(['my_table2'])
}).types([131, 'instantiations'])

bench('kyselyAny.deleteFrom([table as alias])', () => {
  return kyselyAny.deleteFrom(['my_table as mt'])
}).types([131, 'instantiations'])

bench('kyselyAny.deleteFrom([table, table])', () => {
  return kyselyAny.deleteFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b946',
  ])
}).types([131, 'instantiations'])

bench('kyselyAny.deleteFrom([table, ~table])', () => {
  return kyselyAny.deleteFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b9462',
  ])
}).types([131, 'instantiations'])

bench('kyselyAny.deleteFrom([table as alias, table as alias])', () => {
  return kyselyAny.deleteFrom([
    'my_table as mt',
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t',
  ])
}).types([131, 'instantiations'])
