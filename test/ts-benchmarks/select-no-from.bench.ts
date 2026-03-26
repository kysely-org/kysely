import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d'
import { type Kysely, sql } from '../../dist/esm/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

console.log('select-no-from.bench.ts:\n')

bench.baseline(() => {})

bench('kysely.selectNoFrom(sql.as(alias))', () =>
  kysely.selectNoFrom(sql`1`.as('foo')),
).types([246, 'instantiations'])

bench('kysely.selectNoFrom([sql0.as(alias0), sql1.as(alias1)])', () =>
  kysely.selectNoFrom([sql`1`.as('a'), sql`2`.as('b')]),
).types([240, 'instantiations'])

bench('kysely.selectNoFrom((eb) => selectFrom)', () =>
  kysely.selectNoFrom((eb) => eb.selectFrom('my_table').selectAll().as('foo')),
).types([776, 'instantiations'])

bench('kysely.selectNoFrom((eb) => [selectFrom])', () =>
  kysely.selectNoFrom((eb) => [
    eb.selectFrom('my_table').selectAll().as('foo'),
  ]),
).types([774, 'instantiations'])

bench('kyselyAny.selectNoFrom(sql.as(alias))', () =>
  kyselyAny.selectNoFrom(sql`1`.as('foo')),
).types([246, 'instantiations'])

bench('kyselyAny.selectNoFrom([sql0.as(alias0), sql1.as(alias1)])', () =>
  kyselyAny.selectNoFrom([sql`1`.as('a'), sql`2`.as('b')]),
).types([240, 'instantiations'])

bench('kyselyAny.selectNoFrom((eb) => selectFrom)', () =>
  kyselyAny.selectNoFrom((eb) =>
    eb.selectFrom('my_table').selectAll().as('foo'),
  ),
).types([528, 'instantiations'])

bench('kyselyAny.selectNoFrom((eb) => [selectFrom])', () =>
  kyselyAny.selectNoFrom((eb) => [
    eb.selectFrom('my_table').selectAll().as('foo'),
  ]),
).types([526, 'instantiations'])
