import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d.js'
import type { Kysely } from '../../dist/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

console.log('mergeInto.bench.ts:\n')

bench.baseline(() => {})

bench('kysely.mergeInto(table)', () => {
  return kysely.mergeInto('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([317, 'instantiations'])

bench('kysely.mergeInto(~table)', () => {
  // @ts-expect-error
  return kysely.mergeInto('my_table2')
}).types([1074, 'instantiations'])

bench('kysely.mergeInto(table as alias)', () => {
  return kysely.mergeInto('my_table as mt')
}).types([331, 'instantiations'])

bench('kysely.mergeInto(table as table)', () => {
  return kysely.mergeInto('my_table as table_fff4c6195261874920bc7ce92d67d2c2')
}).types([331, 'instantiations'])

bench('kysely.mergeInto(table as alias).using(table)', () => {
  return kysely
    .mergeInto('my_table as mt')
    .using(
      'my_table',
      'my_table.col_1d726898491fbca9a8dac855d2be1be8',
      'mt.col_1d726898491fbca9a8dac855d2be1be8',
    )
}).types([7098, 'instantiations'])

bench('kysely.mergeInto(table as table).using(table)', () => {
  return kysely
    .mergeInto('my_table as table_fff4c6195261874920bc7ce92d67d2c2')
    .using(
      'my_table',
      'my_table.col_1d726898491fbca9a8dac855d2be1be8',
      'table_fff4c6195261874920bc7ce92d67d2c2.col_1d726898491fbca9a8dac855d2be1be8',
    )
}).types([7075, 'instantiations'])

bench(
  'kysely.mergeInto(table as alias).using(table as alias).whenMatchedAnd(alias.column)',
  () => {
    return kysely
      .mergeInto('my_table as mt')
      .using(
        'my_table as mt2',
        'mt2.col_1d726898491fbca9a8dac855d2be1be8',
        'mt.col_1d726898491fbca9a8dac855d2be1be8',
      )
      .whenMatchedAnd('mt2.col_1d726898491fbca9a8dac855d2be1be8', '=', 1)
  },
).types([10351, 'instantiations'])

bench(
  'kysely.mergeInto(table as alias).using(table as table).whenMatchedAnd(table.column)',
  () => {
    return kysely
      .mergeInto('my_table as mt')
      .using(
        'my_table as table_fff4c6195261874920bc7ce92d67d2c2',
        'table_fff4c6195261874920bc7ce92d67d2c2.col_1d726898491fbca9a8dac855d2be1be8',
        'mt.col_1d726898491fbca9a8dac855d2be1be8',
      )
      .whenMatchedAnd(
        'table_fff4c6195261874920bc7ce92d67d2c2.col_1d726898491fbca9a8dac855d2be1be8',
        '=',
        1,
      )
  },
).types([10351, 'instantiations'])

bench('kysely.$pickTables<tables>.mergeInto(table)', () => {
  return kysely
    .$pickTables<'table_fff4c6195261874920bc7ce92d67d2c2'>()
    .mergeInto('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([90, 'instantiations'])

bench('kysely.$pickTables<tables>.mergeInto(~table)', () => {
  return (
    kysely
      .$pickTables<'my_table'>()
      // @ts-expect-error
      .mergeInto('my_table2')
  )
}).types([117, 'instantiations'])

bench('kyselyAny.mergeInto(table)', () => {
  return kyselyAny.mergeInto('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([70, 'instantiations'])

bench('kyselyAny.mergeInto(~table)', () => {
  return kyselyAny.mergeInto('my_table2')
}).types([70, 'instantiations'])

bench('kyselyAny.mergeInto(table as alias)', () => {
  return kyselyAny.mergeInto('my_table as mt')
}).types([70, 'instantiations'])
