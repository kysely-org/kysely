import assert from 'node:assert/strict'
import { sql, type SqlBool } from 'kysely'
import { jsonArrayFrom } from 'kysely/helpers/postgres'
import {
  connect,
  expectType,
  Person,
  Pet,
  Settings,
  typeormVersion,
  type Equal,
  type IsAny,
} from './_setup.mts'

const { db, dataSource, queries, cleanup } = await connect()
const repo = () => dataSource.getRepository(Person)

// A raw result annotation is not checked against the selection.
async function staleRawType() {
  const rows = await repo()
    .createQueryBuilder('person')
    .select('person.first_name', 'name')
    .where('person.id = :id', { id: 1 })
    .getRawMany<{ first_name: string }>()
  return rows[0]!.first_name
}
assert.equal(await staleRawType(), undefined)
const renamed = db
  .selectFrom('person')
  .select('first_name as name')
  .where('id', '=', 1)
const renamedRows = await renamed.execute()
expectType<Equal<typeof renamedRows, { name: string }[]>>()
// @ts-expect-error first_name is not a key of the renamed row.
renamedRows[0]!.first_name

// A partial selection does not narrow the entity type.
const partial = await repo()
  .createQueryBuilder('person')
  .select(['person.id'])
  .where('person.id = :id', { id: 1 })
  .getOneOrFail()
expectType<Equal<typeof partial, Person>>()
assert.equal(partial.id, 1)
assert.equal(partial.first_name, undefined)
const narrowed = await db
  .selectFrom('person')
  .select('id')
  .where('id', '=', 1)
  .executeTakeFirstOrThrow()
expectType<Equal<typeof narrowed, { id: number }>>()

// A computed column is raw only: entities do not carry it (typeorm/typeorm#296).
const computed = await repo()
  .createQueryBuilder('person')
  .addSelect('person.age >= 18', 'is_adult')
  .where('person.id = :id', { id: 2 })
  .getRawAndEntities()
assert.equal(computed.raw[0].is_adult, false)
assert.equal('is_adult' in computed.entities[0]!, false)
const computedKysely = await db
  .selectFrom('person')
  .select((eb) => [
    'id',
    eb('age', '>=', 18).as('is_adult'),
  ])
  .where('id', '=', 2)
  .executeTakeFirstOrThrow()
expectType<Equal<typeof computedKysely, { id: number; is_adult: SqlBool }>>()
assert.equal(computedKysely.is_adult, false)

// Relation hydration is typed through the entity class, and expands rows.
const graph = await repo()
  .createQueryBuilder('person')
  .leftJoinAndSelect('person.pets', 'pet')
  .orderBy('person.id')
  .addOrderBy('pet.id')
  .getRawAndEntities()
expectType<Equal<(typeof graph.entities)[number]['pets'], Pet[]>>()
assert.equal(graph.entities.length, 4)
assert.equal(graph.raw.length, 5)
assert.deepEqual(
  graph.entities.map((p) => p.pets.map((pet) => pet.name)),
  [['Catto', 'Doggo'], ['Kitty'], ['Parrot'], []],
)
const nested = await db
  .selectFrom('person')
  .select((eb) => [
    'first_name',
    jsonArrayFrom(
      eb
        .selectFrom('pet')
        .select('pet.name')
        .whereRef('pet.owner_id', '=', 'person.id')
        .orderBy('pet.id'),
    ).as('pets'),
  ])
  .orderBy('person.id')
  .execute()
expectType<
  Equal<typeof nested, { first_name: string; pets: { name: string }[] }[]>
>()
assert.deepEqual(
  nested.map((p) => p.pets.map((pet) => pet.name)),
  [['Catto', 'Doggo'], ['Kitty'], ['Parrot'], []],
)

// take() with a joined relation runs two statements; limit() cuts the rows.
queries.length = 0
const firstPage = await repo()
  .createQueryBuilder('person')
  .leftJoinAndSelect('person.pets', 'pet')
  .orderBy('person.id')
  .take(1)
  .getMany()
const takeQueries = queries.filter((q) => /^select/i.test(q))
assert.equal(firstPage.length, 1)
assert.equal(firstPage[0]!.pets.length, 2)
assert.equal(takeQueries.length, 2)
queries.length = 0
const limited = await repo()
  .createQueryBuilder('person')
  .leftJoinAndSelect('person.pets', 'pet')
  .orderBy('person.id')
  .limit(1)
  .getMany()
assert.equal(queries.filter((q) => /^select/i.test(q)).length, 1)
assert.equal(limited[0]!.pets.length, 1)

// JSON traversal: a template with a declared type, and a builder with an inferred one.
const settingsRepo = dataSource.getRepository(Settings)
const typeormCity = await settingsRepo
  .createQueryBuilder('settings')
  .select('settings.id', 'id')
  .addSelect("settings.profile->'addresses'->0->'city'", 'first_city')
  .orderBy('settings.id')
  .getRawMany()
expectType<IsAny<(typeof typeormCity)[number]>>()
assert.deepEqual(typeormCity, [
  { id: 1, first_city: 'Helsinki' },
  { id: 2, first_city: null },
])
const typeormTypo = await settingsRepo
  .createQueryBuilder('settings')
  .select("settings.profile->'addresses'->0->'ctiy'", 'first_city')
  .where('settings.id = :id', { id: 1 })
  .getRawMany<{ first_city: string | null }>()
assert.deepEqual(typeormTypo, [{ first_city: null }])
const kyselyCity = await db
  .selectFrom('user_settings')
  .select('id')
  .select((eb) =>
    eb.ref('profile', '->').key('addresses').at(0).key('city').as('first_city'),
  )
  .orderBy('id')
  .execute()
expectType<Equal<typeof kyselyCity, { id: number; first_city: string | null }[]>>()
assert.deepEqual(kyselyCity, [
  { id: 1, first_city: 'Helsinki' },
  { id: 2, first_city: null },
])
function kyselyTypo() {
  db.selectFrom('user_settings').select((eb) =>
    // @ts-expect-error ctiy is not a key of an address.
    eb.ref('profile', '->').key('addresses').at(0).key('ctiy').as('first_city'),
  )
}
void kyselyTypo

// CASE: a template keeps claiming string without an ELSE; Kysely infers the null.
const typeormLabel = await repo()
  .createQueryBuilder('person')
  .select('person.id', 'id')
  .addSelect(
    "case when person.age >= 18 then 'adult' when person.age < 18 then 'minor' end",
    'age_group',
  )
  .where('person.id = :id', { id: 2 })
  .getRawMany<{ id: number; age_group: string }>()
assert.deepEqual(typeormLabel, [{ id: 2, age_group: 'minor' }])
const kyselyLabel = db
  .selectFrom('person')
  .select('id')
  .select((eb) =>
    eb
      .case()
      .when('age', '>=', 18)
      .then('adult')
      .when('age', '<', 18)
      .then('minor')
      .end()
      .as('age_group'),
  )
type Label = Awaited<ReturnType<typeof kyselyLabel.execute>>[number]
expectType<Equal<Label['age_group'], string | null>>()

// Counting: getCount() is typed, other aggregates are raw text from pg.
const count = await repo().createQueryBuilder('person').getCount()
expectType<Equal<typeof count, number>>()
assert.equal(count, 4)
const rawCount = await repo()
  .createQueryBuilder('person')
  .select('count(*)', 'n')
  .getRawOne()
assert.equal(rawCount.n, '4')
const kyselyCount = await db
  .selectFrom('person')
  .select((eb) => eb.fn.countAll<string>().as('n'))
  .executeTakeFirstOrThrow()
assert.equal(kyselyCount.n, '4')
void sql

await cleanup()
console.log(
  `PASS (TypeORM ${typeormVersion}): a stale getRawMany annotation, a partial selection typed as the whole entity, a computed column absent from entities, typed relation hydration with row expansion against jsonArrayFrom, take() issuing two statements, JSON traversal and CASE as text with declared types against inferred ones, and typed getCount()`,
)
