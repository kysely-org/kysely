import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { Kysely, PGliteDialect } from 'kysely'
import {
  and,
  count,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  ne,
  sql,
} from 'drizzle-stable'
import { alias, integer, pgTable, text } from 'drizzle-stable/pg-core'
import { drizzle } from 'drizzle-stable/pglite'
import {
  and as rcAnd,
  count as rcCount,
  eq as rcEq,
  gt as rcGt,
  gte as rcGte,
  inArray as rcInArray,
  isNull as rcIsNull,
  ne as rcNe,
  sql as rcSql,
} from 'drizzle-rc'
import {
  alias as rcAlias,
  integer as rcInteger,
  pgTable as rcTable,
  text as rcText,
} from 'drizzle-rc/pg-core'
import { drizzle as rcDrizzle } from 'drizzle-rc/pglite'

interface Database {
  person: { id: number; first_name: string; age: number | null }
  pet: { id: number; name: string; owner_id: number }
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

const pglite = new PGlite()
const db = new Kysely<Database>({ dialect: new PGliteDialect({ pglite }) })
const drizzleDb = drizzle(pglite)
const rcDb = rcDrizzle({ client: pglite })

const byNames = (
  a: { first_name: string; other_name: string },
  b: { first_name: string; other_name: string },
) =>
  `${a.first_name}:${a.other_name}`.localeCompare(
    `${b.first_name}:${b.other_name}`,
  )
const message = (error: any) => String(error?.cause?.message ?? error?.message)

// ---- A table alias, a derived table, and a CTE.

// Kysely: each is written where it is used, in one chain.
const kyselyPairs = () =>
  db
    .selectFrom('person')
    .innerJoin('person as other', 'other.age', 'person.age')
    .select(['person.first_name', 'other.first_name as other_name'])
    .execute()

const kyselyPetCounts = () =>
  db
    .selectFrom('person')
    .innerJoin(
      (eb) =>
        eb
          .selectFrom('pet')
          .select(['owner_id', (eb) => eb.fn.countAll<number>().as('pets')])
          .groupBy('owner_id')
          .as('pet_counts'),
      (join) => join.onRef('pet_counts.owner_id', '=', 'person.id'),
    )
    .select(['person.first_name', 'pet_counts.pets'])
    .orderBy('person.id')
    .execute()

const kyselyAdultPets = () =>
  db
    .with('adults', (qb) =>
      qb
        .selectFrom('person')
        .select(['id', 'first_name'])
        .where('age', '>=', 18),
    )
    .selectFrom('adults')
    .innerJoin('pet', 'pet.owner_id', 'adults.id')
    .select(['adults.first_name', 'pet.name'])
    .orderBy('pet.id')
    .execute()

// Drizzle: each is a declaration ahead of the query that uses it.
const other = alias(person, 'other')
const drizzlePairs = () =>
  drizzleDb
    .select({ first_name: person.first_name, other_name: other.first_name })
    .from(person)
    .innerJoin(other, eq(other.age, person.age))

const petCounts = drizzleDb
  .select({ owner_id: pet.owner_id, pets: count().as('pets') })
  .from(pet)
  .groupBy(pet.owner_id)
  .as('pet_counts')
const drizzlePetCounts = () =>
  drizzleDb
    .select({ first_name: person.first_name, pets: petCounts.pets })
    .from(person)
    .innerJoin(petCounts, eq(petCounts.owner_id, person.id))
    .orderBy(person.id)

const adults = drizzleDb
  .$with('adults')
  .as(
    drizzleDb
      .select({ id: person.id, first_name: person.first_name })
      .from(person)
      .where(gte(person.age, 18)),
  )
const drizzleAdultPets = () =>
  drizzleDb
    .with(adults)
    .select({ first_name: adults.first_name, name: pet.name })
    .from(adults)
    .innerJoin(pet, eq(pet.owner_id, adults.id))
    .orderBy(pet.id)

const rcOther = rcAlias(rcPerson, 'other')
const rcPairs = () =>
  rcDb
    .select({
      first_name: rcPerson.first_name,
      other_name: rcOther.first_name,
    })
    .from(rcPerson)
    .innerJoin(rcOther, rcEq(rcOther.age, rcPerson.age))

const rcPetCounts = rcDb
  .select({ owner_id: rcPet.owner_id, pets: rcCount().as('pets') })
  .from(rcPet)
  .groupBy(rcPet.owner_id)
  .as('pet_counts')
const rcPetCountRows = () =>
  rcDb
    .select({ first_name: rcPerson.first_name, pets: rcPetCounts.pets })
    .from(rcPerson)
    .innerJoin(rcPetCounts, rcEq(rcPetCounts.owner_id, rcPerson.id))
    .orderBy(rcPerson.id)

const rcAdults = rcDb
  .$with('adults')
  .as(
    rcDb
      .select({ id: rcPerson.id, first_name: rcPerson.first_name })
      .from(rcPerson)
      .where(rcGte(rcPerson.age, 18)),
  )
const rcAdultPets = () =>
  rcDb
    .with(rcAdults)
    .select({ first_name: rcAdults.first_name, name: rcPet.name })
    .from(rcAdults)
    .innerJoin(rcPet, rcEq(rcPet.owner_id, rcAdults.id))
    .orderBy(rcPet.id)

// Drizzle, written inline: a join condition cannot name the joined alias,
// because its callback receives the selection from before the join. Later
// callbacks do see it.
const inlineAlias = () =>
  drizzleDb
    .select()
    .from(pet)
    .innerJoin(alias(person, 'owner'), (aliases) => {
      // @ts-expect-error the joined alias is not in the callback's selection.
      void aliases.owner
      return sql`"owner"."id" = ${pet.owner_id}`
    })
    .where((selection) => eq(selection.owner.first_name, 'Jennifer'))
const rcInlineAlias = () =>
  rcDb
    .select()
    .from(rcPet)
    .innerJoin(rcAlias(rcPerson, 'owner'), (aliases) => {
      // @ts-expect-error the joined alias is not in the callback's selection.
      void aliases.owner
      return rcSql`"owner"."id" = ${rcPet.owner_id}`
    })
    .where((selection) => rcEq(selection.owner.first_name, 'Jennifer'))

// ---- A select alias in WHERE, HAVING, GROUP BY, and ORDER BY.

const kyselyAliases = db
  .selectFrom('person')
  .select((eb) => [
    eb.fn<string>('lower', ['first_name']).as('name'),
    eb.fn.countAll<number>().as('total'),
  ])

const lowered = sql<string>`lower(${person.first_name})`.as('name')
const total = count().as('total')
const whereCallback = () =>
  drizzleDb
    .select({ name: lowered })
    .from(person)
    .where((selection) => eq(selection.name, 'jennifer'))
const whereVariable = () =>
  drizzleDb
    .select({ name: lowered })
    .from(person)
    .where(eq(lowered, 'jennifer'))
const whereAggregate = () =>
  drizzleDb
    .select({ name: lowered, total })
    .from(person)
    .groupBy((selection) => selection.name)
    .where((selection) => gt(selection.total, 0))
const laterClauses = () =>
  drizzleDb
    .select({ name: lowered, total })
    .from(person)
    .groupBy((selection) => selection.name)
    .having((selection) => gt(selection.total, 0))
    .orderBy((selection) => selection.name)

const rcLowered = rcSql<string>`lower(${rcPerson.first_name})`.as('name')
const rcTotal = rcCount().as('total')
const rcWhereCallback = () =>
  rcDb
    .select({ name: rcLowered })
    .from(rcPerson)
    .where((selection) => rcEq(selection.name, 'jennifer'))
const rcWhereVariable = () =>
  rcDb
    .select({ name: rcLowered })
    .from(rcPerson)
    .where(rcEq(rcLowered, 'jennifer'))
const rcWhereAggregate = () =>
  rcDb
    .select({ name: rcLowered, total: rcTotal })
    .from(rcPerson)
    .groupBy((selection) => selection.name)
    .where((selection) => rcGt(selection.total, 0))
const rcLaterClauses = () =>
  rcDb
    .select({ name: rcLowered, total: rcTotal })
    .from(rcPerson)
    .groupBy((selection) => selection.name)
    .having((selection) => rcGt(selection.total, 0))
    .orderBy((selection) => selection.name)

// ---- SQL's operators under Drizzle's names, and under their own in Kysely.

const renamed = () =>
  drizzleDb
    .select({ id: person.id })
    .from(person)
    .where(and(inArray(person.id, [1, 2]), ne(person.id, 2)))
    .orderBy(isNull(person.age))
const rcRenamed = () =>
  rcDb
    .select({ id: rcPerson.id })
    .from(rcPerson)
    .where(rcAnd(rcInArray(rcPerson.id, [1, 2]), rcNe(rcPerson.id, 2)))
    .orderBy(rcIsNull(rcPerson.age))
const kyselyOperators = db
  .selectFrom('person')
  .select('id')
  .where('id', 'in', [1, 2])
  .where('id', '<>', 2)
  .orderBy((eb) => eb('age', 'is', null))

function compileChecks() {
  // @ts-expect-error a select alias is not in scope for where.
  kyselyAliases.where('name', '=', 'jennifer')
  // @ts-expect-error a select alias is not in scope for where.
  kyselyAliases.where('total', '>', 0)
  // @ts-expect-error a select alias is not in scope for having.
  kyselyAliases.groupBy('name').having('total', '>', 0)

  // @ts-expect-error from() has no string form for a CTE's name.
  drizzleDb.with(adults).select().from('adults')
  // @ts-expect-error from() has no string form for a CTE's name.
  rcDb.with(rcAdults).select().from('adults')
}
void compileChecks

try {
  await pglite.exec(`
    create table person (id integer not null, first_name text not null, age integer);
    create table pet (id integer not null, name text not null, owner_id integer not null);
    insert into person values (1, 'Jennifer', 54), (2, 'Arnold', 54), (3, 'Sylvester', 12);
    insert into pet values (1, 'Catto', 1), (2, 'Doggo', 2), (3, 'Hammo', 3);
  `)

  const pairs = (await kyselyPairs()).sort(byNames)
  assert.equal(pairs.length, 5)
  assert.deepEqual((await drizzlePairs()).sort(byNames), pairs)
  assert.deepEqual((await rcPairs()).sort(byNames), pairs)

  const counts = await kyselyPetCounts()
  assert.deepEqual(counts, [
    { first_name: 'Jennifer', pets: 1 },
    { first_name: 'Arnold', pets: 1 },
    { first_name: 'Sylvester', pets: 1 },
  ])
  assert.deepEqual(await drizzlePetCounts(), counts)
  assert.deepEqual(await rcPetCountRows(), counts)

  const adultPets = await kyselyAdultPets()
  assert.deepEqual(adultPets, [
    { first_name: 'Jennifer', name: 'Catto' },
    { first_name: 'Arnold', name: 'Doggo' },
  ])
  assert.deepEqual(await drizzleAdultPets(), adultPets)
  assert.deepEqual(await rcAdultPets(), adultPets)

  for (const rows of [await inlineAlias(), await rcInlineAlias()]) {
    assert.equal(rows.length, 1)
    assert.equal(rows[0]!.owner.first_name, 'Jennifer')
    assert.equal(rows[0]!.pet.name, 'Catto')
  }

  // PostgreSQL: a select alias is visible to GROUP BY and ORDER BY only.
  await assert.rejects(
    pglite.query(
      "select lower(first_name) as name from person where name = 'jennifer'",
    ),
    /column "name" does not exist/,
  )
  await assert.rejects(
    pglite.query(
      'select lower(first_name) as name, count(*) as total from person group by name having total > 0',
    ),
    /column "total" does not exist/,
  )

  // Kysely: the same alias in GROUP BY and ORDER BY compiles and runs.
  assert.deepEqual(
    await kyselyAliases.groupBy('name').orderBy('name').execute(),
    [
      { name: 'arnold', total: 1 },
      { name: 'jennifer', total: 1 },
      { name: 'sylvester', total: 1 },
    ],
  )

  // Drizzle: every form compiles. Through the callback, where() repeats the
  // expression and the query runs.
  for (const build of [whereCallback, rcWhereCallback]) {
    assert.match(
      build().toSQL().sql,
      /where lower\("person"\."first_name"\) = \$1$/,
    )
    assert.deepEqual(await build(), [{ name: 'jennifer' }])
  }
  // The same aliased expression passed to where() is sent as its alias.
  for (const build of [whereVariable, rcWhereVariable]) {
    assert.match(build().toSQL().sql, /where "name" = \$1$/)
    await assert.rejects(
      async () => await build(),
      (error) => /column "name" does not exist/.test(message(error)),
    )
  }
  // An aggregate alias through the callback puts the aggregate in WHERE.
  for (const build of [whereAggregate, rcWhereAggregate]) {
    assert.match(build().toSQL().sql, /where count\(\*\) > \$1/)
    await assert.rejects(
      async () => await build(),
      (error) =>
        /aggregate functions are not allowed in WHERE/.test(message(error)),
    )
  }
  for (const build of [laterClauses, rcLaterClauses]) {
    assert.match(
      build().toSQL().sql,
      /group by "name" having count\(\*\) > \$1 order by "name"$/,
    )
    assert.equal((await build()).length, 3)
  }

  for (const build of [renamed, rcRenamed]) {
    const text = build().toSQL().sql
    assert.match(text, /"person"\."id" in \(\$1, \$2\)/)
    assert.match(text, /"person"\."id" <> \$3/)
    assert.match(text, /order by \(?"person"\."age" is null\)?$/)
    assert.deepEqual(await build(), [{ id: 1 }])
  }
  assert.match(
    kyselyOperators.compile().sql,
    /where "id" in \(\$1, \$2\) and "id" <> \$3 order by "age" is null$/,
  )
  assert.deepEqual(await kyselyOperators.execute(), [{ id: 1 }])

  console.log(
    'PASS: Kysely writes a table alias, a derived table, and a CTE inside one chain; Drizzle stable/RC declare each as a variable first, return the same rows, and cannot name an inline alias in its join condition. A select alias in WHERE or HAVING is a Kysely type error, as PostgreSQL rejects it; Drizzle compiles it, repeats the expression through the where() callback, and sends the bare alias or an aggregate in WHERE otherwise, which PostgreSQL rejects. The inArray, ne, and isNull functions of Drizzle stable/RC emit IN, <>, and IS NULL, the operators Kysely takes as written',
  )
} finally {
  await db.destroy()
}
