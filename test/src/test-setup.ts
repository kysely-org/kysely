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
  UnknownRow,
  OperationNodeTransformer,
  PostgresDialect,
  MysqlDialect,
  SchemaModule,
  InsertResult,
  SqliteDialect,
  InsertQueryBuilder,
  Logger,
  Generated,
} from '../../'

export interface Person {
  id: Generated<number>
  first_name: string | null
  last_name: string | null
  gender: 'male' | 'female' | 'other'
}

export interface Pet {
  id: Generated<number>
  name: string
  owner_id: number
  species: 'dog' | 'cat' | 'hamster'
}

export interface Toy {
  id: Generated<number>
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
  dialect: BuiltInDialect
  config: KyselyConfig
  db: Kysely<Database>
}

export type BuiltInDialect = 'postgres' | 'mysql' | 'sqlite'
export type PerDialect<T> = Record<BuiltInDialect, T>

export const BUILT_IN_DIALECTS: BuiltInDialect[] = [
  'postgres',
  'mysql',
  'sqlite',
]

export const TEST_INIT_TIMEOUT = 5 * 60 * 1000
// This can be used as a placeholder for testSql when a query is not
// supported on some dialect.
export const NOT_SUPPORTED = { sql: '', parameters: [] }

const PLUGINS: KyselyPlugin[] = []

if (process.env.TEST_TRANSFORMER) {
  console.log('running tests with a transformer')
  // Add a noop transformer using a plugin to make sure that the
  // OperationNodeTransformer base class is implemented correctly
  // and all nodes and properties get cloned by default.
  PLUGINS.push(createNoopTransformerPlugin())
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
  sqlite: {
    dialect: new SqliteDialect({
      databasePath: ':memory:',
    }),
    plugins: PLUGINS,
  },
}

export async function initTest(
  dialect: BuiltInDialect,
  log?: Logger
): Promise<TestContext> {
  const config = DB_CONFIGS[dialect]

  const db = await connect({
    ...config,
    log,
  })

  await createDatabase(db, dialect)
  return { config, db, dialect }
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

    const personId = await insert(
      ctx.dialect,
      ctx.db.insertInto('person').values({ ...person })
    )

    for (const insertPet of pets ?? []) {
      await insertPetForPerson(ctx, personId, insertPet)
    }
  }
}

export async function insertDefaultDataSet(ctx: TestContext): Promise<void> {
  await insertPersons(ctx, [
    {
      first_name: 'Jennifer',
      last_name: 'Aniston',
      gender: 'female',
      pets: [{ name: 'Catto', species: 'cat' }],
    },
    {
      first_name: 'Arnold',
      last_name: 'Schwarzenegger',
      gender: 'male',
      pets: [{ name: 'Doggo', species: 'dog' }],
    },
    {
      first_name: 'Sylvester',
      last_name: 'Stallone',
      gender: 'male',
      pets: [{ name: 'Hammo', species: 'hamster' }],
    },
  ])
}

export async function clearDatabase(ctx: TestContext): Promise<void> {
  await ctx.db.deleteFrom('toy').execute()
  await ctx.db.deleteFrom('pet').execute()
  await ctx.db.deleteFrom('person').execute()
}

export function testSql(
  query: Compilable,
  dialect: BuiltInDialect,
  expectedPerDialect: PerDialect<{ sql: string | string[]; parameters: any[] }>
): void {
  const expected = expectedPerDialect[dialect]
  const expectedSql = Array.isArray(expected.sql)
    ? expected.sql.map((it) => it.trim()).join(' ')
    : expected.sql
  const sql = query.compile()

  chai.expect(expectedSql).to.equal(sql.sql)
  chai.expect(expected.parameters).to.eql(sql.parameters)
}

async function createDatabase(
  db: Kysely<Database>,
  dialect: BuiltInDialect
): Promise<void> {
  await dropDatabase(db)

  await createTableWithId(db.schema, dialect, 'person')
    .addColumn('first_name', 'varchar(255)')
    .addColumn('last_name', 'varchar(255)')
    .addColumn('gender', 'varchar(50)', (col) => col.notNull())
    .execute()

  await createTableWithId(db.schema, dialect, 'pet')
    .addColumn('name', 'varchar(255)', (col) => col.unique().notNull())
    .addColumn('owner_id', 'integer', (col) =>
      col.references('person.id').onDelete('cascade').notNull()
    )
    .addColumn('species', 'varchar(50)', (col) => col.notNull())
    .execute()

  await createTableWithId(db.schema, dialect, 'toy')
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

export function createTableWithId(
  schema: SchemaModule,
  dialect: BuiltInDialect,
  tableName: string
) {
  const builder = schema.createTable(tableName)

  if (dialect === 'postgres') {
    return builder.addColumn('id', 'serial', (col) => col.primaryKey())
  } else {
    return builder.addColumn('id', 'integer', (col) =>
      col.autoIncrement().primaryKey()
    )
  }
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

      console.log(
        'Waiting for the database to become available. Did you remember to run `docker-compose up`?'
      )

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
  ctx: TestContext,
  personId: number,
  insertPet: PetInsertParams
): Promise<void> {
  const { toys, ...pet } = insertPet

  const petId = await insert(
    ctx.dialect,
    ctx.db.insertInto('pet').values({ ...pet, owner_id: personId })
  )

  for (const toy of toys ?? []) {
    await insertToysForPet(ctx, petId, toy)
  }
}

async function insertToysForPet(
  ctx: TestContext,
  petId: number,
  toy: Omit<Toy, 'id' | 'pet_id'>
): Promise<void> {
  await ctx.db
    .insertInto('toy')
    .values({ ...toy, pet_id: petId })
    .executeTakeFirst()
}

async function insert<TB extends keyof Database>(
  dialect: BuiltInDialect,
  qb: InsertQueryBuilder<Database, TB, InsertResult>
): Promise<number> {
  if (dialect === 'postgres') {
    const { id } = await qb.returning('id').executeTakeFirstOrThrow()
    return id
  } else {
    const { insertId } = await qb.executeTakeFirst()
    return Number(insertId)
  }
}

function createNoopTransformerPlugin(): KyselyPlugin {
  const transformer = new OperationNodeTransformer()

  return {
    transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
      return transformer.transformNode(args.node)
    },

    async transformResult(
      args: PluginTransformResultArgs
    ): Promise<QueryResult<UnknownRow>> {
      return args.result
    },
  }
}

function sleep(millis: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, millis))
}
