import assert from 'node:assert/strict'
import { sql } from 'kysely'
import { DataSource, EntitySchema, type Logger } from '#typeorm-under-test'
import { connect, isLegacy, typeormVersion } from './_setup.mts'

const { db, dataSource: base, cleanup } = await connect()
const { schema, extra, url } = base.options as {
  schema: string
  extra: object
  url: string
}

await db.schema
  .alterTable('person')
  .addColumn('updated_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
  .addColumn('deleted_at', 'timestamptz')
  .execute()

class Person {
  declare id: number
  declare first_name: string
  declare age: number | null
  declare updated_at: Date
  declare deleted_at: Date | null
}
class Pet {
  declare id: number
  declare name: string
  declare owner_id: number
}
const PersonSchema = new EntitySchema<Person>({
  name: 'Person',
  target: Person,
  tableName: 'person',
  columns: {
    id: { type: Number, primary: true },
    first_name: { type: String },
    age: { type: Number, nullable: true },
    updated_at: { type: 'timestamptz', updateDate: true },
    deleted_at: { type: 'timestamptz', deleteDate: true, nullable: true },
  },
})
const PetSchema = new EntitySchema<Pet>({
  name: 'Pet',
  target: Pet,
  tableName: 'pet',
  columns: {
    id: { type: Number, primary: true },
    name: { type: String },
    owner_id: { type: Number },
  },
})

let queries: string[] = []
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
  url,
  schema,
  entities: [PersonSchema, PetSchema],
  logging: ['query'],
  logger,
  extra,
})
await dataSource.initialize()
const statements = async (run: () => Promise<unknown>) => {
  queries = []
  await run()
  return queries
    .filter((q) => !/^(START|COMMIT|ROLLBACK)/.test(q))
    .map((q) => q.replace(/\s+/g, ' ').trim())
}

await dataSource
  .getRepository(Person)
  .createQueryBuilder()
  .softDelete()
  .where('id = :id', { id: 2 })
  .execute()

// A join written by hand gets the soft-delete filter in its ON condition.
const petsWithOwners = () =>
  dataSource
    .getRepository(Pet)
    .createQueryBuilder('pet')
    .leftJoin(Person, 'person', 'person.id = pet.owner_id')
    .select('pet.name', 'name')
    .addSelect('person.first_name', 'owner')
    .orderBy('pet.id')
let rows: unknown
const [joinSql] = await statements(async () => {
  rows = await petsWithOwners().getRawMany()
})
assert.match(joinSql, /ON "person"\."id" = "pet"\."owner_id" AND "person"\."deleted_at" IS NULL/)
assert.deepEqual(rows, [
  { name: 'Catto', owner: 'Jennifer' },
  { name: 'Doggo', owner: 'Jennifer' },
  { name: 'Kitty', owner: null },
  { name: 'Parrot', owner: 'Ada' },
])
// withDeleted() lifts the filter only from joins added after it.
assert.deepEqual((await petsWithOwners().withDeleted().getRawMany())[2], {
  name: 'Kitty',
  owner: null,
})
assert.deepEqual(
  (
    await dataSource
      .getRepository(Pet)
      .createQueryBuilder('pet')
      .withDeleted()
      .leftJoin(Person, 'person', 'person.id = pet.owner_id')
      .select('pet.name', 'name')
      .addSelect('person.first_name', 'owner')
      .orderBy('pet.id')
      .getRawMany()
  )[2],
  { name: 'Kitty', owner: 'Arnold' },
)

const kyselyJoin = db
  .selectFrom('pet')
  .leftJoin('person', 'person.id', 'pet.owner_id')
  .select(['pet.name', 'person.first_name as owner'])
  .orderBy('pet.id')
assert.equal(
  kyselyJoin.compile().sql,
  'select "pet"."name", "person"."first_name" as "owner" from "pet" left join "person" on "person"."id" = "pet"."owner_id" order by "pet"."id"',
)
assert.deepEqual((await kyselyJoin.execute())[2], { name: 'Kitty', owner: 'Arnold' })

// Selects and counts on the entity get the filter in WHERE.
const [countSql] = await statements(() =>
  dataSource.getRepository(Person).createQueryBuilder('person').getCount(),
)
assert.match(countSql, /WHERE "person"\."deleted_at" IS NULL/)

// getMany() adds the primary key; getRawMany() prefixes unaliased keys.
const [manySql] = await statements(() =>
  dataSource
    .getRepository(Person)
    .createQueryBuilder('person')
    .select(['person.first_name'])
    .getMany(),
)
assert.match(manySql, /"person"\."id" AS "person_id"/)
const raw = await dataSource
  .getRepository(Person)
  .createQueryBuilder('person')
  .select(['person.first_name'])
  .where('person.id = :id', { id: 1 })
  .getRawMany()
assert.deepEqual(raw, [{ person_first_name: 'Jennifer' }])

// Inserts return generated and default columns; updates set the update date.
const [insertSql] = await statements(() =>
  dataSource
    .createQueryBuilder()
    .insert()
    .into(Person)
    .values({ id: 5, first_name: 'Bruce', age: 50 })
    .execute(),
)
assert.match(insertSql, /RETURNING "updated_at", "deleted_at"$/)
const [updateSql] = await statements(() =>
  dataSource
    .getRepository(Person)
    .createQueryBuilder()
    .update()
    .set({ age: 51 })
    .where('id = :id', { id: 5 })
    .execute(),
)
assert.match(updateSql, /SET "age" = \$1, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = \$2/)

const [softDeleteSql] = await statements(() =>
  dataSource
    .getRepository(Person)
    .createQueryBuilder()
    .softDelete()
    .where('id = :id', { id: 5 })
    .execute(),
)
if (isLegacy) assert.doesNotMatch(softDeleteSql, /AND "deleted_at" IS NULL/)
else assert.match(softDeleteSql, /AND "deleted_at" IS NULL/)

await dataSource.destroy()
await cleanup()
console.log(
  `PASS (TypeORM ${typeormVersion}): the soft-delete filter added to a hand-written join's ON condition, nulling a soft-deleted owner unless withDeleted() comes before the join, and to selects and counts, a primary key added by getMany(), prefixed raw keys, RETURNING added to inserts, the update date added to updates, and Kysely compiling the join as written`,
)
