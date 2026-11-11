import assert from 'node:assert/strict'
import {
  DeleteQueryBuilder,
  InsertQueryBuilder,
  SelectQueryBuilder,
  type QueryBuilder,
} from '#typeorm-under-test'
import { sql } from 'kysely'
import {
  connect,
  expectType,
  isLegacy,
  Person,
  Pet,
  typeormVersion,
  type Equal,
} from './_setup.mts'

const { db, dataSource, cleanup } = await connect()
type SelectKeys = keyof SelectQueryBuilder<Person>
type InsertKeys = keyof InsertQueryBuilder<Pet>
type DeleteKeys = keyof DeleteQueryBuilder<Pet>
type BuilderKeys = keyof QueryBuilder<Person>
type Has<K extends string, Keys> = K extends Keys ? true : false

// Absent from TypeORM's builders in both versions: set operations, MERGE,
// DELETE ... USING, filtered aggregates, windows, CASE, JSON traversal.
expectType<Equal<Has<'union' | 'unionAll' | 'intersect' | 'except', SelectKeys>, false>>()
expectType<Equal<Has<'merge' | 'mergeInto', BuilderKeys>, false>>()
expectType<Equal<Has<'using' | 'innerJoin' | 'leftJoin', DeleteKeys>, false>>()
expectType<Equal<Has<'filterWhere' | 'over' | 'case' | 'fn', SelectKeys>, false>>()

// Present in TypeORM, and run here: recursive and materialized CTEs, NULLS LAST,
// DISTINCT ON, row locks, RETURNING, ON CONFLICT ON CONSTRAINT, stream().
const tree = await dataSource
  .createQueryBuilder()
  .addCommonTableExpression(
    'select id from folder where id = 1 union all select folder.id from folder inner join tree on tree.id = folder.parent_id',
    'tree',
    { recursive: true },
  )
  .select('tree.id', 'id')
  .from('tree', 'tree')
  .orderBy('tree.id')
  .getRawMany()
assert.deepEqual(tree, [{ id: 1 }, { id: 2 }, { id: 3 }])
const materialized = dataSource
  .createQueryBuilder()
  .addCommonTableExpression('select id from person where age >= 18', 'adults', {
    materialized: true,
  })
  .select('adults.id', 'id')
  .from('adults', 'adults')
assert.match(materialized.getSql(), /AS MATERIALIZED/)
const byAge = await dataSource
  .getRepository(Person)
  .createQueryBuilder('person')
  .select('person.id', 'id')
  .orderBy('person.age', 'DESC', 'NULLS LAST')
  .getRawMany()
assert.deepEqual(byAge.map((r: { id: number }) => r.id), [4, 1, 3, 2])
const distinctOwners = await dataSource
  .getRepository(Pet)
  .createQueryBuilder('pet')
  .select('pet.owner_id', 'owner_id')
  .distinctOn(['pet.owner_id'])
  .orderBy('pet.owner_id')
  .getRawMany()
assert.equal(distinctOwners.length, 3)
await dataSource.transaction(async (manager) => {
  const locked = await manager
    .getRepository(Person)
    .createQueryBuilder('person')
    .setLock('pessimistic_write')
    .setOnLocked('skip_locked')
    .where('person.id = :id', { id: 1 })
    .getOneOrFail()
  assert.equal(locked.id, 1)
})
const upsert = dataSource
  .createQueryBuilder()
  .insert()
  .into(Pet)
  .values({ id: 1, name: 'Catto', owner_id: 1 })
  .orUpdate(['name'], 'pet_pkey')
  .returning(['id'])
assert.match(upsert.getSql(), /ON CONFLICT ON CONSTRAINT "pet_pkey" DO UPDATE SET "name" = EXCLUDED\."name"/)
assert.match(upsert.getSql(), /RETURNING "id"/)
const inserted = await upsert.execute()
assert.deepEqual(inserted.raw, [{ id: 1 }])
const stream = await dataSource
  .getRepository(Person)
  .createQueryBuilder('person')
  .select('person.id', 'id')
  .orderBy('person.id')
  .stream()
const streamed: number[] = []
for await (const row of stream) streamed.push(row.id)
assert.deepEqual(streamed, [1, 2, 3, 4])

// INSERT ... SELECT exists in 1.x only.
const insertBuilder = dataSource.createQueryBuilder().insert().into(Pet)
assert.equal(
  typeof (insertBuilder as { valuesFromSelect?: unknown }).valuesFromSelect,
  isLegacy ? 'undefined' : 'function',
)

// Kysely builds each of the absent statements and runs it on PostgreSQL.
const union = await db
  .selectFrom('person')
  .select('first_name as name')
  .where('id', '=', 1)
  .union(db.selectFrom('pet').select('name').where('id', '=', 1))
  .orderBy('name')
  .execute()
assert.deepEqual(union, [{ name: 'Catto' }, { name: 'Jennifer' }])
const merged = await db
  .mergeInto('person as target')
  .using('pet as source', 'source.id', 'target.id')
  .whenMatched()
  .thenUpdateSet((eb) => ({ first_name: eb.ref('source.name') }))
  .executeTakeFirst()
assert.equal(merged.numChangedRows, 4n)
const deleted = await db
  .deleteFrom('pet')
  .using('person')
  .whereRef('pet.owner_id', '=', 'person.id')
  .where('person.age', '<', 18)
  .executeTakeFirst()
assert.equal(deleted.numDeletedRows, 1n)
const counts = await db
  .selectFrom('pet')
  .select((eb) => [
    eb.fn.countAll<string>().filterWhere('owner_id', '=', 1).as('jennifers'),
    eb.fn.countAll<string>().as('all'),
  ])
  .executeTakeFirstOrThrow()
assert.deepEqual(counts, { jennifers: '2', all: '3' })
const ranked = await db
  .selectFrom('pet')
  .select((eb) => [
    'name',
    eb.fn
      .agg<number>('row_number')
      .over((ob) => ob.partitionBy('owner_id').orderBy('name'))
      .as('rank'),
  ])
  .orderBy('name')
  .execute()
assert.deepEqual(
  ranked.map((r) => [r.name, Number(r.rank)]),
  [['Catto', 1], ['Doggo', 2], ['Parrot', 1]],
)
const pair = await db
  .selectFrom('pet')
  .select('name')
  .where((eb) => eb(eb.refTuple('id', 'owner_id'), 'in', [eb.tuple(1, 1)]))
  .execute()
assert.deepEqual(pair, [{ name: 'Catto' }])
const distinctFrom = await db
  .selectFrom('person')
  .select('id')
  .where('age', 'is distinct from', 40)
  .orderBy('id')
  .execute()
assert.equal(distinctFrom.length, 3)
void sql

await cleanup()
console.log(
  `PASS (TypeORM ${typeormVersion}): set operations, MERGE, DELETE USING, filtered aggregates, windows, and CASE absent from TypeORM's builders by type; recursive and materialized CTEs, NULLS LAST, DISTINCT ON, SKIP LOCKED, ON CONFLICT ON CONSTRAINT with RETURNING, and stream() present and run; valuesFromSelect in 1.x only; each absent statement built and run in Kysely`,
)
