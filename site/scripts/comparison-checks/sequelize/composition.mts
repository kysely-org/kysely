import assert from 'node:assert/strict'
import { cast, col, fn, Op, scoped, where } from '#sequelize-under-test'
import { connect, isAlpha, pgCode, Person, Pet } from './_setup.mts'

const { db, sequelize, queries, cleanup } = await connect()

// A scope's where and the caller's where on the same attribute.
Pet.addScope('ownedBy1', { where: { owner_id: 1 } })
const names = async (rows: Promise<Pet[]>) => (await rows).map((pet) => pet.name)

const overridden = await names(scoped(Pet, 'ownedBy1').findAll({ where: { owner_id: 2 } }))
// 6.37.8 replaces the scope's owner_id; 7.0.0-alpha.48 joins both with AND.
assert.deepEqual(overridden, isAlpha ? [] : ['Kitty'])

const combined = await names(scoped(Pet, 'ownedBy1').findAll({ where: { name: 'Kitty' } }))
assert.deepEqual(combined, [])

if (!isAlpha) {
  // whereMergeStrategy: 'and' opts a 6.x model into AND.
  const { Model, DataTypes } = await import('sequelize')
  class SafePet extends Model {}
  SafePet.init(
    { id: { type: DataTypes.INTEGER, primaryKey: true }, name: DataTypes.TEXT, owner_id: DataTypes.INTEGER },
    { sequelize: sequelize as never, tableName: 'pet', whereMergeStrategy: 'and', scopes: { ownedBy1: { where: { owner_id: 1 } } } },
  )
  assert.deepEqual(await SafePet.scope('ownedBy1').findAll({ where: { owner_id: 2 } }), [])
}

// Kysely: every where() adds a condition, and builders do not change.
const ownedBy1 = db.selectFrom('pet').select('name').where('owner_id', '=', 1)
assert.deepEqual(await ownedBy1.where('owner_id', '=', 2).execute(), [])
const preview = ownedBy1.limit(1)
assert.equal((await ownedBy1.execute()).length, 2)
assert.equal((await preview.execute()).length, 1)

// findAndCountAll with an include counts joined rows unless distinct is set.
queries.length = 0
const page = await Person.findAndCountAll({
  include: [{ model: Pet, as: 'pets' }],
  order: [['id', 'ASC']],
  limit: 2,
})
assert.equal(page.count, 5)
assert.equal(queries.length, 2)
const distinctPage = await Person.findAndCountAll({
  include: [{ model: Pet, as: 'pets' }],
  distinct: true,
  limit: 2,
})
assert.equal(distinctPage.count, 4)

// An include with a limit pages parents through a subquery.
const paged = await Person.findAll({
  include: [{ model: Pet, as: 'pets' }],
  order: [['id', 'ASC']],
  limit: 2,
})
assert.deepEqual(paged.map((p) => [p.first_name, p.pets!.length]), [['Jennifer', 2], ['Arnold', 1]])

// A filter on the included table through $nested$ lands inside that subquery.
await assert.rejects(
  () => Person.findAll({ include: [{ model: Pet, as: 'pets' }], where: { '$pets.name$': 'Catto' }, limit: 2 }),
  (error) => pgCode(error) === '42P01',
)

// The grouped report with a per-person target, ranked and paginated.
Person.addScope('petCounts', {
  attributes: ['id', 'first_name', [cast(fn('COUNT', col('pets.id')), 'integer'), 'pet_count']],
  include: [{ model: Pet, as: 'pets', attributes: [] }],
  group: ['Person.id'],
})
const targets = (subQuery?: boolean) =>
  scoped(Person, 'petCounts').findAll({
    having: where(fn('COUNT', col('pets.id')), Op.gte, col('Person.pet_target')),
    order: [
      ['pet_count', 'DESC'],
      ['id', 'ASC'],
    ],
    limit: 1,
    ...(subQuery === undefined ? {} : { subQuery }),
    raw: true,
  })
await assert.rejects(() => targets(), (error) => pgCode(error) === '42P01')
assert.deepEqual(await targets(false), [{ id: 2, first_name: 'Arnold', pet_count: 1 }])

const kyselyTargets = await db
  .selectFrom('person')
  .leftJoin('pet', 'pet.owner_id', 'person.id')
  .select(['person.id', 'person.first_name'])
  .select((eb) => eb.cast<number>(eb.fn.count('pet.id'), 'integer').as('pet_count'))
  .groupBy('person.id')
  .having((eb) => eb(eb.fn.count('pet.id'), '>=', eb.ref('person.pet_target')))
  .orderBy('pet_count', 'desc')
  .orderBy('person.id')
  .limit(1)
  .execute()
assert.deepEqual(kyselyTargets, [{ id: 2, first_name: 'Arnold', pet_count: 1 }])

// Kysely reads a page of parents and its total in one statement.
const kyselyPage = await db
  .selectFrom('person')
  .select((eb) => ['person.first_name', eb.fn.countAll().over().as('total')])
  .orderBy('person.id')
  .limit(2)
  .execute()
assert.deepEqual(kyselyPage, [
  { first_name: 'Jennifer', total: '4' },
  { first_name: 'Arnold', total: '4' },
])

await cleanup()
console.log('PASS composition.mts')
