import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d.js'
import type { Kysely } from '../../dist/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

console.log('selectFrom.bench.ts:\n')

bench.baseline(() => {})

bench('kysely.selectFrom(table)', () => {
  return kysely.selectFrom('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([54, 'instantiations'])

bench('kysely.selectFrom(~table)', () => {
  // @ts-expect-error
  return kysely.selectFrom('my_table2')
}).types([14680, 'instantiations'])

bench('kysely.selectFrom(table as alias)', () => {
  return kysely.selectFrom('my_table as mt')
}).types([151, 'instantiations'])

bench('kysely.selectFrom([table])', () => {
  return kysely.selectFrom(['my_table'])
}).types([468, 'instantiations'])

bench('kysely.selectFrom([~table])', () => {
  // @ts-expect-error
  return kysely.selectFrom(['my_table2'])
}).types([14732, 'instantiations'])

bench('kysely.selectFrom([table as alias])', () => {
  return kysely.selectFrom(['my_table as mt'])
}).types([468, 'instantiations'])

bench('kysely.selectFrom([table, table])', () => {
  return kysely.selectFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b946',
  ])
}).types([468, 'instantiations'])

bench('kysely.selectFrom([table, ~table])', () => {
  return kysely.selectFrom([
    'my_table',
    // @ts-expect-error
    'table_000a8a0cb7f265a624c851d3e7f8b9462',
  ])
}).types([14738, 'instantiations'])

bench('kysely.selectFrom([table as alias, table as alias])', () => {
  return kysely.selectFrom([
    'my_table as mt',
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t',
  ])
}).types([468, 'instantiations'])

bench('kysely.selectFrom(kysely.selectFrom(table).as(t))', () => {
  return kysely.selectFrom(kysely.selectFrom('my_table').as('t'))
}).types([574, 'instantiations'])

bench('kysely.$pickTables<tables>.selectFrom(table)', () => {
  return kysely
    .$pickTables<'table_fff4c6195261874920bc7ce92d67d2c2'>()
    .selectFrom('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([72, 'instantiations'])

bench('kysely.$pickTables<tables>.selectFrom(~table)', () => {
  return (
    kysely
      .$pickTables<'my_table'>()
      // @ts-expect-error
      .selectFrom('my_table2')
  )
}).types([902, 'instantiations'])

bench('kyselyAny.selectFrom(table)', () => {
  return kyselyAny.selectFrom('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([54, 'instantiations'])

bench('kyselyAny.selectFrom(~table)', () => {
  return kyselyAny.selectFrom('my_table2')
}).types([54, 'instantiations'])

bench('kyselyAny.selectFrom(table as alias)', () => {
  return kyselyAny.selectFrom('my_table as mt')
}).types([54, 'instantiations'])

bench('kyselyAny.selectFrom([table])', () => {
  return kyselyAny.selectFrom(['my_table'])
}).types([222, 'instantiations'])

bench('kyselyAny.selectFrom([~table])', () => {
  return kyselyAny.selectFrom(['my_table2'])
}).types([222, 'instantiations'])

bench('kyselyAny.selectFrom([table as alias])', () => {
  return kyselyAny.selectFrom(['my_table as mt'])
}).types([222, 'instantiations'])

bench('kyselyAny.selectFrom([table, table])', () => {
  return kyselyAny.selectFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b946',
  ])
}).types([222, 'instantiations'])

bench('kyselyAny.selectFrom([table, ~table])', () => {
  return kyselyAny.selectFrom([
    'my_table',
    'table_000a8a0cb7f265a624c851d3e7f8b9462',
  ])
}).types([222, 'instantiations'])

bench('kyselyAny.selectFrom([table as alias, table as alias])', () => {
  return kyselyAny.selectFrom([
    'my_table as mt',
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t',
  ])
}).types([222, 'instantiations'])
