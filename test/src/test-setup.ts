import * as chai from 'chai'
import * as chaiSubset from 'chai-subset'
chai.use(chaiSubset)

import {
  Kysely,
  KyselyConfig,
  KyselyPlugin,
  Compilable,
  RootOperationNode,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  QueryResult,
  AnyRow,
  OperationNodeTransformer,
  PostgresDialect,
  MysqlDialect,
  Dialect,
} from '../../'

export interface Person {
  id: number
  first_name: string | null
  last_name: string | null
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

export interface TestContext {
  config: KyselyConfig
  db: Kysely<Database>
}

export type DialectWrapper = (dialect: Dialect) => Dialect
export type BuiltInDialect = 'postgres' | 'mysql'
export type PerDialect<T> = Record<BuiltInDialect, T>

export const BUILT_IN_DIALECTS: BuiltInDialect[] = ['postgres', 'mysql']
export const TEST_INIT_TIMEOUT = 5 * 60 * 1000
// This can be used as a placeholder for testSql when a query is not
// supported on some dialect.
export const NOT_SUPPORTED = { sql: '', bindings: [] }

const PLUGINS: KyselyPlugin[] = []

if (process.env.TEST_TRANSFORMER) {
  console.log('running tests with a transformer')
  PLUGINS.push(createNoopPlugin())
}

const DB_CONFIGS: PerDialect<KyselyConfig> = {
  postgres: {
    dialect: new PostgresDialect({
      database: 'kysely_test',
      host: 'localhost',
      user: 'kysely',
      port: 5434,
    }),
    plugins: PLUGINS,
  },
  mysql: {
    dialect: new MysqlDialect({
      database: 'kysely_test',
      host: 'localhost',
      user: 'kysely',
      password: 'kysely',
      port: 3308,
      // Return big numbers as strings just like pg does.
      supportBigNumbers: true,
      bigNumberStrings: true,
    }),
    plugins: PLUGINS,
  },
}

export async function initTest(
  dialect: BuiltInDialect,
  wrapDialect: DialectWrapper = (it) => it
): Promise<TestContext> {
  const config = DB_CONFIGS[dialect]

  const db = await connect({
    ...config,
    dialect: wrapDialect(config.dialect),
  })

  await createDatabase(db)
  return { config, db }
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
      .values({ ...person, id: ctx.db.generated })
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
  query: Compilable,
  dialect: BuiltInDialect,
  expectedPerDialect: PerDialect<{ sql: string | string[]; bindings: any[] }>
): void {
  const expected = expectedPerDialect[dialect]
  const expectedSql = Array.isArray(expected.sql)
    ? expected.sql.map((it) => it.trim()).join(' ')
    : expected.sql
  const sql = query.compile()

  chai.expect(expectedSql).to.equal(sql.sql)
  chai.expect(expected.bindings).to.eql(sql.bindings)
}

async function createDatabase(db: Kysely<Database>): Promise<void> {
  await dropDatabase(db)

  await db.schema
    .createTable('person')
    .addColumn('id', 'integer', (col) => col.increments().primaryKey())
    .addColumn('first_name', 'varchar(255)')
    .addColumn('last_name', 'varchar(255)')
    .addColumn('gender', 'varchar(50)', (col) => col.notNull())
    .execute()

  await db.schema
    .createTable('pet')
    .addColumn('id', 'integer', (col) => col.increments().primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.unique().notNull())
    .addColumn('owner_id', 'integer', (col) =>
      col.references('person.id').onDelete('cascade').notNull()
    )
    .addColumn('species', 'varchar(50)', (col) => col.notNull())
    .execute()

  await db.schema
    .createTable('toy')
    .addColumn('id', 'integer', (col) => col.increments().primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('pet_id', 'integer', (col) => col.references('pet.id').notNull())
    .addColumn('price', 'double precision', (col) => col.notNull())
    .execute()

  await db.schema
    .createIndex('pet_owner_id_index')
    .on('pet')
    .column('owner_id')
    .execute()
}

async function connect(config: KyselyConfig): Promise<Kysely<Database>> {
  for (let i = 0; i < TEST_INIT_TIMEOUT; i += 1000) {
    let db: Kysely<Database> | undefined

    try {
      db = new Kysely<Database>(config)
      await db.raw('select 1').execute()
      return db
    } catch (error) {
      if (db) {
        await db.destroy().catch((error) => error)
      }

      console.log('waiting for database to become available')
      await sleep(1000)
    }
  }

  throw new Error('could not connect to database')
}

async function dropDatabase(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('toy').ifExists().execute()
  await db.schema.dropTable('pet').ifExists().execute()
  await db.schema.dropTable('person').ifExists().execute()
}

export const expect = chai.expect

async function insertPetForPerson(
  db: Kysely<Database>,
  personId: number,
  insertPet: PetInsertParams
): Promise<void> {
  const { toys, ...pet } = insertPet

  const petRes = await db
    .insertInto('pet')
    .values({ ...pet, owner_id: personId, id: db.generated })
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
    .values({ ...toy, pet_id: petId, id: db.generated })
    .executeTakeFirst()
}

function getIdFromInsertResult<T>(result: any): T {
  if (typeof result === 'object') {
    return result.id
  } else {
    return result
  }
}

function createNoopPlugin(): KyselyPlugin {
  const transformer = new OperationNodeTransformer()

  return {
    transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
      return transformer.transformNode(args.node)
    },

    async transformResult(
      args: PluginTransformResultArgs
    ): Promise<QueryResult<AnyRow>> {
      return args.result
    },
  }
}

function sleep(millis: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, millis))
}
