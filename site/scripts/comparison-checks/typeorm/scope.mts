import assert from 'node:assert/strict'
import {
  connect,
  expectType,
  pgCode,
  Person,
  Pet,
  typeormVersion,
  type Equal,
  type IsAny,
} from './_setup.mts'

const { db, dataSource, cleanup } = await connect()
const repo = () => dataSource.getRepository(Person)

// Both build the same left join.
const typeormAdults = () =>
  repo()
    .createQueryBuilder('person')
    .leftJoin(Pet, 'pet', 'pet.owner_id = person.id')
    .select('person.first_name', 'first_name')
    .addSelect('pet.name', 'pet_name')
    .where('person.age >= :minAge', { minAge: 18 })
    .orderBy('person.first_name')
    .addOrderBy('pet.name')
const kyselyAdults = () =>
  db
    .selectFrom('person')
    .leftJoin('pet', 'pet.owner_id', 'person.id')
    .select(['person.first_name', 'pet.name as pet_name'])
    .where('person.age', '>=', 18)
    .orderBy('person.first_name')
    .orderBy('pet.name')

const typeormRows = await typeormAdults().getRawMany()
const typeormAnnotated = await typeormAdults().getRawMany<{
  first_name: string
  pet_name: string | null
}>()
const kyselyRows = await kyselyAdults().execute()
expectType<IsAny<(typeof typeormRows)[number]>>()
expectType<
  Equal<typeof kyselyRows, { first_name: string; pet_name: string | null }[]>
>()
const expected = [
  { first_name: 'Ada', pet_name: 'Parrot' },
  { first_name: 'Jennifer', pet_name: 'Catto' },
  { first_name: 'Jennifer', pet_name: 'Doggo' },
  { first_name: 'Sylvester', pet_name: null },
]
assert.deepEqual(typeormRows, expected)
assert.deepEqual(typeormAnnotated, expected)
assert.deepEqual(kyselyRows, expected)

// A join removed while collected filters still read its table.
function typeormMatchingPeople(options: { petName?: string }) {
  const query = repo()
    .createQueryBuilder('person')
    .select('person.first_name', 'first_name')
    .where('person.age >= :minAge', { minAge: 18 })
  if (options.petName) {
    query.andWhere('pet.name = :petName', { petName: options.petName })
  }
  return query
}
function kyselyMatchingPeople(options: { petName?: string }) {
  let query = db
    .selectFrom('person')
    .select('person.first_name')
    .where('person.age', '>=', 18)
  if (options.petName) {
    // @ts-expect-error pet is not available in this query.
    query = query.where('pet.name', '=', options.petName)
  }
  return query
}
assert.equal((await typeormMatchingPeople({}).getRawMany()).length, 3)
await assert.rejects(
  typeormMatchingPeople({ petName: 'Catto' }).getRawMany(),
  (error) => pgCode(error) === '42P01',
)
assert.equal((await kyselyMatchingPeople({}).execute()).length, 3)

// Invalid references: each passes TypeScript in TypeORM, and what rejects it.
const invalid: Record<string, () => Promise<unknown>> = {
  'select pet.name without joining pet': () =>
    repo()
      .createQueryBuilder('person')
      .select('pet.name', 'pet_name')
      .getRawMany(),
  'filter on pet.name without joining pet': () =>
    repo()
      .createQueryBuilder('person')
      .select('person.id', 'id')
      .where('pet.name = :name', { name: 'Catto' })
      .getRawMany(),
  'order by pet.name without joining pet': () =>
    repo()
      .createQueryBuilder('person')
      .select('person.id', 'id')
      .orderBy('pet.name')
      .getRawMany(),
  'misspelled column person.first_nam': () =>
    repo()
      .createQueryBuilder('person')
      .select('person.first_nam', 'name')
      .getRawMany(),
  'alias person as p, then filter on person.age': () =>
    repo()
      .createQueryBuilder('p')
      .select('p.id', 'id')
      .where('person.age >= :age', { age: 18 })
      .getRawMany(),
  'bind the string old to the integer age': () =>
    repo()
      .createQueryBuilder('person')
      .select('person.id', 'id')
      .where('person.age = :age', { age: 'old' })
      .getRawMany(),
  'select pet.name from the person repository with getMany': () =>
    repo().createQueryBuilder('person').select(['pet.name']).getMany(),
}
const outcomes: Record<string, string> = {}
for (const [label, run] of Object.entries(invalid)) {
  try {
    await run()
    outcomes[label] = 'ran'
  } catch (error) {
    const code = pgCode(error)
    outcomes[label] = code
      ? `PostgreSQL ${code}`
      : `TypeORM: ${(error as Error).constructor.name}: ${(error as Error).message.slice(0, 80)}`
  }
}
console.log(outcomes)
assert.equal(outcomes['select pet.name without joining pet'], 'PostgreSQL 42P01')
assert.equal(outcomes['filter on pet.name without joining pet'], 'PostgreSQL 42P01')
assert.equal(outcomes['order by pet.name without joining pet'], 'PostgreSQL 42P01')
assert.equal(outcomes['misspelled column person.first_nam'], 'PostgreSQL 42703')
assert.equal(
  outcomes['alias person as p, then filter on person.age'],
  'PostgreSQL 42P01',
)
assert.equal(outcomes['bind the string old to the integer age'], 'PostgreSQL 22P02')

function kyselyInvalid() {
  // @ts-expect-error pet is not in the query.
  db.selectFrom('person').select('pet.name')
  // @ts-expect-error pet is not in the query.
  db.selectFrom('person').select('id').where('pet.name', '=', 'Catto')
  // @ts-expect-error pet is not in the query.
  db.selectFrom('person').select('id').orderBy('pet.name')
  // @ts-expect-error first_nam is not a column of person.
  db.selectFrom('person').select('person.first_nam')
  // @ts-expect-error person is only in scope as p.
  db.selectFrom('person as p').select('p.id').where('person.age', '>=', 18)
  // @ts-expect-error age takes a number or null.
  db.selectFrom('person').select('id').where('age', '=', 'old')
}
void kyselyInvalid

function typeormTypedWrites() {
  const insert = () => dataSource.createQueryBuilder().insert().into(Person)
  const update = () => repo().createQueryBuilder().update()
  insert().values({
    // @ts-expect-error first_nam is not a property of Person.
    first_nam: 'x',
  })
  insert().values({
    // @ts-expect-error age takes a number or null.
    age: 'old',
  })
  update().set({
    // @ts-expect-error first_nam is not a property of Person.
    first_nam: 'x',
  })
  update().set({
    // @ts-expect-error age takes a number or null.
    age: 'old',
  })
}
void typeormTypedWrites

await cleanup()
console.log(
  `PASS (TypeORM ${typeormVersion}): matching left-join rows, raw results typed any and Kysely's inferred row, a removed join that compiles in TypeORM and fails in PostgreSQL only with the option set, six invalid references that pass TypeScript in TypeORM and are rejected by Kysely's types, and insert values and update sets that TypeORM types against the entity`,
)
