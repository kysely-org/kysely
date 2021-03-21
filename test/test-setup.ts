import { Kysely, KyselyConfig } from '../src'
import { Dialect } from '../src/dialect/dialect'

interface Person {
  id: number
  first_name: string
  last_name: string
  gender: 'male' | 'female' | 'other'
}

interface Pet {
  id: number
  name: string
  owner_id: number
  species: 'dog' | 'cat'
}

interface Toy {
  id: string
  name: string
  price: number
  pet_id: number
}

interface Database {
  person: Person
  pet: Pet
  toy: Toy
  'toy_schema.toy': Toy
}

interface PersonInsertParams extends Omit<Person, 'id'> {
  pets?: PetInsertParams[]
}

interface PetInsertParams extends Omit<Pet, 'id' | 'owner_id'> {
  toys?: Omit<Toy, 'id' | 'pet_id'>[]
}

export interface InitTestArgs {
  insertPersons: PersonInsertParams[]
}

type BuiltInDialects = Exclude<KyselyConfig['dialect'], Dialect>
type PerDialect<T> = Record<BuiltInDialects, T>

export interface TestContext {
  dbs: PerDialect<Kysely<Database>>
}

export async function initTest(): Promise<TestContext> {
  const dbs = {
    postgres: new Kysely<Database>({
      dialect: 'postgres',
      host: 'localhost',
      database: 'kysely_test',
    }),
  }

  for (const db of Object.values(dbs)) {
    await createDatabase(db)
  }

  return {
    dbs,
  }
}

export async function destroyTest(ctx: TestContext): Promise<void> {
  for (const db of Object.values(ctx.dbs)) {
    await dropDatabase(db)
    await db.destroy()
  }
}

export async function insertPersons(
  ctx: TestContext,
  insertPersons: PersonInsertParams[]
): Promise<void> {
  for (const db of Object.values(ctx.dbs)) {
    for (const insertPerson of insertPersons) {
      const { pets, ...person } = insertPerson

      const personRes = await db
        .insertInto('person')
        .values(person)
        .returning('id')
        .executeTakeFirst()

      const personId = getIdFromInsertResult<number>(personRes)

      for (const insertPet of pets ?? []) {
        await insertPetForPerson(db, personId, insertPet)
      }
    }
  }
}

export async function clearDatabase(ctx: TestContext): Promise<void> {
  for (const db of Object.values(ctx.dbs)) {
    await db.deleteFrom('toy').execute()
    await db.deleteFrom('pet').execute()
    await db.deleteFrom('person').execute()
  }
}

async function createDatabase(db: Kysely<Database>): Promise<void> {
  await dropDatabase(db)

  await db.schema.createTable('person', (table) =>
    table
      .integer('id', (col) => col.increments().primary())
      .string('first_name')
      .string('last_name')
      .string('gender')
  )

  await db.schema.createTable('pet', (table) =>
    table
      .integer('id', (col) => col.increments().primary())
      .string('name')
      .integer('owner_id', (col) => col.references('person.id'))
      .string('species')
  )

  await db.schema.createTable('toy', (table) =>
    table
      .integer('id', (col) => col.increments().primary())
      .string('name')
      .integer('pet_id', (col) => col.references('pet.id'))
      .double('price')
  )
}

async function dropDatabase(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTableIfExists('toy')
  await db.schema.dropTableIfExists('pet')
  await db.schema.dropTableIfExists('person')
}

async function insertPetForPerson(
  db: Kysely<Database>,
  personId: number,
  insertPet: PetInsertParams
): Promise<void> {
  const { toys, ...pet } = insertPet

  const petRes = await db
    .insertInto('pet')
    .values({ ...pet, owner_id: personId })
    .returning('id')
    .executeTakeFirst()

  const petId = getIdFromInsertResult<number>(petRes)

  for (const toy of toys ?? []) {
    await insertToysForPet(db, petId, toy)
  }
}

async function insertToysForPet(
  db: Kysely<Database>,
  petId: number,
  toy: Omit<Toy, 'id' | 'pet_id'>
): Promise<void> {
  await db
    .insertInto('toy')
    .values({ ...toy, pet_id: petId })
    .executeTakeFirst()
}

function getIdFromInsertResult<T>(result: any): T {
  if (typeof result === 'object') {
    return result.id
  } else {
    return result
  }
}
