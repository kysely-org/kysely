import 'reflect-metadata'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { Pool } from 'pg'
import { DataSource, EntitySchema, type Logger } from '#typeorm-under-test'
import { Kysely, PostgresDialect } from 'kysely'

export type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false
export type IsAny<T> = 0 extends 1 & T ? true : false
export function expectType<T extends true>() {}

export interface Profile {
  addresses: { city: string }[]
}

export interface Database {
  person: { id: number; first_name: string; age: number | null }
  pet: { id: number; name: string; owner_id: number }
  user_settings: { id: number; profile: Profile }
  folder: { id: number; parent_id: number | null }
}

export class Person {
  declare id: number
  declare first_name: string
  declare age: number | null
  declare pets: Pet[]
}

export class Pet {
  declare id: number
  declare name: string
  declare owner_id: number
  declare owner: Person
}

export class Settings {
  declare id: number
  declare profile: Profile
}

export const PersonSchema = new EntitySchema<Person>({
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

export const PetSchema = new EntitySchema<Pet>({
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

export const SettingsSchema = new EntitySchema<Settings>({
  name: 'Settings',
  target: Settings,
  tableName: 'user_settings',
  columns: {
    id: { type: Number, primary: true },
    profile: { type: 'jsonb' },
  },
})

const require = createRequire(import.meta.url)
export const typeormVersion: string = (() => {
  let path = dirname(require.resolve('#typeorm-under-test'))
  for (;;) {
    try {
      return JSON.parse(readFileSync(join(path, 'package.json'), 'utf8')).version
    } catch {
      path = dirname(path)
    }
  }
})()
export const isLegacy = typeormVersion.startsWith('0.')

export function pgCode(error: unknown): string | undefined {
  const e = error as { driverError?: { code?: string }; code?: string }
  return e.driverError?.code ?? e.code
}

export async function connect() {
  const connectionString = process.env.COMPARISON_DATABASE_URL
  assert(
    connectionString,
    'Set COMPARISON_DATABASE_URL to a disposable PostgreSQL server; the user needs CREATE SCHEMA.',
  )
  const schema = `typeorm_comparison_${randomUUID().replaceAll('-', '')}`
  const admin = new Pool({ connectionString })
  await admin.query(`create schema "${schema}"`)
  const pool = new Pool({ connectionString, options: `-c search_path=${schema}` })
  const db = new Kysely<Database>({ dialect: new PostgresDialect({ pool }) })

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
    .addColumn('owner_id', 'integer', (c) => c.notNull().references('person.id'))
    .execute()
  await db.schema
    .createTable('user_settings')
    .addColumn('id', 'integer', (c) => c.primaryKey())
    .addColumn('profile', 'jsonb', (c) => c.notNull())
    .execute()
  await db.schema
    .createTable('folder')
    .addColumn('id', 'integer', (c) => c.primaryKey())
    .addColumn('parent_id', 'integer')
    .execute()
  await db
    .insertInto('person')
    .values([
      { id: 1, first_name: 'Jennifer', age: 40 },
      { id: 2, first_name: 'Arnold', age: 17 },
      { id: 3, first_name: 'Ada', age: 30 },
      { id: 4, first_name: 'Sylvester', age: 60 },
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
  await db
    .insertInto('user_settings')
    .values([
      { id: 1, profile: JSON.stringify({ addresses: [{ city: 'Helsinki' }] }) as never },
      { id: 2, profile: JSON.stringify({ addresses: [] }) as never },
    ])
    .execute()
  await db
    .insertInto('folder')
    .values([
      { id: 1, parent_id: null },
      { id: 2, parent_id: 1 },
      { id: 3, parent_id: 2 },
      { id: 4, parent_id: null },
    ])
    .execute()

  const queries: string[] = []
  const logger: Logger = {
    logQuery: (query) => void queries.push(query),
    logQueryError: () => {},
    logQuerySlow: () => {},
    logSchemaBuild: () => {},
    logMigration: () => {},
    log: () => {},
  }
  const dataSource = new DataSource({
    type: 'postgres',
    url: connectionString,
    schema,
    entities: [PersonSchema, PetSchema, SettingsSchema],
    synchronize: false,
    logging: ['query'],
    logger,
    extra: { options: `-c search_path=${schema}` },
  })
  await dataSource.initialize()

  return {
    db,
    dataSource,
    queries,
    async cleanup() {
      if (dataSource.isInitialized) await dataSource.destroy()
      await db.destroy()
      try {
        await admin.query(`drop schema if exists "${schema}" cascade`)
      } finally {
        await admin.end()
      }
    },
  }
}
