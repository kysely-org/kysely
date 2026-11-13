import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { Kysely, PostgresDialect } from 'kysely'
import {
  connectSequelize,
  DataTypes,
  Model,
  sequelizeVersion,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
} from '#sequelize-under-test'

export type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false
export function expectType<T extends true>() {}

export const isAlpha = sequelizeVersion.startsWith('7.')
export { sequelizeVersion }

export interface Database {
  person: {
    id: number
    first_name: string
    age: number | null
    pet_target: number
  }
  pet: { id: number; name: string; owner_id: number }
}

export class Person extends Model<
  InferAttributes<Person>,
  InferCreationAttributes<Person>
> {
  declare id: number
  declare first_name: string
  declare age: number | null
  declare pet_target: number
  declare pets?: NonAttribute<Pet[]>
}

export class Pet extends Model<
  InferAttributes<Pet>,
  InferCreationAttributes<Pet>
> {
  declare id: number
  declare name: string
  declare owner_id: number
  declare owner?: NonAttribute<Person>
}

export function pgCode(error: unknown): string | undefined {
  const e = error as {
    parent?: { code?: string }
    cause?: { code?: string }
    original?: { code?: string }
    code?: string
  }
  return e.parent?.code ?? e.cause?.code ?? e.original?.code ?? e.code
}

export async function connect() {
  const url = process.env.COMPARISON_DATABASE_URL
  assert(
    url,
    'Set COMPARISON_DATABASE_URL to a disposable PostgreSQL server; the user needs CREATE SCHEMA.',
  )
  const schema = `sequelize_comparison_${randomUUID().replaceAll('-', '')}`
  const admin = new Pool({ connectionString: url })
  await admin.query(`create schema "${schema}"`)
  const pool = new Pool({ connectionString: url, options: `-c search_path=${schema}` })
  const db = new Kysely<Database>({ dialect: new PostgresDialect({ pool }) })

  await db.schema
    .createTable('person')
    .addColumn('id', 'integer', (c) => c.primaryKey())
    .addColumn('first_name', 'text', (c) => c.notNull())
    .addColumn('age', 'integer')
    .addColumn('pet_target', 'integer', (c) => c.notNull().defaultTo(0))
    .execute()
  await db.schema
    .createTable('pet')
    .addColumn('id', 'integer', (c) => c.primaryKey())
    .addColumn('name', 'text', (c) => c.notNull())
    .addColumn('owner_id', 'integer', (c) => c.notNull().references('person.id'))
    .execute()
  await db
    .insertInto('person')
    .values([
      { id: 1, first_name: 'Jennifer', age: 40, pet_target: 3 },
      { id: 2, first_name: 'Arnold', age: 17, pet_target: 1 },
      { id: 3, first_name: 'Ada', age: 30, pet_target: 2 },
      { id: 4, first_name: 'Sylvester', age: 60, pet_target: 0 },
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

  const queries: string[] = []
  const sequelize = connectSequelize(url, schema, (sql) => void queries.push(sql))

  Person.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true },
      first_name: { type: DataTypes.TEXT, allowNull: false },
      age: { type: DataTypes.INTEGER, allowNull: true },
      pet_target: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, modelName: 'Person', tableName: 'person' },
  )
  Pet.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true },
      name: { type: DataTypes.TEXT, allowNull: false },
      owner_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, modelName: 'Pet', tableName: 'pet' },
  )
  Person.hasMany(Pet, { as: 'pets', foreignKey: 'owner_id' })
  Pet.belongsTo(Person, { as: 'owner', foreignKey: 'owner_id' })

  return {
    db,
    sequelize,
    queries,
    schema,
    url,
    async cleanup() {
      await sequelize.close()
      await db.destroy()
      await admin.query(`drop schema "${schema}" cascade`)
      await admin.end()
    },
  }
}
