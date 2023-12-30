import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import * as chaiSubset from 'chai-subset'
import * as Cursor from 'pg-cursor'
import { Pool, PoolConfig } from 'pg'
import { createPool } from 'mysql2'
import * as Database from 'better-sqlite3'
import * as Tarn from 'tarn'
import * as Tedious from 'tedious'
import { PoolOptions } from 'mysql2'

chai.use(chaiSubset)
chai.use(chaiAsPromised)

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
  sql,
  ColumnType,
  InsertObject,
  MssqlDialect,
  SelectQueryBuilder,
} from '../../../'
import { OrderByDirection, UndirectedOrderByExpression } from '../../../dist/cjs/parser/order-by-parser'

export type Gender = 'male' | 'female' | 'other'
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed'
export type Species = 'dog' | 'cat' | 'hamster'

export interface Person {
  id: Generated<number>
  first_name: string | null
  middle_name: ColumnType<string | null, string | undefined, string | undefined>
  last_name: string | null
  gender: Gender
  marital_status: MaritalStatus | null
  children: Generated<number>
}

export interface Pet {
  id: Generated<number>
  name: string
  owner_id: number
  species: Species
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

interface PersonInsertParams extends InsertObject<Database, 'person'> {
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

export type BuiltInDialect = 'postgres' | 'mysql' | 'mssql' | 'sqlite'
export type PerDialect<T> = Record<BuiltInDialect, T>

export const DIALECTS: BuiltInDialect[] = (
  ['postgres', 'mysql', 'mssql', 'sqlite'] as const
).filter((d) => !process.env.DIALECT || d === process.env.DIALECT)

const TEST_INIT_TIMEOUT = 5 * 60 * 1000
// This can be used as a placeholder for testSql when a query is not
// supported on some dialect.
export const NOT_SUPPORTED = { sql: '', parameters: [] }

export const PLUGINS: KyselyPlugin[] = []

if (process.env.TEST_TRANSFORMER) {
  console.log('running tests with a transformer')
  // Add a noop transformer using a plugin to make sure that the
  // OperationNodeTransformer base class is implemented correctly
  // and all nodes and properties get cloned by default.
  PLUGINS.push(createNoopTransformerPlugin())
}

export const POOL_SIZE = 20

export const DIALECT_CONFIGS = {
  postgres: {
    database: 'kysely_test',
    host: 'localhost',
    user: 'kysely',
    port: 5434,
    max: POOL_SIZE,
  } satisfies PoolConfig,

  mysql: {
    database: 'kysely_test',
    host: 'localhost',
    user: 'kysely',
    password: 'kysely',
    port: 3308,
    // Return big numbers as strings just like pg does.
    supportBigNumbers: true,
    bigNumberStrings: true,

    connectionLimit: POOL_SIZE,
  } satisfies PoolOptions,

  mssql: {
    authentication: {
      options: {
        password: 'KyselyTest0',
        userName: 'sa',
      },
      type: 'default',
    },
    options: {
      connectTimeout: 3000,
      database: 'kysely_test',
      port: 21433,
      trustServerCertificate: true,
    },
    server: 'localhost',
  } satisfies Tedious.ConnectionConfig,

  sqlite: {
    databasePath: ':memory:',
  },
}

export const DB_CONFIGS: PerDialect<KyselyConfig> = {
  postgres: {
    dialect: new PostgresDialect({
      pool: async () => new Pool(DIALECT_CONFIGS.postgres),
      cursor: Cursor,
    }),
    plugins: PLUGINS,
  },

  mysql: {
    dialect: new MysqlDialect({
      pool: async () => createPool(DIALECT_CONFIGS.mysql),
    }),
    plugins: PLUGINS,
  },

  mssql: {
    dialect: new MssqlDialect({
      tarn: {
        options: {
          max: POOL_SIZE,
          min: 0,
        },
        ...Tarn,
      },
      tedious: {
        ...Tedious,
        connectionFactory: () => new Tedious.Connection(DIALECT_CONFIGS.mssql),
      },
    }),
    plugins: PLUGINS,
  },

  sqlite: {
    dialect: new SqliteDialect({
      database: async () => new Database(DIALECT_CONFIGS.sqlite.databasePath),
    }),
    plugins: PLUGINS,
  },
}

export async function initTest(
  ctx: Mocha.Context,
  dialect: BuiltInDialect,
  log?: Logger
): Promise<TestContext> {
  const config = DB_CONFIGS[dialect]

  ctx.timeout(TEST_INIT_TIMEOUT)
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
      ctx,
      ctx.db.insertInto('person').values({ ...person })
    )

    for (const insertPet of pets ?? []) {
      await insertPetForPerson(ctx, personId, insertPet)
    }
  }
}

export const DEFAULT_DATA_SET: PersonInsertParams[] = [
  {
    first_name: 'Jennifer',
    last_name: 'Aniston',
    gender: 'female',
    pets: [{ name: 'Catto', species: 'cat' }],
    marital_status: 'divorced',
  },
  {
    first_name: 'Arnold',
    last_name: 'Schwarzenegger',
    gender: 'male',
    pets: [{ name: 'Doggo', species: 'dog' }],
    marital_status: 'divorced',
  },
  {
    first_name: 'Sylvester',
    last_name: 'Stallone',
    gender: 'male',
    pets: [{ name: 'Hammo', species: 'hamster' }],
    marital_status: 'married',
  },
]

export async function insertDefaultDataSet(ctx: TestContext): Promise<void> {
  await insertPersons(ctx, DEFAULT_DATA_SET)
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
    .addColumn('middle_name', 'varchar(255)')
    .addColumn('last_name', 'varchar(255)')
    .addColumn('gender', 'varchar(50)', (col) => col.notNull())
    .addColumn('marital_status', 'varchar(50)')
    .addColumn('children', 'integer', (col) => col.notNull().defaultTo(0))
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
  }

  if (dialect === 'mssql') {
    return builder.addColumn('id', 'integer', (col) =>
      col
        .notNull()
        // TODO: change to method when its implemented
        .modifyFront(sql`identity(1,1)`)
        .primaryKey()
    )
  }

  return builder.addColumn('id', 'integer', (col) =>
    col.autoIncrement().primaryKey()
  )
}

async function connect(config: KyselyConfig): Promise<Kysely<Database>> {
  for (let i = 0; i < TEST_INIT_TIMEOUT; i += 1000) {
    let db: Kysely<Database> | undefined

    try {
      db = new Kysely<Database>(config)
      await sql`select 1`.execute(db)
      return db
    } catch (error) {
      console.error(error)

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
    ctx,
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

export async function insert<TB extends keyof Database>(
  ctx: TestContext,
  qb: InsertQueryBuilder<Database, TB, InsertResult>
): Promise<number> {
  const { dialect } = ctx

  if (dialect === 'postgres' || dialect === 'sqlite') {
    const { id } = await qb.returning('id').executeTakeFirstOrThrow()

    return id
  }

  if (dialect === 'mssql') {
    // TODO: use insert into "table" (...) output inserted.id values (...) when its implemented
    return await ctx.db.connection().execute(async (db) => {
      await qb.executeTakeFirstOrThrow()

      const { query } = qb.compile()

      const table =
        query.kind === 'InsertQueryNode' &&
        [query.into.table.schema?.name, query.into.table.identifier.name]
          .filter(Boolean)
          .join('.')

      const {
        rows: [{ id }],
      } = await sql<{ id: number }>`select IDENT_CURRENT(${sql.lit(
        table
      )}) as id`.execute(db)

      return Number(id)
    })
  }

  const { insertId } = await qb.executeTakeFirstOrThrow()

  return Number(insertId)
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

export function limit<QB extends SelectQueryBuilder<any, any, any>>(
  limit: number,
  dialect: BuiltInDialect
): (qb: QB) => QB {
  return (qb) => {
    if (dialect === 'mssql') {
      return qb.modifyFront(sql`top ${sql.lit(limit)}`) as QB
    }

    return qb.limit(limit) as QB
  }
}

export function orderBy<QB extends SelectQueryBuilder<any, any, any>>(
  orderBy: QB extends SelectQueryBuilder<infer DB, infer TB, infer O>
    ? UndirectedOrderByExpression<DB, TB, O>
    : never,
  direction: OrderByDirection | undefined,
  dialect: BuiltInDialect
): (qb: QB) => QB {
  return (qb) => {
    if (dialect === 'mssql') {
      return qb.orderBy(orderBy, sql`${sql.raw(direction ? `${direction} ` : '')}${sql.raw('offset 0 rows')}`) as QB
    }

    return qb.orderBy(orderBy, direction) as QB
  }
}