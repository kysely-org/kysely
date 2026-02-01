import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import type { Kysely } from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

console.log('insertInto.bench.ts:\n')

bench.baseline(() => {})

bench('kysely.insertInto(table)', () => {
  return kysely.insertInto('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([18, 'instantiations'])

bench('kysely.insertInto(~table)', () => {
  // @ts-expect-error
  return kysely.insertInto('my_table2')
}).types([19, 'instantiations'])

bench('kyselyAny.insertInto(table)', () => {
  return kyselyAny.insertInto('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([18, 'instantiations'])

bench('kyselyAny.insertInto(~table)', () => {
  return kyselyAny.insertInto('my_table2')
}).types([18, 'instantiations'])

bench('kysely.$pickTables<tables>.insertInto(table)', () => {
  return kysely
    .$pickTables<'table_fff4c6195261874920bc7ce92d67d2c2'>()
    .insertInto('table_fff4c6195261874920bc7ce92d67d2c2')
}).types([39, 'instantiations'])

bench('kysely.$pickTables<tables>.insertInto(~table)', () => {
  return (
    kysely
      .$pickTables<'my_table'>()
      // @ts-expect-error
      .insertInto('my_table2')
  )
}).types([40, 'instantiations'])
