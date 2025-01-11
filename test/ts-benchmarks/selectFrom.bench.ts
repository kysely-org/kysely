import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import type { Kysely } from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

bench.baseline(() => {})

bench('kysely.selectFrom(table)', () => {
  return kysely.selectFrom('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([372, 'instantiations'])

bench('kysely.selectFrom(~table)', () => {
  return kysely.selectFrom('my_table2')
}).types([6864, 'instantiations'])

bench('kysely.selectFrom(table as alias)', () => {
  return kysely.selectFrom('my_table as mt')
}).types([385, 'instantiations'])

bench('kysely.selectFrom([table])', () => {
  return kysely.selectFrom(['my_table'])
}).types([427, 'instantiations'])

bench('kysely.selectFrom([~table])', () => {
  return kysely.selectFrom(['my_table2'])
}).types([6914, 'instantiations'])

bench('kysely.selectFrom([table as alias])', () => {
  return kysely.selectFrom(['my_table as mt'])
}).types([427, 'instantiations'])

bench('kysely.selectFrom([table, table])', () => {
  return kysely.selectFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b946',
  ])
}).types([427, 'instantiations'])

bench('kysely.selectFrom([table, ~table])', () => {
  return kysely.selectFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b9462',
  ])
}).types([6917, 'instantiations'])

bench('kysely.selectFrom([table as alias, table as alias])', () => {
  return kysely.selectFrom([
    'my_table as mt',
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t',
  ])
}).types([427, 'instantiations'])

bench('kyselyAny.selectFrom(table)', () => {
  return kyselyAny.selectFrom('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([124, 'instantiations'])

bench('kyselyAny.selectFrom(~table)', () => {
  return kyselyAny.selectFrom('my_table2')
}).types([124, 'instantiations'])

bench('kyselyAny.selectFrom(table as alias)', () => {
  return kyselyAny.selectFrom('my_table as mt')
}).types([124, 'instantiations'])

bench('kyselyAny.selectFrom([table])', () => {
  return kyselyAny.selectFrom(['my_table'])
}).types([165, 'instantiations'])

bench('kyselyAny.selectFrom([~table])', () => {
  return kyselyAny.selectFrom(['my_table2'])
}).types([179, 'instantiations'])

bench('kyselyAny.selectFrom([table as alias])', () => {
  return kyselyAny.selectFrom(['my_table as mt'])
}).types([179, 'instantiations'])

bench('kyselyAny.selectFrom([table, table])', () => {
  return kyselyAny.selectFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b946',
  ])
}).types([179, 'instantiations'])

bench('kyselyAny.selectFrom([table, ~table])', () => {
  return kyselyAny.selectFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b9462',
  ])
}).types([179, 'instantiations'])

bench('kyselyAny.selectFrom([table as alias, table as alias])', () => {
  return kyselyAny.selectFrom([
    'my_table as mt',
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t',
  ])
}).types([179, 'instantiations'])
