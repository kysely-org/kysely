import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d.js'
import type { Kysely } from '../../dist/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

console.log('updateTable.bench.ts:\n')

bench.baseline(() => {})

bench('kysely.updateTable(table)', () => {
  return kysely.updateTable('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([53, 'instantiations'])

bench('kysely.updateTable(~table)', () => {
  // @ts-expect-error
  return kysely.updateTable('my_table2')
}).types([14592, 'instantiations'])

bench('kysely.updateTable(table as alias)', () => {
  return kysely.updateTable('my_table as mt')
}).types([150, 'instantiations'])

bench('kysely.updateTable([table])', () => {
  return kysely.updateTable(['my_table'])
}).types([467, 'instantiations'])

bench('kysely.updateTable([~table])', () => {
  // @ts-expect-error
  return kysely.updateTable(['my_table2'])
}).types([14644, 'instantiations'])

bench('kysely.updateTable([table as alias])', () => {
  return kysely.updateTable(['my_table as mt'])
}).types([467, 'instantiations'])

bench('kysely.updateTable([table, table])', () => {
  return kysely.updateTable([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b946',
  ])
}).types([467, 'instantiations'])

bench('kysely.updateTable([table, ~table])', () => {
  return kysely.updateTable([
    'my_table',
    // @ts-expect-error
    'table_000a8a0cb7f265a624c851d3e7f8b9462',
  ])
}).types([14650, 'instantiations'])

bench('kysely.updateTable([table as alias, table as alias])', () => {
  return kysely.updateTable([
    'my_table as mt',
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t',
  ])
}).types([467, 'instantiations'])

bench('kyselyAny.updateTable(table)', () => {
  return kyselyAny.updateTable('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([53, 'instantiations'])

bench('kyselyAny.updateTable(~table)', () => {
  return kyselyAny.updateTable('my_table2')
}).types([53, 'instantiations'])

bench('kyselyAny.updateTable(table as alias)', () => {
  return kyselyAny.updateTable('my_table as mt')
}).types([53, 'instantiations'])

bench('kyselyAny.updateTable([table])', () => {
  return kyselyAny.updateTable(['my_table'])
}).types([221, 'instantiations'])

bench('kyselyAny.updateTable([~table])', () => {
  return kyselyAny.updateTable(['my_table2'])
}).types([221, 'instantiations'])

bench('kyselyAny.updateTable([table as alias])', () => {
  return kyselyAny.updateTable(['my_table as mt'])
}).types([221, 'instantiations'])

bench('kyselyAny.updateTable([table, table])', () => {
  return kyselyAny.updateTable([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b946',
  ])
}).types([221, 'instantiations'])

bench('kyselyAny.updateTable([table, ~table])', () => {
  return kyselyAny.updateTable([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b9462',
  ])
}).types([221, 'instantiations'])

bench('kyselyAny.updateTable([table as alias, table as alias])', () => {
  return kyselyAny.updateTable([
    'my_table as mt',
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t',
  ])
}).types([221, 'instantiations'])
