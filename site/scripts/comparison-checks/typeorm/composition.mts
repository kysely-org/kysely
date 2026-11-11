import assert from 'node:assert/strict'
import {
  EntityManager,
  SelectQueryBuilder,
  type QueryRunner,
} from '#typeorm-under-test'
import { Kysely, Transaction } from 'kysely'
import {
  connect,
  expectType,
  isLegacy,
  Person,
  Pet,
  typeormVersion,
  type Database,
  type Equal,
} from './_setup.mts'

const { db, dataSource, queries, cleanup } = await connect()

// A shared builder is mutated by every call.
const typeormBase = dataSource
  .getRepository(Person)
  .createQueryBuilder('person')
  .select('person.id', 'id')
  .where('person.age >= :minAge', { minAge: 18 })
const typeormPreview = typeormBase.limit(1)
assert.equal(typeormPreview, typeormBase)
assert.equal((await typeormBase.getRawMany()).length, 1)
const typeormFresh = dataSource
  .getRepository(Person)
  .createQueryBuilder('person')
  .select('person.id', 'id')
  .where('person.age >= :minAge', { minAge: 18 })
const clonedPreview = typeormFresh.clone().limit(1)
assert.notEqual(clonedPreview, typeormFresh)
assert.equal((await clonedPreview.getRawMany()).length, 1)
assert.equal((await typeormFresh.getRawMany()).length, 3)
const kyselyBase = db.selectFrom('person').select('id').where('age', '>=', 18)
const kyselyPreview = kyselyBase.limit(1)
assert.notEqual(kyselyPreview, kyselyBase)
assert.equal((await kyselyPreview.execute()).length, 1)
assert.equal((await kyselyBase.execute()).length, 3)

// A second where() replaces the first, as the docs say.
const ownedPets = dataSource
  .getRepository(Pet)
  .createQueryBuilder('pet')
  .select('pet.name', 'name')
  .where('pet.owner_id = :ownerId', { ownerId: 1 })
const named = ownedPets.where('pet.name = :name', { name: 'Kitty' })
assert.match(named.getSql(), /WHERE "pet"\."name" = \$1$/)
assert.deepEqual(await named.getRawMany(), [{ name: 'Kitty' }])
const kyselyOwned = db
  .selectFrom('pet')
  .select('name')
  .where('owner_id', '=', 1)
const kyselyNamed = kyselyOwned.where('name', '=', 'Kitty')
assert.equal(
  kyselyNamed.compile().sql,
  'select "name" from "pet" where "owner_id" = $1 and "name" = $2',
)
assert.deepEqual(await kyselyNamed.execute(), [])

// Named parameters share one namespace per query.
const peopleWithPets = () =>
  dataSource
    .getRepository(Person)
    .createQueryBuilder('person')
    .innerJoin(Pet, 'pet', 'pet.owner_id = person.id')
    .select('person.first_name', 'first_name')
    .addSelect('pet.name', 'pet_name')
const colliding = peopleWithPets()
  .where('person.first_name = :name', { name: 'Jennifer' })
  .andWhere('pet.name = :name', { name: 'Catto' })
assert.deepEqual(colliding.getParameters(), { name: 'Catto' })
assert.deepEqual(await colliding.getRawMany(), [])
const distinctNames = peopleWithPets()
  .where('person.first_name = :personName', { personName: 'Jennifer' })
  .andWhere('pet.name = :petName', { petName: 'Catto' })
assert.deepEqual(await distinctNames.getRawMany(), [
  { first_name: 'Jennifer', pet_name: 'Catto' },
])
const kyselyBoth = db
  .selectFrom('person')
  .innerJoin('pet', 'pet.owner_id', 'person.id')
  .select(['person.first_name', 'pet.name as pet_name'])
  .where('person.first_name', '=', 'Jennifer')
  .where('pet.name', '=', 'Catto')
assert.deepEqual(kyselyBoth.compile().parameters, ['Jennifer', 'Catto'])
assert.deepEqual(await kyselyBoth.execute(), [
  { first_name: 'Jennifer', pet_name: 'Catto' },
])

// Neither builder is thenable: an async helper returns a builder in both.
expectType<Equal<'then' extends keyof SelectQueryBuilder<Person> ? 1 : 0, 0>>()
assert.equal('then' in typeormFresh, false)
async function typeormHelper() {
  return dataSource
    .getRepository(Person)
    .createQueryBuilder('person')
    .select('person.id', 'id')
}
const typeormReturned = await typeormHelper()
assert.ok(typeormReturned instanceof SelectQueryBuilder)
async function kyselyHelper() {
  return db.selectFrom('person').select('id')
}
assert.equal(
  (await (await kyselyHelper()).where('id', '=', 1).execute()).length,
  1,
)

// No AbortSignal on TypeORM's execution methods, in either version.
expectType<Equal<Parameters<SelectQueryBuilder<Person>['getMany']>, []>>()
expectType<Equal<Parameters<SelectQueryBuilder<Person>['getRawMany']>, []>>()
expectType<Equal<Parameters<SelectQueryBuilder<Person>['stream']>, []>>()
const controller = new AbortController()
controller.abort()
await assert.rejects(
  db.selectFrom('person').select('id').execute({ signal: controller.signal }),
  /abort/i,
)

// One handle type serves the database and a transaction in both libraries.
async function countPeople(manager: EntityManager) {
  return manager.getRepository(Person).createQueryBuilder('person').getCount()
}
assert.equal(await countPeople(dataSource.manager), 4)
assert.equal(await dataSource.transaction((manager) => countPeople(manager)), 4)
async function kyselyCount(handle: Kysely<Database>) {
  return (
    await handle
      .selectFrom('person')
      .select((eb) => eb.fn.countAll<string>().as('n'))
      .executeTakeFirstOrThrow()
  ).n
}
assert.equal(await kyselyCount(db), '4')
assert.equal(await db.transaction().execute((trx) => kyselyCount(trx)), '4')
expectType<Transaction<Database> extends Kysely<Database> ? true : false>()

// Nested callback transactions, and controlled ones.
queries.length = 0
await dataSource.transaction(async (outer) => {
  await outer.transaction(async (inner) => {
    await inner.query('select 1')
  })
})
const nestedStatements = queries.filter((q) =>
  /savepoint|begin|commit/i.test(q),
)
assert.ok(nestedStatements.some((q) => /^SAVEPOINT/i.test(q)))
const runner: QueryRunner = dataSource.createQueryRunner()
await runner.startTransaction()
await runner.rollbackTransaction()
await runner.release()
const kyselyControlled = await db.startTransaction().execute()
const savepoint = await kyselyControlled.savepoint('sp').execute()
await savepoint.rollbackToSavepoint('sp').execute()
await kyselyControlled.rollback().execute()
void isLegacy

await cleanup()
console.log(
  `PASS (TypeORM ${typeormVersion}): shared-builder mutation and clone(), a second where() replacing the first, a parameter name collision returning no rows, neither builder thenable, no signal on TypeORM's getMany/getRawMany/stream, one handle type for database and transaction in both, nested and controlled transactions`,
)
