import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import type { Kysely } from '../../dist/esm/index.js'

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

bench('kysely.$pickTables<tables>.mergeInto(table)', () => {
  return kysely
    .$pickTables<'table_fff4c6195261874920bc7ce92d67d2c2'>()
    .mergeInto('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([87, 'instantiations'])

bench('kysely.$pickTables<tables>.mergeInto(~table)', () => {
  return (
    kysely
      .$pickTables<'my_table'>()
      // @ts-expect-error
      .mergeInto('my_table2')
  )
}).types([114, 'instantiations'])

bench('kyselyAny.mergeInto(table)', () => {
  return kyselyAny.mergeInto('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([70, 'instantiations'])

bench('kyselyAny.mergeInto(~table)', () => {
  return kyselyAny.mergeInto('my_table2')
}).types([70, 'instantiations'])

bench('kyselyAny.mergeInto(table as alias)', () => {
  return kyselyAny.mergeInto('my_table as mt')
}).types([70, 'instantiations'])
