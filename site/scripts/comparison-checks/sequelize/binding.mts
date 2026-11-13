import assert from 'node:assert/strict'
import pg from 'pg'
import { connect, isAlpha, Person, Pet } from './_setup.mts'

const sent: { text: string; values?: unknown[] }[] = []
const query = pg.Client.prototype.query
pg.Client.prototype.query = function (this: pg.Client, ...args: unknown[]) {
  const [first, second] = args as [string | pg.QueryConfig, unknown]
  if (typeof first === 'string')
    sent.push({ text: first, values: Array.isArray(second) ? second : undefined })
  else sent.push({ text: first.text, values: first.values })
  return (query as (...a: unknown[]) => unknown).apply(this, args)
} as typeof query

const { db, url, schema, cleanup } = await connect()

// Finders write values into the statement as escaped literals.
sent.length = 0
await Person.findAll({ where: { first_name: 'Jennifer' }, raw: true })
await Person.destroy({ where: { id: 999 } })
await Person.update({ age: 41 }, { where: { id: 1 } })
const [find, destroy, update] = sent.slice(-3)
assert.match(find.text, /WHERE "Person"\."first_name" = 'Jennifer';$/)
assert.equal(find.values, undefined)
assert.match(destroy.text, /WHERE "id" = 999$/)
assert.equal(update.text, 'UPDATE "person" SET "age"=$1 WHERE "id" = $2')
assert.deepEqual(update.values, [41, 1])

// Kysely sends every value as a parameter.
sent.length = 0
await db.selectFrom('person').select('id').where('first_name', '=', 'Jennifer').execute()
assert.deepEqual(sent, [{ text: 'select "id" from "person" where "first_name" = $1', values: ['Jennifer'] }])

// A failed finder query carries its statement, values included, as an enumerable property.
const secret = 'token-3f9c'
const failed = await Person.findAll({ attributes: ['first_nam' as 'first_name'], where: { first_name: secret } }).catch((e: unknown) => e)
const keys = Object.keys(failed as object)
assert.ok(keys.includes('sql'))
assert.ok(JSON.stringify(failed).includes(secret))

// A failed insert binds its values, and the validation error items still carry them.
const duplicate = await Person.create({ id: 1, first_name: secret, age: null, pet_target: 0 }).catch((e: unknown) => e)
assert.ok(JSON.stringify(duplicate).includes(secret))

// Kysely passes the driver's error through: no statement, no values.
const kyselyFailed = await db
  .selectFrom('person')
  .select('id')
  .where('first_name', '=', secret)
  .where('age', '=', 'old' as never)
  .execute()
  .catch((e: unknown) => e)
assert.ok(kyselyFailed instanceof pg.DatabaseError)
assert.ok(!JSON.stringify(kyselyFailed).includes(secret))

// The default logger: 6.37.8 prints every statement with console.log, values included.
const logged: unknown[][] = []
const { log, debug } = console
console.log = (...args) => void logged.push(args)
console.debug = (...args) => void logged.push(args)
try {
  const plain: { query(sql: string): Promise<unknown>; close(): Promise<void> } = isAlpha
    ? new (await import('@sequelize/core')).Sequelize({
        dialect: (await import('@sequelize/postgres')).PostgresDialect,
        url,
        options: `-c search_path=${schema}`,
      })
    : new (await import('sequelize')).Sequelize(url, {
        dialect: 'postgres',
        dialectOptions: { options: `-c search_path=${schema}` },
      })
  await plain.query(`select id from person where first_name = 'Jennifer'`)
  await plain.close()
} finally {
  console.log = log
  console.debug = debug
}
if (isAlpha) assert.deepEqual(logged, [])
else assert.deepEqual(logged, [[`Executing (default): select id from person where first_name = 'Jennifer'`]])

// No finder takes an AbortSignal.
const controller = new AbortController()
// @ts-expect-error signal is not a find option.
void (() => Pet.findAll({ signal: controller.signal }))
// Kysely: abort before the statement is sent.
controller.abort()
await assert.rejects(db.selectFrom('pet').selectAll().execute({ signal: controller.signal }))

pg.Client.prototype.query = query
await cleanup()
console.log('PASS binding.mts')
