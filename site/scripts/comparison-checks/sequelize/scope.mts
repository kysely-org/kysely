import assert from 'node:assert/strict'
import { col, fn, Op, type WhereOptions } from '#sequelize-under-test'
import { connect, expectType, isAlpha, pgCode, Person, Pet, type Equal } from './_setup.mts'

const { db, cleanup } = await connect()

async function rejects(run: () => Promise<unknown>, code: string) {
  await assert.rejects(run, (error) => pgCode(error) === code)
}

// The same grouped report.
const sequelizeRows = await Person.findAll({
  attributes: ['id', 'first_name', [fn('COUNT', col('pets.id')), 'pet_count']],
  include: [{ model: Pet, as: 'pets', attributes: [] }],
  group: ['Person.id'],
  order: [['id', 'ASC']],
  raw: true,
})

const kyselyRows = await db
  .selectFrom('person')
  .leftJoin('pet', 'pet.owner_id', 'person.id')
  .select(['person.id', 'person.first_name'])
  .select((eb) => eb.fn.count('pet.id').as('pet_count'))
  .groupBy('person.id')
  .orderBy('person.id')
  .execute()
expectType<
  Equal<
    typeof kyselyRows,
    { id: number; first_name: string; pet_count: string | number | bigint }[]
  >
>()
assert.deepEqual(sequelizeRows, kyselyRows)
assert.deepEqual(
  kyselyRows.map((row) => row.pet_count),
  ['2', '1', '1', '0'],
)
// The Sequelize row type comes from the model, not the selection: see types/.
assert.equal('pet_count' in (sequelizeRows[0] as object), true)

// Invalid references Sequelize passes to PostgreSQL.
await rejects(
  () => Person.findAll({ attributes: ['id', [col('pets.name'), 'pet_name']], raw: true }),
  '42P01',
)
await rejects(
  () => Person.findAll({ where: { '$pets.name$': 'Catto' }, raw: true }),
  '42P01',
)
await rejects(() => Person.findAll({ order: [['first_nam', 'ASC']], raw: true }), '42703')
await rejects(() => Person.findAll({ group: ['Person.first_nam'], raw: true }), '42703')
await rejects(
  () => Person.findAll({ attributes: ['id', [col('first_nam'), 'name']], raw: true }),
  '42703',
)
// An association alias Sequelize does not know throws before a statement is sent.
await assert.rejects(
  () => Person.findAll({ include: [{ model: Pet, as: 'petz' }] }),
  /petz/,
)
// age is an integer: 6.37.8 sends the string, 7.0.0-alpha.48 refuses it first.
const oldAge = () => Person.findAll({ where: { age: 'old' }, raw: true })
if (isAlpha) await assert.rejects(oldAge, /Invalid value received for the "where" option/)
else await rejects(oldAge, '22P02')
// The where object itself is checked against the model.
// @ts-expect-error first_nam is not an attribute of Person.
void (() => Person.findAll({ where: { first_nam: 'Jennifer' } }))

// Kysely rejects each through TypeScript.
void (() => {
  // @ts-expect-error pet is not joined.
  db.selectFrom('person').select('pet.name')
  // @ts-expect-error pet is not joined.
  db.selectFrom('person').selectAll().where('pet.name', '=', 'Catto')
  // @ts-expect-error first_nam is not a column.
  db.selectFrom('person').selectAll().orderBy('first_nam')
  // @ts-expect-error first_nam is not a column.
  db.selectFrom('person').select('id').groupBy('person.first_nam')
  // @ts-expect-error first_nam is not a column.
  db.selectFrom('person').select('first_nam as name')
  // @ts-expect-error petz is not a table.
  db.selectFrom('person').leftJoin('petz', 'petz.owner_id', 'person.id')
  // @ts-expect-error age is a number.
  db.selectFrom('person').selectAll().where('age', '=', 'old')
})

// The include is removed with the pet's name, and the collected filter stays.
function sequelizeMatchingPeople(options: { petName?: string }) {
  const where: WhereOptions = { age: { [Op.gte]: 18 } }

  if (options.petName) {
    where['$pets.name$'] = options.petName
  }
  return Person.findAll({ attributes: ['first_name'], where, raw: true })
}
assert.equal((await sequelizeMatchingPeople({})).length, 3)
await rejects(() => sequelizeMatchingPeople({ petName: 'Catto' }), '42P01')

function kyselyMatchingPeople(options: { petName?: string }) {
  let query = db.selectFrom('person').select('person.first_name').where('person.age', '>=', 18)
  if (options.petName) {
    // @ts-expect-error pet is not available in this query.
    query = query.where('pet.name', '=', options.petName)
  }
  return query
}
void kyselyMatchingPeople

await cleanup()
console.log('PASS scope.mts')
