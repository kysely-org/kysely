import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import type { Kysely } from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const knex: Kysely<any>

bench.baseline(() => {})

bench('kysely.selectFrom(table)', () => {
  return kysely.selectFrom('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([388, 'instantiations'])

bench('kysely.selectFrom(~table)', () => {
  return kysely.selectFrom('my_table2')
}).types([9314, 'instantiations'])

bench('kysely.selectFrom(table as alias)', () => {
  return kysely.selectFrom('my_table as mt')
}).types([401, 'instantiations'])

bench('kysely.selectFrom([table])', () => {
  return kysely.selectFrom(['my_table'])
}).types([413, 'instantiations'])

bench('kysely.selectFrom([~table])', () => {
  return kysely.selectFrom(['my_table2'])
}).types([9364, 'instantiations'])

bench('kysely.selectFrom([table as alias])', () => {
  return kysely.selectFrom(['my_table as mt'])
}).types([413, 'instantiations'])

bench('kysely.selectFrom([table, table])', () => {
  return kysely.selectFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b946',
  ])
}).types([413, 'instantiations'])

bench('kysely.selectFrom([table, ~table])', () => {
  return kysely.selectFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b9462',
  ])
}).types([9367, 'instantiations'])

bench('kysely.selectFrom([table as alias, table as alias])', () => {
  return kysely.selectFrom([
    'my_table as mt',
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t',
  ])
}).types([413, 'instantiations'])

bench('knex.selectFrom(table)', () => {
  return knex.selectFrom('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([140, 'instantiations'])

bench('knex.selectFrom(~table)', () => {
  return knex.selectFrom('my_table2')
}).types([140, 'instantiations'])

bench('knex.selectFrom(table as alias)', () => {
  return knex.selectFrom('my_table as mt')
}).types([140, 'instantiations'])

bench('knex.selectFrom([table])', () => {
  return knex.selectFrom(['my_table'])
}).types([165, 'instantiations'])

bench('knex.selectFrom([~table])', () => {
  return knex.selectFrom(['my_table2'])
}).types([165, 'instantiations'])

bench('knex.selectFrom([table as alias])', () => {
  return knex.selectFrom(['my_table as mt'])
}).types([165, 'instantiations'])

bench('knex.selectFrom([table, table])', () => {
  return knex.selectFrom(['my_table', 'table_000a8a0cb7f265a624c851d3e7f8b946'])
}).types([165, 'instantiations'])

bench('knex.selectFrom([table, ~table])', () => {
  return knex.selectFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b9462',
  ])
}).types([165, 'instantiations'])

bench('knex.selectFrom([table as alias, table as alias])', () => {
  return knex.selectFrom([
    'my_table as mt',
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t',
  ])
}).types([165, 'instantiations'])
