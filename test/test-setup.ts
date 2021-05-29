import * as chai from 'chai'
import * as chaiSubset from 'chai-subset'
chai.use(chaiSubset)

import { CompiledQuery, Kysely, KyselyConfig, QueryBuilder } from '../src'
import { Dialect } from '../src/dialect/dialect'

export interface Person {
  id: number
  first_name: string
  last_name: string
  gender: 'male' | 'female' | 'other'
}

export interface Pet {
  id: number
  name: string
  owner_id: number
  species: 'dog' | 'cat' | 'hamster'
}

export interface Toy {
  id: string
  name: string
  price: number
  pet_id: number
}

export interface Database {
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

type BuiltInDialect = Exclude<KyselyConfig['dialect'], Dialect>
type PerDialect<T> = Record<BuiltInDialect, T>

const DB_CONFIGS: PerDialect<KyselyConfig> = {
  postgres: {
    dialect: 'postgres',
    database: 'kysely_test',
    host: process.env.POSTGRES_HOST ?? 'localhost',
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  },
}

export const BUILT_IN_DIALECTS: BuiltInDialect[] = ['postgres']

export interface TestContext {
  db: Kysely<Database>
}

export async function initTest(dialect: BuiltInDialect): Promise<TestContext> {
  const db = new Kysely<Database>(DB_CONFIGS[dialect])
  await createDatabase(db)
  return { db }
}

export async function destroyTest(ctx: TestContext): Promise<void> {
  await dropDatabase(ctx.db)
  await ctx.db.destroy()
}

export async function insertPersons(
  ctx: TestContext,
  insertPersons: PersonInsertParams[]
): Promise<void> {
  for (const insertPerson of insertPersons) {
    const { pets, ...person } = insertPerson

    const personRes = await ctx.db
      .insertInto('person')
      .values(person)
      .returning('id')
      .executeTakeFirst()

    const personId = getIdFromInsertResult<number>(personRes)

    for (const insertPet of pets ?? []) {
      await insertPetForPerson(ctx.db, personId, insertPet)
    }
  }
}

export async function clearDatabase(ctx: TestContext): Promise<void> {
  await ctx.db.deleteFrom('toy').execute()
  await ctx.db.deleteFrom('pet').execute()
  await ctx.db.deleteFrom('person').execute()
}

export function testSql(
  query: QueryBuilder<Database, any, any>,
  dialect: BuiltInDialect,
  expectedSql: PerDialect<CompiledQuery>
): void {
  const expected = expectedSql[dialect]
  const sql = query.compile()

  chai.expect(expected.sql).to.equal(sql.sql)
  chai.expect(expected.bindings).to.eql(sql.bindings)
}

export const expect = chai.expect

async function createDatabase(db: Kysely<Database>): Promise<void> {
  await dropDatabase(db)

  await db.schema
    .createTable('person')
    .integer('id', (col) => col.increments().primary())
    .string('first_name')
    .string('last_name')
    .string('gender')
    .execute()

  await db.schema
    .createTable('pet')
    .integer('id', (col) => col.increments().primary())
    .string('name')
    .integer('owner_id', (col) =>
      col.references('person.id').onDelete('cascade')
    )
    .string('species')
    .execute()

  await db.schema
    .createTable('toy')
    .integer('id', (col) => col.increments().primary())
    .string('name')
    .integer('pet_id', (col) => col.references('pet.id'))
    .double('price')
    .execute()
}

async function dropDatabase(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTableIfExists('toy').execute()
  await db.schema.dropTableIfExists('pet').execute()
  await db.schema.dropTableIfExists('person').execute()
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
