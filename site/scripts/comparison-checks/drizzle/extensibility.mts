import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import {
  Kysely,
  PGliteDialect,
  DeduplicateJoinsPlugin,
  type SelectType,
} from 'kysely'
import { drizzle as proxy } from 'drizzle-stable/pg-proxy'
import { PgDialect } from 'drizzle-stable/pg-core'
import { drizzle as rcProxy } from 'drizzle-rc/pg-proxy'
import { PgDialect as RcDialect } from 'drizzle-rc/pg-core'
interface Database {
  person: { id: number; first_name: string; age: number | null }
  pet: { id: number; name: string; owner_id: number }
}
const pglite = new PGlite()
const db = new Kysely<Database>({ dialect: new PGliteDialect({ pglite }) })
async function findRow<
  T extends keyof Database & string,
  C extends keyof Database[T] & string,
  V extends SelectType<Database[T][C]>,
>(tableName: T, columnName: C, value: V) {
  const { table, ref } = db.dynamic
  return db
    .selectFrom(table(tableName).as('r'))
    .selectAll('r')
    .where(ref(columnName), '=', value)
    .executeTakeFirst()
}
const query = db
  .selectFrom('person')
  .innerJoin('pet', 'pet.owner_id', 'person.id')
  .innerJoin('pet', 'pet.owner_id', 'person.id')
  .select('person.id')
  .withPlugin(new DeduplicateJoinsPlugin())
function compileChecks() {
  // @ts-expect-error name belongs to pet, not person.
  findRow('person', 'name', 'Jennifer')
  // @ts-expect-error first_name is not a number.
  findRow('person', 'first_name', 123)
  // @ts-expect-error the table is absent from Database.
  findRow('missing', 'id', 1)
}
void compileChecks
try {
  await pglite.exec(
    "create table person(id integer,first_name text,age integer);create table pet(id integer,name text,owner_id integer);insert into person values(1,'Jennifer',20);insert into pet values(2,'Catto',1)",
  )
  const person = await findRow('person', 'first_name', 'Jennifer')
  const typedPerson:
    { id: number; first_name: string; age: number | null } | undefined = person
  assert.deepEqual(typedPerson, { id: 1, first_name: 'Jennifer', age: 20 })
  const pet = await findRow('pet', 'name', 'Catto')
  const typedPet: { id: number; name: string; owner_id: number } | undefined =
    pet
  assert.deepEqual(typedPet, { id: 2, name: 'Catto', owner_id: 1 })
  assert.equal(await findRow('person', 'first_name', 'missing'), undefined)
  assert.equal((query.compile().sql.match(/inner join/gi) || []).length, 1)
  assert.deepEqual(await query.execute(), [{ id: 1 }])
  let stableFactory = false,
    rcFactory = false
  proxy(
    async () => ({ rows: [] }),
    undefined,
    () => {
      stableFactory = true
      return new PgDialect()
    },
  )
  rcProxy(
    async () => ({ rows: [] }),
    undefined,
    () => {
      rcFactory = true
      return new RcDialect()
    },
  )
  assert(stableFactory)
  assert(rcFactory)
  console.log(
    'PASS: dynamic generic helpers infer both table shapes and reject wrong columns/values/tables; plugin removes repeated join; Drizzle stable/RC accept dialect factories',
  )
} finally {
  await db.destroy()
}
