import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { Kysely, PostgresDialect } from 'kysely'
import {
  Model,
  DataTypes,
  Op,
  fn,
  col,
  cast,
  where,
  QueryTypes,
  connectSequelize,
  scoped,
} from '#sequelize-under-test'
import type {
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from '#sequelize-under-test'

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false
type Expect<T extends true> = T

// DOC:database
interface Database {
  person: {
    id: number
    first_name: string
    age: number | null
    pet_target: number
  }
  pet: { id: number; name: string; owner_id: number }
}
// END:database

const connectionString = process.env.COMPARISON_DATABASE_URL
assert(
  connectionString,
  'Set COMPARISON_DATABASE_URL to a disposable PostgreSQL database',
)
const schema = `sequelize_comparison_${randomUUID().replaceAll('-', '')}`
const admin = new Pool({ connectionString })
const pool = new Pool({ connectionString, options: `-c search_path=${schema}` })
const db = new Kysely<Database>({ dialect: new PostgresDialect({ pool }) })
const sequelize = connectSequelize(connectionString, schema)

// DOC:models
class Person extends Model<
  InferAttributes<Person>,
  InferCreationAttributes<Person>
> {
  declare id: number
  declare first_name: string
  declare age: number | null
  declare pet_target: number
  declare pets?: NonAttribute<Pet[]>
}

class Pet extends Model<InferAttributes<Pet>, InferCreationAttributes<Pet>> {
  declare id: number
  declare name: string
  declare owner_id: number
}

Person.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    first_name: { type: DataTypes.TEXT, allowNull: false },
    age: { type: DataTypes.INTEGER, allowNull: true },
    pet_target: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, modelName: 'Person', tableName: 'person', timestamps: false },
)

Pet.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    name: { type: DataTypes.TEXT, allowNull: false },
    owner_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, modelName: 'Pet', tableName: 'pet', timestamps: false },
)

Person.hasMany(Pet, { as: 'pets', foreignKey: 'owner_id' })
// END:models

// DOC:sequelize-report-scope
Person.addScope('petCounts', {
  attributes: [
    'id',
    'first_name',
    [cast(fn('COUNT', col('pets.id')), 'integer'), 'pet_count'],
  ],
  include: [{ model: Pet, as: 'pets', attributes: [], required: false }],
  group: ['Person.id', 'Person.first_name'],
})
// END:sequelize-report-scope

const PetCountReport = scoped(Person, 'petCounts')

// DOC:sequelize-counts
function sequelizePetCounts(minPets: number) {
  return PetCountReport.findAll({
    having: where(fn('COUNT', col('pets.id')), Op.gte, minPets),
    order: [['id', 'ASC']],
    raw: true,
  })
}
// END:sequelize-counts

// DOC:kysely-base
function personPetCounts() {
  return db
    .selectFrom('person')
    .leftJoin('pet', 'pet.owner_id', 'person.id')
    .select(['person.id', 'person.first_name'])
    .select((eb) =>
      eb.cast<number>(eb.fn.count('pet.id'), 'integer').as('pet_count'),
    )
    .groupBy(['person.id', 'person.first_name'])
}
// END:kysely-base

// DOC:kysely-counts
function kyselyPetCounts(minPets: number) {
  return personPetCounts()
    .having((eb) => eb.fn.count('pet.id'), '>=', minPets)
    .orderBy('person.id')
    .execute()
}
// END:kysely-counts

// DOC:sequelize-targets
function sequelizeTargetCounts(pageSize = 20) {
  return PetCountReport.findAll({
    having: where(
      fn('COUNT', col('pets.id')),
      Op.gte,
      col('Person.pet_target'),
    ),
    order: [
      ['pet_count', 'DESC'],
      ['id', 'ASC'],
    ],
    limit: pageSize,
    subQuery: false,
    raw: true,
  })
}
// END:sequelize-targets

// DOC:kysely-targets
function kyselyTargetCounts(pageSize = 20) {
  return personPetCounts()
    .groupBy('person.pet_target')
    .having((eb) =>
      eb(eb.fn.count('pet.id'), '>=', eb.ref('person.pet_target')),
    )
    .orderBy('pet_count', 'desc')
    .orderBy('person.id')
    .limit(pageSize)
    .execute()
}
// END:kysely-targets

// DOC:sequelize-target-typo
function misspelledTarget() {
  return PetCountReport.findAll({
    having: where(
      fn('COUNT', col('pets.id')),
      Op.gte,
      col('Person.pet_targte'),
    ),
    raw: true,
  })
}
// END:sequelize-target-typo

function defaultPagedReport() {
  return PetCountReport.findAll({
    having: where(
      fn('COUNT', col('pets.id')),
      Op.gte,
      col('Person.pet_target'),
    ),
    order: [
      ['pet_count', 'DESC'],
      ['id', 'ASC'],
    ],
    limit: 1,
    raw: true,
  })
}

// DOC:renamed-attribute
async function renamedAttribute() {
  const rows = await Person.findAll({
    attributes: [['first_name', 'name']],
    order: [['id', 'ASC']],
    raw: true,
  })

  return rows[0]?.first_name // The declared property is absent at runtime.
}
// END:renamed-attribute

// DOC:partial-model
async function partialModel() {
  const person = await Person.findByPk(1, {
    attributes: ['id'],
    rejectOnEmpty: true,
  })
  return person.first_name // Typed as string; not selected at runtime.
}
// END:partial-model

// DOC:kysely-renamed
function kyselyRenamed() {
  return db
    .selectFrom('person')
    .select('first_name as name')
    .orderBy('id')
    .execute()
}
// END:kysely-renamed

// DOC:unjoined-reference
function unjoinedReference() {
  return Person.findAll({
    attributes: ['id', [col('pets.name'), 'pet_name']],
    raw: true,
  })
}
// END:unjoined-reference

// DOC:misspelled-reference
function misspelledReference() {
  return Person.findAll({
    attributes: ['id', [col('first_nam'), 'name']],
    raw: true,
  })
}
// END:misspelled-reference

function typeChecks() {
  Person.findAll({
    // @ts-expect-error Typed object filters reject an unknown model attribute.
    where: { first_nam: 'Jennifer' },
  })

  // @ts-expect-error pet is outside the query context.
  db.selectFrom('person').select('id').select('pet.name as pet_name')
  // @ts-expect-error The column is misspelled.
  db.selectFrom('person').select('first_nam as name')
  type Renamed = Awaited<ReturnType<typeof kyselyRenamed>>[number]
  // @ts-expect-error The selected alias is name, not first_name.
  const old: Renamed['first_name'] = ''
  type OnlyId = Awaited<ReturnType<typeof idOnly>>[number]
  // @ts-expect-error This query selects only id.
  const missing: OnlyId['first_name'] = ''
  personPetCounts().having((eb) =>
    // @ts-expect-error The new target column is misspelled.
    eb(eb.fn.count('pet.id'), '>=', eb.ref('person.pet_targte')),
  )
  return [old, missing]
}
void typeChecks

function idOnly() {
  return db.selectFrom('person').select('id').execute()
}

async function dynamicAttributeIsNotInferred() {
  const rows = await sequelizePetCounts(0)
  // @ts-expect-error The added aggregate is not inferred from attributes.
  return rows[0].pet_count
}
void dynamicAttributeIsNotInferred

// DOC:sequelize-raw
interface PetCountRow {
  id: number
  first_name: string
  pet_count: number
}

function sequelizeRawCounts(minPets: number) {
  return sequelize.query<PetCountRow>(
    `
    select person.id, person.first_name, count(pet.id)::integer as pet_count
    from person
    left join pet on pet.owner_id = person.id
    group by person.id, person.first_name
    having count(pet.id) >= $minPets
    order by person.id
  `,
    { bind: { minPets }, type: QueryTypes.SELECT },
  )
}
// END:sequelize-raw

async function staleRawType() {
  const rows = await sequelize.query<{ first_name: string }>(
    'select first_name as name from person order by id',
    { type: QueryTypes.SELECT },
  )
  return rows[0]?.first_name
}

// DOC:kysely-branches
function countBranches() {
  const base = personPetCounts()
  const all = base.orderBy('person.id')
  const atLeastTwo = base
    .having((eb) => eb.fn.count('pet.id'), '>=', 2)
    .orderBy('pet_count', 'desc')
    .orderBy('person.id')
    .limit(1)
  return { all, atLeastTwo }
}
// END:kysely-branches

type InferredCounts = Expect<
  Equal<
    Awaited<ReturnType<typeof kyselyPetCounts>>,
    { id: number; first_name: string; pet_count: number }[]
  >
>
type InferredRename = Expect<
  Equal<Awaited<ReturnType<typeof kyselyRenamed>>, { name: string }[]>
>
type PartialModelStillSaysString = Expect<
  Equal<Awaited<ReturnType<typeof partialModel>>, string>
>
type InferredTargetCounts = Expect<
  Equal<
    Awaited<ReturnType<typeof kyselyTargetCounts>>,
    Awaited<ReturnType<typeof kyselyPetCounts>>
  >
>

try {
  await admin.query(`create schema "${schema}"`)
  await db.schema
    .createTable('person')
    .addColumn('id', 'integer', (c) => c.primaryKey())
    .addColumn('first_name', 'text', (c) => c.notNull())
    .addColumn('age', 'integer')
    .addColumn('pet_target', 'integer', (c) => c.notNull())
    .execute()
  await db.schema
    .createTable('pet')
    .addColumn('id', 'integer', (c) => c.primaryKey())
    .addColumn('name', 'text', (c) => c.notNull())
    .addColumn('owner_id', 'integer', (c) =>
      c.notNull().references('person.id'),
    )
    .execute()
  await db
    .insertInto('person')
    .values([
      { id: 1, first_name: 'Jennifer', age: 40, pet_target: 3 },
      { id: 2, first_name: 'Arnold', age: 17, pet_target: 1 },
      { id: 3, first_name: 'Ada', age: 30, pet_target: 0 },
      { id: 4, first_name: 'NoPets', age: null, pet_target: 1 },
    ])
    .execute()
  await db
    .insertInto('pet')
    .values([
      { id: 1, name: 'Catto', owner_id: 1 },
      { id: 2, name: 'Doggo', owner_id: 1 },
      { id: 3, name: 'Kitty', owner_id: 2 },
    ])
    .execute()
  await sequelize.authenticate()

  const expected = [
    { id: 1, first_name: 'Jennifer', pet_count: 2 },
    { id: 2, first_name: 'Arnold', pet_count: 1 },
    { id: 3, first_name: 'Ada', pet_count: 0 },
    { id: 4, first_name: 'NoPets', pet_count: 0 },
  ]
  for (const threshold of [0, 1, 2, 3]) {
    const matching = expected.filter((row) => row.pet_count >= threshold)
    assert.deepEqual(await sequelizePetCounts(threshold), matching)
    assert.deepEqual(await kyselyPetCounts(threshold), matching)
    assert.deepEqual(await sequelizeRawCounts(threshold), matching)
  }
  console.log(
    'PASS: Sequelize aggregates, raw bound SQL, and Kysely match at four thresholds, including zero pets and empty results',
  )

  const targetMatches = [expected[1], expected[2]]
  await assert.rejects(
    defaultPagedReport(),
    (error: any) => (error.cause ?? error.original)?.code === '42P01',
  )
  for (const pageSize of [1, 2, 20]) {
    assert.deepEqual(
      await sequelizeTargetCounts(pageSize),
      targetMatches.slice(0, pageSize),
    )
    assert.deepEqual(
      await kyselyTargetCounts(pageSize),
      targetMatches.slice(0, pageSize),
    )
  }
  await assert.rejects(
    misspelledTarget(),
    (error: any) => (error.cause ?? error.original)?.code === '42703',
  )
  const topBeforeFiltering = await personPetCounts()
    .orderBy('pet_count', 'desc')
    .orderBy('person.id')
    .limit(1)
    .execute()
  assert.equal(topBeforeFiltering[0].id, 1)
  assert.notEqual((await kyselyTargetCounts(1))[0].id, topBeforeFiltering[0].id)
  console.log(
    'PASS: reusable report scope and Kysely builder apply per-person targets before pagination; the target typo reaches PostgreSQL only with Sequelize',
  )

  assert.equal(await renamedAttribute(), undefined)
  assert.equal(await partialModel(), undefined)
  assert.equal(await staleRawType(), undefined)
  const renamed = expected.map(({ first_name }) => ({ name: first_name }))
  assert.deepEqual(await kyselyRenamed(), renamed)
  assert.deepEqual(
    await Person.findAll({
      attributes: [['first_name', 'name']],
      order: [['id', 'ASC']],
      raw: true,
    }),
    renamed,
  )
  console.log(
    'PASS: renamed model attributes, partial models, stale raw types, and inferred Kysely aliases',
  )

  await assert.rejects(
    unjoinedReference(),
    (error: any) => (error.cause ?? error.original)?.code === '42P01',
  )
  await assert.rejects(
    misspelledReference(),
    (error: any) => (error.cause ?? error.original)?.code === '42703',
  )
  console.log(
    'PASS: unchecked col references reach PostgreSQL; model object filters are checked by TypeScript',
  )

  const { all, atLeastTwo } = countBranches()
  assert.notEqual(all, atLeastTwo)
  assert.deepEqual(await atLeastTwo.execute(), [expected[0]])
  assert.deepEqual(await all.execute(), expected)

  const person = await Person.findByPk(1, {
    include: [{ model: Pet, as: 'pets' }],
    rejectOnEmpty: true,
  })
  assert(person instanceof Person)
  assert.equal(person.pets?.length, 2)
  assert(person.pets?.every((pet) => pet instanceof Pet))
  const noPets = await Person.findByPk(4, {
    include: [{ model: Pet, as: 'pets' }],
    rejectOnEmpty: true,
  })
  assert.deepEqual(noPets.pets, [])
  Person.addScope('adults', { where: { age: { [Op.gte]: 18 } } })
  const adults = await scoped(Person, 'adults').findAll({
    attributes: ['id'],
    order: [['id', 'ASC']],
    raw: true,
  })
  assert.deepEqual(adults, [{ id: 1 }, { id: 3 }])
  console.log(
    'PASS: independent Kysely branches, Sequelize relation hydration, empty arrays, and reusable scopes',
  )
} finally {
  await sequelize.close()
  await db.destroy()
  try {
    await admin.query(`drop schema if exists "${schema}" cascade`)
  } finally {
    await admin.end()
  }
}
