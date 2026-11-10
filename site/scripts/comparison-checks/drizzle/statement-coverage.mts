import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { Kysely, MysqlDialect, PGliteDialect, type LogEvent } from 'kysely'
import * as stable from 'drizzle-stable'
import { inArray } from 'drizzle-stable'
import { integer, pgTable, text } from 'drizzle-stable/pg-core'
import { drizzle } from 'drizzle-stable/pglite'
import { int, mysqlTable, text as mysqlText } from 'drizzle-stable/mysql-core'
import { drizzle as mysqlDrizzle } from 'drizzle-stable/mysql-proxy'
import * as rc from 'drizzle-rc'
import { inArray as rcInArray } from 'drizzle-rc'
import {
  integer as rcInteger,
  pgTable as rcTable,
  text as rcText,
} from 'drizzle-rc/pg-core'
import { drizzle as rcDrizzle } from 'drizzle-rc/pglite'
import {
  int as rcInt,
  mysqlTable as rcMysqlTable,
  text as rcMysqlText,
} from 'drizzle-rc/mysql-core'
import { drizzle as rcMysqlDrizzle } from 'drizzle-rc/mysql-proxy'

const step = (name: string) =>
  process.env.COMPARISON_TRACE && console.error(`step: ${name}`)

interface Database {
  person: { id: number; first_name: string; age: number | null }
  person_source: { id: number; first_name: string; age: number | null }
  pet: { id: number; name: string; owner_id: number }
  folder: { id: number; parent_id: number | null }
}
const person = pgTable('person', {
  id: integer().notNull(),
  first_name: text().notNull(),
  age: integer(),
})
const pet = pgTable('pet', {
  id: integer().notNull(),
  name: text().notNull(),
  owner_id: integer().notNull(),
})
const rcPerson = rcTable('person', {
  id: rcInteger().notNull(),
  first_name: rcText().notNull(),
  age: rcInteger(),
})
const rcPet = rcTable('pet', {
  id: rcInteger().notNull(),
  name: rcText().notNull(),
  owner_id: rcInteger().notNull(),
})
const mysqlPet = mysqlTable('pet', {
  id: int().notNull(),
  name: mysqlText().notNull(),
  owner_id: int().notNull(),
})
const rcMysqlPet = rcMysqlTable('pet', {
  id: rcInt().notNull(),
  name: rcMysqlText().notNull(),
  owner_id: rcInt().notNull(),
})

const pglite = new PGlite()
const durations: number[] = []
const db = new Kysely<Database>({
  dialect: new PGliteDialect({ pglite }),
  log(event: LogEvent) {
    durations.push(event.queryDurationMillis)
  },
})
const drizzleDb = drizzle(pglite)
const rcDb = rcDrizzle({ client: pglite })
// Nothing connects through these: the checks are types and builder members.
const mysqlDb = new Kysely<Database>({
  dialect: new MysqlDialect({ pool: {} as never }),
})
const drizzleMysql = mysqlDrizzle(async () => ({ rows: [] }))
const rcMysql = rcMysqlDrizzle(async () => ({ rows: [] }))

await pglite.exec(`
  create table person (id integer primary key, first_name text not null, age integer);
  create table person_source (id integer primary key, first_name text not null, age integer);
  create table pet (id integer, name text not null, owner_id integer not null, constraint pet_pkey primary key (id));
  insert into person values (1, 'Jennifer', 40), (2, 'Arnold', 17), (3, 'Sylvester', null);
  insert into person_source values (1, 'Jen', 40), (4, 'Bruce', 50);
  insert into pet values (1, 'Catto', 1), (2, 'Doggo', 2), (3, 'Hammo', 1);
  create table folder (id integer primary key, parent_id integer);
  insert into folder values (1, null), (2, 1), (3, 2), (4, null);
`)

// Statements and clauses Kysely builds, each run against PostgreSQL.

// WITH RECURSIVE: drizzle-orm #209.
step('recursive')
const tree = db
  .withRecursive('tree(id)', (qb) =>
    qb
      .selectFrom('folder')
      .select('id')
      .where('id', '=', 1)
      .unionAll(
        qb
          .selectFrom('folder')
          .innerJoin('tree', 'tree.id', 'folder.parent_id')
          .select('folder.id'),
      ),
  )
  .selectFrom('tree')
  .select('id')
  .orderBy('id')
assert.equal(
  tree.compile().sql,
  'with recursive "tree"("id") as (select "id" from "folder" where "id" = $1 union all select "folder"."id" from "folder" inner join "tree" on "tree"."id" = "folder"."parent_id") select "id" from "tree" order by "id"',
)
assert.deepEqual(await tree.execute(), [{ id: 1 }, { id: 2 }, { id: 3 }])

// CTE materialization: drizzle-orm #2318.
step('materialized')
const adults = db
  .with(
    (cte) => cte('adults').materialized(),
    (qb) => qb.selectFrom('person').select('id').where('age', '>=', 18),
  )
  .selectFrom('adults')
  .select('id')
assert.equal(
  adults.compile().sql,
  'with "adults" as materialized (select "id" from "person" where "age" >= $1) select "id" from "adults"',
)
assert.deepEqual(await adults.execute(), [{ id: 1 }])

// Row-value IN: drizzle-orm #3575, #534.
step('row-value in')
const pair = db
  .selectFrom('pet')
  .select('name')
  .where((eb) =>
    eb(eb.refTuple('id', 'owner_id'), 'in', [eb.tuple(1, 1), eb.tuple(3, 1)]),
  )
  .orderBy('name')
assert.equal(
  pair.compile().sql,
  'select "name" from "pet" where ("id", "owner_id") in (($1, $2), ($3, $4)) order by "name"',
)
assert.deepEqual(await pair.execute(), [{ name: 'Catto' }, { name: 'Hammo' }])

// NULLS FIRST / NULLS LAST: drizzle-orm #1699.
step('nulls last')
const byAge = db
  .selectFrom('person')
  .select('id')
  .orderBy('age', (ob) => ob.desc().nullsLast())
assert.equal(
  byAge.compile().sql,
  'select "id" from "person" order by "age" desc nulls last',
)
assert.deepEqual(await byAge.execute(), [{ id: 1 }, { id: 2 }, { id: 3 }])

// IS DISTINCT FROM: drizzle-orm #1733.
step('is distinct from')
const notForty = db
  .selectFrom('person')
  .select('id')
  .where('age', 'is distinct from', 40)
  .orderBy('id')
assert.equal(
  notForty.compile().sql,
  'select "id" from "person" where "age" is distinct from $1 order by "id"',
)
assert.deepEqual(await notForty.execute(), [{ id: 2 }, { id: 3 }])

// ON CONFLICT ON CONSTRAINT.
step('on conflict on constraint')
const upsert = db
  .insertInto('pet')
  .values({ id: 1, name: 'Catto', owner_id: 1 })
  .onConflict((oc) => oc.constraint('pet_pkey').doNothing())
assert.equal(
  upsert.compile().sql,
  'insert into "pet" ("id", "name", "owner_id") values ($1, $2, $3) on conflict on constraint "pet_pkey" do nothing',
)
assert.equal((await upsert.executeTakeFirst()).numInsertedOrUpdatedRows, 0n)

// DELETE ... USING: drizzle-orm #793.
step('delete using')
const deleteMinorsPets = db
  .deleteFrom('pet')
  .using('person')
  .whereRef('pet.owner_id', '=', 'person.id')
  .where('person.age', '<', 18)
assert.equal(
  deleteMinorsPets.compile().sql,
  'delete from "pet" using "person" where "pet"."owner_id" = "person"."id" and "person"."age" < $1',
)
assert.equal((await deleteMinorsPets.executeTakeFirst()).numDeletedRows, 1n)

// DELETE with a join on MySQL: drizzle-orm #3100. Compiled only.
assert.equal(
  mysqlDb
    .deleteFrom('pet')
    .using('pet')
    .innerJoin('person', 'person.id', 'pet.owner_id')
    .where('person.age', '<', 18)
    .compile().sql,
  'delete from `pet` using `pet` inner join `person` on `person`.`id` = `pet`.`owner_id` where `person`.`age` < ?',
)

// MERGE: drizzle-orm #1298.
step('merge')
const merged = db
  .mergeInto('person as target')
  .using('person_source as source', 'source.id', 'target.id')
  .whenMatched()
  .thenUpdateSet((eb) => ({ first_name: eb.ref('source.first_name') }))
  .whenNotMatched()
  .thenInsertValues((eb) => ({
    id: eb.ref('source.id'),
    first_name: eb.ref('source.first_name'),
    age: eb.ref('source.age'),
  }))
assert.equal(
  merged.compile().sql,
  'merge into "person" as "target" using "person_source" as "source" on "source"."id" = "target"."id" when matched then update set "first_name" = "source"."first_name" when not matched then insert ("id", "first_name", "age") values ("source"."id", "source"."first_name", "source"."age")',
)
assert.equal((await merged.executeTakeFirst()).numChangedRows, 2n)
assert.deepEqual(
  await db
    .selectFrom('person')
    .select(['id', 'first_name'])
    .where('id', 'in', [1, 4])
    .orderBy('id')
    .execute(),
  [
    { id: 1, first_name: 'Jen' },
    { id: 4, first_name: 'Bruce' },
  ],
)

// coalesce: drizzle-orm #3708.
step('coalesce')
const ages = db
  .selectFrom('person')
  .select((eb) => eb.fn.coalesce('age', eb.lit(0)).as('age'))
  .where('id', '=', 3)
assert.equal(
  ages.compile().sql,
  'select coalesce("age", 0) as "age" from "person" where "id" = $1',
)
assert.deepEqual(await ages.execute(), [{ age: 0 }])

// Execution: streaming (#456), a transaction controlled by calls (#966),
// and the query duration in the log event (#2605).
step('stream')
// stream() is on every select builder; the PostgreSQL, MySQL, MSSQL, and
// SQLite dialects implement it, and PGlite's driver rejects it with a message.
const people = db.selectFrom('person').select('id').orderBy('id')
assert.equal(typeof people.stream, 'function')
await assert.rejects(
  (async () => {
    for await (const row of people.stream()) void row
  })(),
  /Streaming is not supported by PGlite/,
)

step('controlled transaction')
const trx = await db.startTransaction().execute()
try {
  await trx.insertInto('person').values({ id: 5, first_name: 'Trx' }).execute()
  const point = await trx.savepoint('after_trx').execute()
  await point
    .insertInto('person')
    .values({ id: 6, first_name: 'Gone' })
    .execute()
  await point.rollbackToSavepoint('after_trx').execute()
  await trx.commit().execute()
} catch (error) {
  await trx.rollback().execute()
  throw error
}
assert.deepEqual(
  await db.selectFrom('person').select('id').where('id', '>=', 5).execute(),
  [{ id: 5 }],
)

assert.ok(durations.length > 0)
assert.ok(durations.every((d) => typeof d === 'number' && d >= 0))

// Drizzle 0.45.4 and 1.0.0-rc.5: the same statements, by their builders.
step('drizzle')

for (const [label, exports] of [
  ['drizzle-orm 0.45.4', stable],
  ['drizzle-orm 1.0.0-rc.5', rc],
] as const) {
  for (const name of [
    'nullsFirst',
    'nullsLast',
    'isDistinctFrom',
    'coalesce',
  ]) {
    assert.equal(name in exports, false, `${label} exports ${name}`)
  }
  assert.equal('exists' in exports, true, `${label} has exists()`)
}

const stableBuilders = {
  client: drizzleDb,
  cte: drizzleDb
    .$with('t')
    .as(drizzleDb.select({ id: person.id }).from(person)),
  delete: drizzleDb.delete(pet),
  select: drizzleDb.select({ id: pet.id }).from(pet),
  mysqlDelete: drizzleMysql.delete(mysqlPet),
}
const rcBuilders = {
  client: rcDb,
  cte: rcDb.$with('t').as(rcDb.select({ id: rcPerson.id }).from(rcPerson)),
  delete: rcDb.delete(rcPet),
  select: rcDb.select({ id: rcPet.id }).from(rcPet),
  mysqlDelete: rcMysql.delete(rcMysqlPet),
}
for (const [label, b] of [
  ['drizzle-orm 0.45.4', stableBuilders],
  ['drizzle-orm 1.0.0-rc.5', rcBuilders],
] as const) {
  const absent = (object: object, names: string[], what: string) => {
    for (const name of names) {
      assert.equal(name in object, false, `${label} ${what}.${name}`)
    }
  }
  // No recursive CTE, no materialization option, no MERGE, no transaction
  // controlled by calls.
  absent(
    b.client,
    [
      '$withRecursive',
      'withRecursive',
      'merge',
      'mergeInto',
      'startTransaction',
      'beginTransaction',
    ],
    'db',
  )
  absent(b.cte, ['materialized', 'notMaterialized'], 'cte')
  // No USING on a PostgreSQL delete, no join or USING on a MySQL delete.
  absent(b.delete, ['using'], 'delete')
  absent(b.mysqlDelete, ['innerJoin', 'leftJoin', 'using'], 'mysql delete')
  // No streaming on the PostgreSQL select builder.
  absent(b.select, ['iterator', 'stream'], 'select')
}

// The logger receives the SQL text and its parameters, and nothing else.
assert.equal(stable.DefaultLogger.prototype.logQuery.length, 2)
assert.equal(rc.DefaultLogger.prototype.logQuery.length, 2)
const stableLogParams: Parameters<stable.Logger['logQuery']> extends [
  string,
  unknown[],
]
  ? true
  : false = true
const rcLogParams: Parameters<rc.Logger['logQuery']> extends [string, unknown[]]
  ? true
  : false = true
void stableLogParams
void rcLogParams

function compileChecks() {
  // @ts-expect-error inArray takes one column, not a row of columns.
  inArray([pet.id, pet.owner_id], [[1, 1]])
  // @ts-expect-error inArray takes one column, not a row of columns.
  rcInArray([rcPet.id, rcPet.owner_id], [[1, 1]])
  drizzleDb
    .insert(pet)
    .values({ id: 1, name: 'Catto', owner_id: 1 })
    // @ts-expect-error the conflict target is a column list; there is no constraint option.
    .onConflictDoNothing({ constraint: 'pet_pkey' })
  rcDb
    .insert(rcPet)
    .values({ id: 1, name: 'Catto', owner_id: 1 })
    // @ts-expect-error the conflict target is a column list; there is no constraint option.
    .onConflictDoNothing({ constraint: 'pet_pkey' })
  // @ts-expect-error a transaction takes a callback.
  drizzleDb.transaction()
  // @ts-expect-error a transaction takes a callback.
  rcDb.transaction()
  // @ts-expect-error the MySQL delete builder has no innerJoin.
  drizzleMysql.delete(mysqlPet).innerJoin()
  // @ts-expect-error the MySQL delete builder has no innerJoin.
  rcMysql.delete(rcMysqlPet).innerJoin()
}
void compileChecks

await db.destroy()
console.log(
  'PASS: recursive and materialized CTEs, row-value IN, NULLS LAST, IS DISTINCT FROM, ON CONFLICT ON CONSTRAINT, DELETE USING, MERGE, coalesce, and a transaction controlled by calls run through Kysely on PostgreSQL, stream() is on the builder; Drizzle 0.45.4 and 1.0.0-rc.5 have no builder for them',
)
