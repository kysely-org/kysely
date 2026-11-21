import assert from 'node:assert/strict'
import { connect, isAlpha, Person, Pet } from './_setup.mts'
import { Transaction } from '#sequelize-under-test'

const { db, sequelize, queries, cleanup } = await connect()

// Statements and clauses Kysely builds, run against PostgreSQL.
const union = await db
  .selectFrom('person').select('first_name as name').where('id', '=', 1)
  .union(db.selectFrom('pet').select('name').where('id', '=', 1))
  .orderBy('name')
  .execute()
assert.deepEqual(union, [{ name: 'Catto' }, { name: 'Jennifer' }])

const withCte = await db
  .with('adults', (qb) => qb.selectFrom('person').select(['id', 'first_name']).where('age', '>=', 18))
  .selectFrom('adults').select('first_name').orderBy('id')
  .execute()
assert.deepEqual(withCte.map((r) => r.first_name), ['Jennifer', 'Ada', 'Sylvester'])

const windowed = await db
  .selectFrom('pet')
  .select((eb) => ['name', eb.fn.agg<string>('row_number').over((ob) => ob.partitionBy('owner_id').orderBy('name')).as('n')])
  .where('owner_id', '=', 1).orderBy('name')
  .execute()
assert.deepEqual(windowed, [{ name: 'Catto', n: '1' }, { name: 'Doggo', n: '2' }])

const filtered = await db
  .selectFrom('pet')
  .select((eb) => eb.fn.countAll().filterWhere('owner_id', '=', 1).as('jennifers'))
  .executeTakeFirstOrThrow()
assert.equal(filtered.jennifers, '2')

const lateral = await db
  .selectFrom('person')
  .innerJoinLateral(
    (eb) => eb.selectFrom('pet').select('name').whereRef('pet.owner_id', '=', 'person.id').orderBy('name').limit(1).as('first_pet'),
    (join) => join.onTrue(),
  )
  .select(['person.first_name', 'first_pet.name']).orderBy('person.id')
  .execute()
assert.equal(lateral.length, 3)

const distinctOn = await db.selectFrom('pet').distinctOn('owner_id').select(['owner_id', 'name']).orderBy('owner_id').orderBy('name').execute()
assert.equal(distinctOn.length, 3)

const subquerySelect = await db
  .selectFrom('person')
  .select((eb) => ['first_name', eb.selectFrom('pet').select((e) => e.fn.countAll<string>().as('c')).whereRef('pet.owner_id', '=', 'person.id').as('pets')])
  .where('id', '=', 1)
  .executeTakeFirstOrThrow()
assert.equal(subquerySelect.pets, '2')

await db.transaction().execute(async (trx) => {
  await trx
    .mergeInto('pet as target')
    .using('person', 'person.id', 'target.owner_id')
    .whenMatchedAnd('person.first_name', '=', 'Arnold')
    .thenDelete()
    .execute()
  await trx.deleteFrom('pet').using('person').whereRef('pet.owner_id', '=', 'person.id').where('person.first_name', '=', 'Ada').execute()
  assert.equal((await trx.selectFrom('pet').select('id').execute()).length, 2)
  throw new Error('rollback')
}).catch((e: Error) => assert.equal(e.message, 'rollback'))

// What Sequelize's finders and model methods do cover: upsert with RETURNING, SKIP LOCKED.
queries.length = 0
const [upserted] = await Person.upsert({ id: 1, first_name: 'Jen', age: 40, pet_target: 3 }, { returning: true })
assert.equal(upserted.first_name, 'Jen')
assert.match(queries.join('\n'), /ON CONFLICT \("id"\) DO UPDATE/)
await sequelize.transaction(async (transaction) => {
  queries.length = 0
  await Pet.findAll({ where: { owner_id: 1 }, lock: Transaction.LOCK.UPDATE, skipLocked: true, transaction })
  assert.match(queries.join('\n'), /FOR UPDATE SKIP LOCKED/)
})

// Nested callback transactions can use savepoints.
await sequelize.transaction(async (outer) => {
  queries.length = 0
  const options = isAlpha ? { nestMode: 'savepoint' } : { transaction: outer }
  await (sequelize.transaction as (o: object, cb: () => Promise<void>) => Promise<void>)(options, async () => {})
  assert.match(queries.join('\n'), /SAVEPOINT/)
})

// 7.0.0-alpha.48 joins a query to the surrounding callback transaction without passing it.
await sequelize
  .transaction(async () => {
    await Pet.create({ id: 10, name: 'Hamster', owner_id: 4 })
    throw new Error('rollback')
  })
  .catch((e: Error) => assert.equal(e.message, 'rollback'))
assert.equal(await Pet.count({ where: { id: 10 } }), isAlpha ? 0 : 1)
await cleanup()
console.log('PASS coverage.mts')
