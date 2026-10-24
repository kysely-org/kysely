import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { Model, DataTypes, QueryTypes, sql } from '@sequelize/core'
import type { InferAttributes, InferCreationAttributes } from '@sequelize/core'
import { connectSequelize } from './sequelize7.mts'

const connectionString = process.env.COMPARISON_DATABASE_URL
assert(
  connectionString,
  'Set COMPARISON_DATABASE_URL to a disposable PostgreSQL database',
)
const schema = `sequelize7_sql_${randomUUID().replaceAll('-', '')}`
const admin = new Pool({ connectionString })
const sequelize = connectSequelize(connectionString, schema)

class Person extends Model<
  InferAttributes<Person>,
  InferCreationAttributes<Person>
> {
  declare id: number
  declare first_name: string
}

Person.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    first_name: { type: DataTypes.TEXT, allowNull: false },
  },
  { sequelize, modelName: 'Person', tableName: 'person', timestamps: false },
)

// DOC:v7-tag
function sequelize7Names(prefix: string) {
  return sequelize.query<{ id: number; name: string }>(
    sql`
    select id, first_name as name
    from person
    where first_name like ${prefix + '%'}
    order by id
  `,
    { type: QueryTypes.SELECT },
  )
}
// END:v7-tag

try {
  await admin.query(`create schema "${schema}"`)
  await admin.query(
    `create table "${schema}".person (id integer primary key, first_name text not null)`,
  )
  await admin.query(`insert into "${schema}".person values (1, $1), (2, $2)`, [
    'Jennifer',
    'Ada',
  ])
  assert.deepEqual(await sequelize7Names('Jen'), [{ id: 1, name: 'Jennifer' }])
  assert.deepEqual(await sequelize7Names(''), [
    { id: 1, name: 'Jennifer' },
    { id: 2, name: 'Ada' },
  ])
  assert.deepEqual(await sequelize7Names("Jennifer' OR TRUE --"), [])

  const staleRaw = await sequelize.query<{ first_name: string }>(
    sql`
    select first_name as name from person order by id
  `,
    { type: QueryTypes.SELECT },
  )
  assert.equal(staleRaw[0]?.first_name, undefined)

  const modelRows = await Person.findAll<Person, { name: string }>({
    attributes: [[sql.attribute('first_name'), 'name']],
    order: [['id', 'ASC']],
    raw: true,
  })
  assert.deepEqual(modelRows, [{ name: 'Jennifer' }, { name: 'Ada' }])
  const staleModelRows = await Person.findAll<Person, { first_name: string }>({
    attributes: [[sql.attribute('first_name'), 'name']],
    raw: true,
  })
  assert.equal(staleModelRows[0]?.first_name, undefined)
  console.log(
    'PASS: Sequelize 7 SQL tag, interpolation, sql.attribute, explicit raw model result types, and stale annotations',
  )
} finally {
  await sequelize.close()
  try {
    await admin.query(`drop schema if exists "${schema}" cascade`)
  } finally {
    await admin.end()
  }
}
