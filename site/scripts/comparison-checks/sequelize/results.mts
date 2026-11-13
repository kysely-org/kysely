import assert from 'node:assert/strict'
import { jsonArrayFrom } from 'kysely/helpers/postgres'
import { connect, expectType, Person, Pet, type Equal } from './_setup.mts'

const { db, queries, cleanup } = await connect()

// A renamed attribute: the row has name, the type still says first_name.
const renamed = await Person.findOne({
  attributes: [['first_name', 'name']],
  where: { id: 1 },
  raw: true,
})
assert.deepEqual(Object.keys(renamed!), ['name'])
assert.equal(renamed!.first_name, undefined)

// A partial selection keeps the whole model type.
const partial = await Person.findByPk(1, { attributes: ['id'], rejectOnEmpty: true })
expectType<Equal<typeof partial.first_name, string>>()
assert.equal(partial.first_name, undefined)

// raw: true with an include flattens one row per pet under dotted keys.
const flat = await Person.findAll({
  include: [{ model: Pet, as: 'pets' }],
  where: { id: 1 },
  raw: true,
})
assert.equal(flat.length, 2)
assert.equal((flat[0] as unknown as Record<string, unknown>)['pets.name'], 'Catto')

// Kysely infers each selection.
const kyselyRenamed = await db.selectFrom('person').select('first_name as name').where('id', '=', 1).executeTakeFirstOrThrow()
expectType<Equal<typeof kyselyRenamed, { name: string }>>()
// @ts-expect-error first_name is no longer selected.
kyselyRenamed.first_name
const kyselyPartial = await db.selectFrom('person').select('id').where('id', '=', 1).executeTakeFirstOrThrow()
expectType<Equal<typeof kyselyPartial, { id: number }>>()

// Hydrated includes: one statement with one row per pet, grouped into instances.
queries.length = 0
const people = await Person.findAll({ include: [{ model: Pet, as: 'pets' }], order: [['id', 'ASC'], [{ model: Pet, as: 'pets' }, 'id', 'ASC']] })
assert.equal(queries.length, 1)
assert.deepEqual(people.map((p) => [p.first_name, p.pets!.map((pet) => pet.name)]), [
  ['Jennifer', ['Catto', 'Doggo']],
  ['Arnold', ['Kitty']],
  ['Ada', ['Parrot']],
  ['Sylvester', []],
])
// separate: true loads a hasMany include with a statement of its own.
queries.length = 0
await Person.findAll({ include: [{ model: Pet, as: 'pets', separate: true }] })
assert.equal(queries.length, 2)

// A filter on the include trims the hydrated collection under the same type.
const filtered = await Person.findAll({ include: [{ model: Pet, as: 'pets', where: { name: 'Catto' } }] })
assert.deepEqual(filtered.map((p) => p.pets!.map((pet) => pet.name)), [['Catto']])

// Kysely nests in SQL.
const nested = await db
  .selectFrom('person')
  .select((eb) => [
    'person.first_name',
    jsonArrayFrom(
      eb.selectFrom('pet').select('pet.name').whereRef('pet.owner_id', '=', 'person.id').orderBy('pet.name'),
    ).as('pets'),
  ])
  .orderBy('person.id')
  .execute()
expectType<Equal<typeof nested, { first_name: string; pets: { name: string }[] }[]>>()
assert.deepEqual(nested.map((p) => [p.first_name, p.pets.map((pet) => pet.name)]), [
  ['Jennifer', ['Catto', 'Doggo']],
  ['Arnold', ['Kitty']],
  ['Ada', ['Parrot']],
  ['Sylvester', []],
])

await cleanup()
console.log('PASS results.mts')
