import 'reflect-metadata'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { DataSource, EntitySchema } from '#typeorm-under-test'
import { Kysely, PostgresDialect } from 'kysely'
import type { InferResult } from 'kysely'

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false
type Expect<T extends true> = T
type IsAny<T> = 0 extends 1 & T ? true : false

// DOC:database
interface Database {
  person: { id: number; first_name: string; age: number | null }
  pet: { id: number; name: string; owner_id: number }
}
// END:database

// DOC:entities
class Person {
  declare id: number
  declare first_name: string
  declare age: number | null
  declare pets: Pet[]
}

class Pet {
  declare id: number
  declare name: string
  declare owner_id: number
  declare owner: Person
}

const PersonSchema = new EntitySchema<Person>({
  name: 'Person',
  target: Person,
  tableName: 'person',
  columns: {
    id: { type: Number, primary: true },
    first_name: { type: String },
    age: { type: Number, nullable: true },
  },
  relations: {
    pets: { type: 'one-to-many', target: 'Pet', inverseSide: 'owner' },
  },
})

const PetSchema = new EntitySchema<Pet>({
  name: 'Pet',
  target: Pet,
  tableName: 'pet',
  columns: {
    id: { type: Number, primary: true },
    name: { type: String },
    owner_id: { type: Number },
  },
  relations: {
    owner: {
      type: 'many-to-one',
      target: 'Person',
      joinColumn: { name: 'owner_id' },
      inverseSide: 'pets',
    },
  },
})
// END:entities

const connectionString = process.env.COMPARISON_DATABASE_URL
assert(
  connectionString,
  'Set COMPARISON_DATABASE_URL to a disposable PostgreSQL server',
)
const schema = `typeorm_comparison_${randomUUID().replaceAll('-', '')}`
const admin = new Pool({ connectionString })
const pool = new Pool({ connectionString, options: `-c search_path=${schema}` })
const db = new Kysely<Database>({ dialect: new PostgresDialect({ pool }) })
const dataSource = new DataSource({
  type: 'postgres',
  url: connectionString,
  schema,
  entities: [PersonSchema, PetSchema],
  synchronize: false,
  extra: { options: `-c search_path=${schema}` },
})

// DOC:typeorm-joined
function typeormAdults() {
  return dataSource
    .getRepository(Person)
    .createQueryBuilder('person')
    .innerJoin(Pet, 'pet', 'pet.owner_id = person.id')
    .select('person.first_name', 'person_name')
    .addSelect('pet.name', 'pet_name')
    .where('person.age >= :minAge', { minAge: 18 })
    .orderBy('person.id')
    .addOrderBy('pet.id')
}

async function typeormListing() {
  return typeormAdults().getRawMany()
}
// END:typeorm-joined

// DOC:kysely-joined
function kyselyAdults() {
  return db
    .selectFrom('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .select(['person.first_name as person_name', 'pet.name as pet_name'])
    .where('person.age', '>=', 18)
    .orderBy('person.id')
    .orderBy('pet.id')
}

async function kyselyListing() {
  return kyselyAdults().execute()
}
// END:kysely-joined

// DOC:stale-raw-type
async function staleRawType() {
  const rows = await typeormAdults()
    .select('person.first_name', 'name')
    .addSelect('pet.name', 'pet_name')
    .getRawMany<{ person_name: string; pet_name: string }>()

  return rows[0]?.person_name // The declared person_name property is missing at runtime.
}
// END:stale-raw-type

// DOC:kysely-renamed
function kyselyRenamed() {
  return kyselyAdults()
    .clearSelect()
    .select(['person.first_name as name', 'pet.name as pet_name'])
    .execute()
}
// END:kysely-renamed

// DOC:partial-entity
async function partialEntity() {
  const person = await dataSource
    .getRepository(Person)
    .createQueryBuilder('person')
    .select(['person.id'])
    .where('person.id = :id', { id: 1 })
    .getOneOrFail()

  return person.first_name // Typed as string; not selected at runtime.
}
// END:partial-entity

function invalidKyselyEdits() {
  // @ts-expect-error pet is outside this query's table context.
  db.selectFrom('person').select('id').where('pet.name', '=', 'Catto')
  // @ts-expect-error The selected column is misspelled.
  db.selectFrom('person').select('first_nam')
  // @ts-expect-error The table is now available only as p.
  db.selectFrom('person as p').select('p.id').where('person.age', '>=', 18)
  // @ts-expect-error age takes a number or null, not a string.
  db.selectFrom('person').select('id').where('age', '=', 'old')

  const renamed = kyselyAdults()
    .clearSelect()
    .select('person.first_name as name')
  type Row = InferResult<typeof renamed>[number]
  // @ts-expect-error The original alias is absent from the result.
  const stale: Row['person_name'] = ''
  return stale
}
void invalidKyselyEdits

// DOC:typeorm-invalid
function invalidTypeormEdits() {
  return [
    dataSource
      .getRepository(Person)
      .createQueryBuilder('person')
      .select('person.id', 'id')
      .where('pet.name = :name', { name: 'Catto' }),
    dataSource
      .getRepository(Person)
      .createQueryBuilder('person')
      .select('person.first_nam', 'name'),
    dataSource
      .getRepository(Person)
      .createQueryBuilder('p')
      .select('p.id', 'id')
      .where('person.age >= :age', { age: 18 }),
    dataSource
      .getRepository(Person)
      .createQueryBuilder('person')
      .select('person.id', 'id')
      .where('person.age = :age', { age: 'old' }),
  ]
}
// END:typeorm-invalid

// DOC:typeorm-reuse
function typeormBranches() {
  const base = typeormAdults()
  const preview = base.limit(1)
  const everyone = base
  // everyone now has LIMIT 1 too.
  return { preview, everyone }
}
// END:typeorm-reuse

// DOC:typeorm-clone
function typeormIndependentBranches() {
  const base = typeormAdults()
  const preview = base.clone().limit(1)
  const everyone = base.clone()
  return { preview, everyone }
}
// END:typeorm-clone

// DOC:kysely-reuse
function kyselyBranches() {
  const base = kyselyAdults()
  const preview = base.limit(1)
  const everyone = base
  return { preview, everyone }
}
// END:kysely-reuse

// DOC:parameter-collision
function collidingParameters() {
  return typeormAdults()
    .andWhere('person.first_name = :name', { name: 'Jennifer' })
    .andWhere('pet.name = :name', { name: 'Catto' })
    .getRawMany()
}
// END:parameter-collision

// DOC:unique-parameters
function uniqueParameters() {
  return typeormAdults()
    .andWhere('person.first_name = :personName', { personName: 'Jennifer' })
    .andWhere('pet.name = :petName', { petName: 'Catto' })
    .getRawMany()
}
// END:unique-parameters

// DOC:kysely-parameters
function kyselyParameters() {
  return kyselyAdults()
    .where('person.first_name', '=', 'Jennifer')
    .where('pet.name', '=', 'Catto')
    .execute()
}
// END:kysely-parameters

// DOC:typeorm-aggregate
function typeormPetCounts() {
  return dataSource
    .getRepository(Person)
    .createQueryBuilder('person')
    .innerJoin(Pet, 'pet', 'pet.owner_id = person.id')
    .select('person.id', 'person_id')
    .addSelect('count(pet.id)::integer', 'pet_count')
    .groupBy('person.id')
    .having('count(pet.id) >= :minPets', { minPets: 2 })
    .orderBy('person.id')
    .getRawMany<{ person_id: number; pet_count: number }>()
}
// END:typeorm-aggregate

// DOC:kysely-aggregate
function kyselyPetCounts() {
  return db
    .selectFrom('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .select('person.id as person_id')
    .select((eb) =>
      eb.cast<number>(eb.fn.count('pet.id'), 'integer').as('pet_count'),
    )
    .groupBy('person.id')
    .having((eb) => eb.fn.count('pet.id'), '>=', 2)
    .orderBy('person.id')
    .execute()
}
// END:kysely-aggregate

type RawRowsAreAny = Expect<
  IsAny<Awaited<ReturnType<typeof typeormListing>>[number]>
>
type InferredJoin = Expect<
  Equal<
    Awaited<ReturnType<typeof kyselyListing>>,
    { person_name: string; pet_name: string }[]
  >
>
type InferredCount = Expect<
  Equal<
    Awaited<ReturnType<typeof kyselyPetCounts>>,
    { person_id: number; pet_count: number }[]
  >
>
type PartialEntityStillSaysString = Expect<
  Equal<Awaited<ReturnType<typeof partialEntity>>, string>
>
type RenamedJoin = Expect<
  Equal<
    Awaited<ReturnType<typeof kyselyRenamed>>,
    { name: string; pet_name: string }[]
  >
>

try {
  await admin.query(`create schema "${schema}"`)
  await db.schema
    .createTable('person')
    .addColumn('id', 'integer', (c) => c.primaryKey())
    .addColumn('first_name', 'text', (c) => c.notNull())
    .addColumn('age', 'integer')
    .execute()
  await db.schema
    .createTable('pet')
    .addColumn('id', 'integer', (c) => c.primaryKey())
    .addColumn('name', 'text', (c) => c.notNull())
    .addColumn('owner_id', 'integer', (c) =>
      c.notNull().references('person.id'),
    )
    .execute()
  await db
    .insertInto('person')
    .values([
      { id: 1, first_name: 'Jennifer', age: 40 },
      { id: 2, first_name: 'Arnold', age: 17 },
      { id: 3, first_name: 'Ada', age: 30 },
      { id: 4, first_name: 'NoPets', age: null },
    ])
    .execute()
  await db
    .insertInto('pet')
    .values([
      { id: 1, name: 'Catto', owner_id: 1 },
      { id: 2, name: 'Doggo', owner_id: 1 },
      { id: 3, name: 'Kitty', owner_id: 2 },
      { id: 4, name: 'Parrot', owner_id: 3 },
    ])
    .execute()
  await dataSource.initialize()

  const expected = [
    { person_name: 'Jennifer', pet_name: 'Catto' },
    { person_name: 'Jennifer', pet_name: 'Doggo' },
    { person_name: 'Ada', pet_name: 'Parrot' },
  ]
  assert.deepEqual(await typeormListing(), expected)
  assert.deepEqual(await kyselyListing(), expected)
  assert.equal(await staleRawType(), undefined)
  assert.deepEqual(
    await kyselyRenamed(),
    expected.map(({ person_name, pet_name }) => ({
      name: person_name,
      pet_name,
    })),
  )
  assert.equal(await partialEntity(), undefined)
  console.log(
    'PASS: matching joined rows, stale raw alias, and partial entity result',
  )

  for (const [i, qb] of invalidTypeormEdits().entries()) {
    await assert.rejects(qb.getRawMany(), (error: any) =>
      ['42P01', '42703', '22P02'].includes(error.driverError?.code),
    )
    console.log(
      `PASS: invalid edit ${i + 1} compiles and is rejected by PostgreSQL`,
    )
  }

  const mutable = typeormBranches()
  assert.equal(mutable.preview, mutable.everyone)
  assert.equal((await mutable.everyone.getRawMany()).length, 1)
  const cloned = typeormIndependentBranches()
  assert.notEqual(cloned.preview, cloned.everyone)
  assert.equal((await cloned.preview.getRawMany()).length, 1)
  assert.equal((await cloned.everyone.getRawMany()).length, 3)
  const immutable = kyselyBranches()
  assert.notEqual(immutable.preview, immutable.everyone)
  assert.equal((await immutable.preview.execute()).length, 1)
  assert.equal((await immutable.everyone.execute()).length, 3)
  console.log(
    'PASS: shared mutation, TypeORM clone remedy, and independent Kysely branches',
  )

  assert.deepEqual(await collidingParameters(), [])
  const jenniferCatto = [{ person_name: 'Jennifer', pet_name: 'Catto' }]
  assert.deepEqual(await uniqueParameters(), jenniferCatto)
  assert.deepEqual(await kyselyParameters(), jenniferCatto)
  console.log('PASS: parameter collision and both corrected queries')

  const counts = [{ person_id: 1, pet_count: 2 }]
  assert.deepEqual(await typeormPetCounts(), counts)
  assert.deepEqual(await kyselyPetCounts(), counts)

  const entity = await dataSource
    .getRepository(Person)
    .createQueryBuilder('person')
    .leftJoinAndSelect('person.pets', 'pet')
    .where('person.id = :id', { id: 1 })
    .getOneOrFail()
  assert(entity instanceof Person)
  assert.equal(entity.pets.length, 2)
  assert(entity.pets.every((pet) => pet instanceof Pet))
  const noPets = await dataSource
    .getRepository(Person)
    .createQueryBuilder('person')
    .leftJoinAndSelect('person.pets', 'pet')
    .where('person.id = :id', { id: 4 })
    .getOneOrFail()
  assert.deepEqual(noPets.pets, [])

  // SQL features acknowledged by the article, verified through TypeORM's builder.
  const cte = await dataSource
    .createQueryBuilder()
    .addCommonTableExpression('select id from person where age >= 18', 'adults')
    .select('adults.id', 'id')
    .from('adults', 'adults')
    .orderBy('adults.id')
    .getRawMany()
  assert.deepEqual(cte, [{ id: 1 }, { id: 3 }])
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
  console.log(
    'PASS: matching aggregates, relation hydration, empty relations, CTE, and locking',
  )
} finally {
  if (dataSource.isInitialized) await dataSource.destroy()
  await db.destroy()
  try {
    await admin.query(`drop schema if exists "${schema}" cascade`)
  } finally {
    await admin.end()
  }
}
