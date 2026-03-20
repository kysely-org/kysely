import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import type { Kysely } from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

console.log('updateTable.bench.ts:\n')

bench.baseline(() => {})

bench('kysely.updateTable(table)', () => {
  return kysely.updateTable('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([342, 'instantiations'])

bench('kysely.updateTable(~table)', () => {
  // @ts-expect-error
  return kysely.updateTable('my_table2')
}).types([5085, 'instantiations'])

bench('kysely.updateTable(table as alias)', () => {
  return kysely.updateTable('my_table as mt')
}).types([356, 'instantiations'])

bench('kysely.updateTable([table])', () => {
  return kysely.updateTable(['my_table'])
}).types([379, 'instantiations'])

bench('kysely.updateTable([~table])', () => {
  // @ts-expect-error
  return kysely.updateTable(['my_table2'])
}).types([5126, 'instantiations'])

bench('kysely.updateTable([table as alias])', () => {
  return kysely.updateTable(['my_table as mt'])
}).types([379, 'instantiations'])

bench('kysely.updateTable([table, table])', () => {
  return kysely.updateTable([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b946',
  ])
}).types([379, 'instantiations'])

bench('kysely.updateTable([table, ~table])', () => {
  return kysely.updateTable([
    'my_table',
    // @ts-expect-error
    'table_000a8a0cb7f265a624c851d3e7f8b9462',
  ])
}).types([5129, 'instantiations'])

bench('kysely.updateTable([table as alias, table as alias])', () => {
  return kysely.updateTable([
    'my_table as mt',
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t',
  ])
}).types([379, 'instantiations'])

bench('kyselyAny.updateTable(table)', () => {
  return kyselyAny.updateTable('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([94, 'instantiations'])

bench('kyselyAny.updateTable(~table)', () => {
  return kyselyAny.updateTable('my_table2')
}).types([94, 'instantiations'])

bench('kyselyAny.updateTable(table as alias)', () => {
  return kyselyAny.updateTable('my_table as mt')
}).types([94, 'instantiations'])

bench('kyselyAny.updateTable([table])', () => {
  return kyselyAny.updateTable(['my_table'])
}).types([131, 'instantiations'])

bench('kyselyAny.updateTable([~table])', () => {
  return kyselyAny.updateTable(['my_table2'])
}).types([131, 'instantiations'])

bench('kyselyAny.updateTable([table as alias])', () => {
  return kyselyAny.updateTable(['my_table as mt'])
}).types([131, 'instantiations'])

bench('kyselyAny.updateTable([table, table])', () => {
  return kyselyAny.updateTable([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b946',
  ])
}).types([131, 'instantiations'])

bench('kyselyAny.updateTable([table, ~table])', () => {
  return kyselyAny.updateTable([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b9462',
  ])
}).types([131, 'instantiations'])

bench('kyselyAny.updateTable([table as alias, table as alias])', () => {
  return kyselyAny.updateTable([
    'my_table as mt',
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t',
  ])
}).types([131, 'instantiations'])
