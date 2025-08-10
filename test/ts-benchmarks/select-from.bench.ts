import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import type { Kysely } from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

console.log('selectFrom.bench.ts:\n')

bench.baseline(() => {})

bench('kysely.selectFrom(table)', () => {
  return kysely.selectFrom('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([347, 'instantiations'])

bench('kysely.selectFrom(~table)', () => {
  // @ts-expect-error
  return kysely.selectFrom('my_table2')
}).types([5098, 'instantiations'])

bench('kysely.selectFrom(table as alias)', () => {
  return kysely.selectFrom('my_table as mt')
}).types([359, 'instantiations'])

bench('kysely.selectFrom([table])', () => {
  return kysely.selectFrom(['my_table'])
}).types([396, 'instantiations'])

bench('kysely.selectFrom([~table])', () => {
  // @ts-expect-error
  return kysely.selectFrom(['my_table2'])
}).types([5148, 'instantiations'])

bench('kysely.selectFrom([table as alias])', () => {
  return kysely.selectFrom(['my_table as mt'])
}).types([396, 'instantiations'])

bench('kysely.selectFrom([table, table])', () => {
  return kysely.selectFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b946',
  ])
}).types([396, 'instantiations'])

bench('kysely.selectFrom([table, ~table])', () => {
  return kysely.selectFrom([
    'my_table',
    // @ts-expect-error
    'table_000a8a0cb7f265a624c851d3e7f8b9462',
  ])
}).types([5151, 'instantiations'])

bench('kysely.selectFrom([table as alias, table as alias])', () => {
  return kysely.selectFrom([
    'my_table as mt',
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t',
  ])
}).types([396, 'instantiations'])

bench('kysely.selectFrom(kysely.selectFrom(table).as(t))', () => {
  return kysely.selectFrom(kysely.selectFrom('my_table').as('t'))
}).types([1242, 'instantiations'])

bench('kyselyAny.selectFrom(table)', () => {
  return kyselyAny.selectFrom('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([99, 'instantiations'])

bench('kyselyAny.selectFrom(~table)', () => {
  return kyselyAny.selectFrom('my_table2')
}).types([99, 'instantiations'])

bench('kyselyAny.selectFrom(table as alias)', () => {
  return kyselyAny.selectFrom('my_table as mt')
}).types([99, 'instantiations'])

bench('kyselyAny.selectFrom([table])', () => {
  return kyselyAny.selectFrom(['my_table'])
}).types([148, 'instantiations'])

bench('kyselyAny.selectFrom([~table])', () => {
  return kyselyAny.selectFrom(['my_table2'])
}).types([148, 'instantiations'])

bench('kyselyAny.selectFrom([table as alias])', () => {
  return kyselyAny.selectFrom(['my_table as mt'])
}).types([148, 'instantiations'])

bench('kyselyAny.selectFrom([table, table])', () => {
  return kyselyAny.selectFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b946',
  ])
}).types([148, 'instantiations'])

bench('kyselyAny.selectFrom([table, ~table])', () => {
  return kyselyAny.selectFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b9462',
  ])
}).types([148, 'instantiations'])

bench('kyselyAny.selectFrom([table as alias, table as alias])', () => {
  return kyselyAny.selectFrom([
    'my_table as mt',
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t',
  ])
}).types([148, 'instantiations'])
