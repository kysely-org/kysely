import assert from 'node:assert/strict'
import { sql } from 'kysely'
import { FindOperator, QueryFailedError, Raw } from '#typeorm-under-test'
import { connect, isLegacy, Person, Pet, typeormVersion } from './_setup.mts'

const { db, dataSource, queries, cleanup } = await connect()
const people = () => dataSource.getRepository(Person).createQueryBuilder('person')
const pets = () => dataSource.getRepository(Pet).createQueryBuilder('pet')
const flat = (statement: string) =>
  statement.replace(/\s+/g, ' ').replace(/"typeorm_comparison_\w+"\./g, '')
const names = (rows: { first_name: string }[]) => rows.map((row) => row.first_name)

// setFindOptions() brings typed find options into the builder.
assert.deepEqual(
  names(await people().setFindOptions({ where: { first_name: 'Ada' } }).getMany()),
  ['Ada'],
)
export function typedFindOptions() {
  // @ts-expect-error a misspelled property is a type error
  people().setFindOptions({ where: { first_nam: 'Ada' } })
  // @ts-expect-error a string for an integer property is a type error
  people().setFindOptions({ where: { age: 'old' } })
}

// The typed path takes a closed set of operators; anything else is Raw() text.
await assert.rejects(
  dataSource
    .getRepository(Person)
    .find({ where: { first_name: new FindOperator('regex' as never, '^A') } }),
  (error: Error) => error instanceof TypeError && /Unsupported FindOperator/.test(error.message),
)
assert.deepEqual(
  names(
    await dataSource.getRepository(Person).find({
      where: { first_name: Raw((alias) => `${alias} ~ :pattern`, { pattern: '^A' }) },
      order: { id: 'ASC' },
    }),
  ),
  ['Arnold', 'Ada'],
)
await assert.rejects(
  dataSource.getRepository(Person).find({
    where: { first_name: Raw(() => `first_nam ~ :pattern`, { pattern: '^A' }) },
  }),
  (error: { code?: string }) => error.code === '42703',
)
assert.deepEqual(
  await db
    .selectFrom('person')
    .select('first_name')
    .where('first_name', '~', '^A')
    .orderBy('id')
    .execute(),
  [{ first_name: 'Arnold' }, { first_name: 'Ada' }],
)
assert.deepEqual(
  await db
    .selectFrom('person')
    .select('first_name')
    .where('first_name', sql`~*`, '^a')
    .orderBy('id')
    .execute(),
  [{ first_name: 'Arnold' }, { first_name: 'Ada' }],
)
export function templateOperator() {
  // @ts-expect-error a misspelled column is a type error with a template operator too
  db.selectFrom('person').select('first_name').where('first_nam', sql`~*`, '^a')
}

// A second select(), orderBy(), groupBy(), or having() replaces the first.
assert.match(
  flat(people().select('person.id', 'id').select('person.first_name', 'name').getSql()),
  /^SELECT "person"\."first_name" AS "name" FROM/,
)
assert.match(
  flat(people().select('person.id', 'id').orderBy('person.age').orderBy('person.first_name').getSql()),
  /ORDER BY "person"\."first_name" ASC$/,
)
assert.match(
  flat(people().select('person.age', 'age').groupBy('person.age').groupBy('person.first_name').getSql()),
  /GROUP BY "person"\."first_name"$/,
)
// A second having() is appended with no AND, and PostgreSQL rejects the statement.
const doubleHaving = people()
  .select('person.age', 'age')
  .groupBy('person.age')
  .having('count(*) > 0')
  .having('person.age > 18')
assert.match(flat(doubleHaving.getSql()), /HAVING count\(\*\) > 0 "person"\."age" > 18$/)
await assert.rejects(doubleHaving.getRawMany(), (error: { code?: string }) => error.code === '42601')
assert.equal(
  db
    .selectFrom('person')
    .select('id')
    .select('first_name')
    .groupBy('age')
    .groupBy('first_name')
    .having('age', '>', 18)
    .having('first_name', '!=', '')
    .orderBy('age')
    .orderBy('first_name')
    .compile().sql,
  'select "id", "first_name" from "person" group by "age", "first_name" having "age" > $1 and "first_name" != $2 order by "age", "first_name"',
)

// Conditions are joined as text, without parentheses.
const ownedPets = () =>
  pets().select('pet.name', 'name').where('pet.owner_id = :ownerId', { ownerId: 1 })
const leaked = ownedPets().andWhere("pet.name = 'Kitty' OR pet.name = 'Parrot'")
assert.match(flat(leaked.getSql()), /WHERE "pet"\."owner_id" = \$1 AND "pet"\."name" = 'Kitty' OR "pet"\."name" = 'Parrot'$/)
assert.deepEqual(await leaked.getRawMany(), [{ name: 'Parrot' }])
const stacked = ownedPets().orWhere('pet.name = :name', { name: 'Kitty' }).andWhere('pet.id > 0')
assert.match(flat(stacked.getSql()), /WHERE "pet"\."owner_id" = \$1 OR "pet"\."name" = \$2 AND "pet"\."id" > 0$/)
// Kysely's sql template is spliced the same way; eb.or() adds the parentheses.
const kyselyOwned = () => db.selectFrom('pet').select('name').where('owner_id', '=', 1)
const kyselyLeaked = kyselyOwned().where(sql<boolean>`name = 'Kitty' or name = 'Parrot'`)
assert.equal(
  kyselyLeaked.compile().sql,
  `select "name" from "pet" where "owner_id" = $1 and name = 'Kitty' or name = 'Parrot'`,
)
assert.deepEqual(await kyselyLeaked.execute(), [{ name: 'Parrot' }])
const kyselyScoped = kyselyOwned().where((eb) =>
  eb.or([eb('name', '=', 'Kitty'), eb('name', '=', 'Parrot')]),
)
assert.equal(
  kyselyScoped.compile().sql,
  'select "name" from "pet" where "owner_id" = $1 and ("name" = $2 or "name" = $3)',
)
assert.deepEqual(await kyselyScoped.execute(), [])

// Ordered by a joined column, take() and skip() page over distinct (person, pet name) pairs.
const page = (index: number) =>
  people()
    .leftJoinAndSelect('person.pets', 'pet')
    .orderBy('pet.name')
    .skip(index)
    .take(1)
    .getMany()
const pages: string[][] = []
for (let index = 0; index < 5; index++) pages.push(names(await page(index)))
assert.deepEqual(pages, [['Jennifer'], ['Jennifer'], ['Arnold'], ['Ada'], ['Sylvester']])
assert.equal(await people().leftJoinAndSelect('person.pets', 'pet').getCount(), 4)
queries.length = 0
assert.deepEqual(
  names(await people().leftJoinAndSelect('person.pets', 'pet').orderBy('pet.name').take(2).getMany()),
  ['Jennifer'],
)
assert.match(flat(queries[0]!), /^SELECT DISTINCT "distinctAlias"\."person_id" AS "ids_person_id", "distinctAlias"\."pet_name" FROM/)

// A filter on a joined relation trims the hydrated collection.
const [jennifer, ...others] = await people()
  .leftJoinAndSelect('person.pets', 'pet')
  .where('pet.name = :name', { name: 'Catto' })
  .getMany()
assert.equal(others.length, 0)
assert.deepEqual(jennifer!.pets.map((pet) => pet.name), ['Catto'])

// An undefined find value drops the condition on 0.3.x and throws on 1.x by default.
const undefinedAge = dataSource.getRepository(Person).find({ where: { age: undefined } })
if (isLegacy) assert.equal((await undefinedAge).length, 4)
else await assert.rejects(undefinedAge, /undefined/i)

// getManyAndCount() sends the page and the total as separate statements.
queries.length = 0
const [first, total] = await people().orderBy('person.id').take(1).getManyAndCount()
assert.deepEqual([names(first), total], [['Jennifer'], 4])
assert.equal(queries.length, 2)
queries.length = 0
await people().leftJoinAndSelect('person.pets', 'pet').orderBy('person.id').take(1).getManyAndCount()
assert.equal(queries.length, 3)
assert.match(flat(queries[2]!), /^SELECT COUNT\(DISTINCT\("person"\."id"\)\) AS "cnt"/)
// Kysely reads the page and the total in one statement.
const kyselyPage = db
  .selectFrom('person')
  .select((eb) => ['first_name', eb.fn.countAll().over().as('total')])
  .orderBy('id')
  .limit(1)
assert.equal(
  kyselyPage.compile().sql,
  'select "first_name", count(*) over() as "total" from "person" order by "id" limit $1',
)
assert.deepEqual(await kyselyPage.execute(), [{ first_name: 'Jennifer', total: '4' }])

// Kysely's modifiers write a query comment.
assert.equal(
  db.selectFrom('person').select('id').modifyEnd(sql`/* trace=abc */`).compile().sql,
  'select "id" from "person" /* trace=abc */',
)

// QueryFailedError carries the statement and every bound value as enumerable properties.
const email = 'jane@example.com'
const failure = await people()
  .select('nope.x')
  .where('person.first_name = :email', { email })
  .getRawMany()
  .catch((error) => error)
assert(failure instanceof QueryFailedError)
assert.match(failure.query, /WHERE "person"\."first_name" = \$1$/)
assert.deepEqual(failure.parameters, [email])
assert.deepEqual(Object.keys(failure).slice(0, 3), ['query', 'parameters', 'driverError'])
assert.match(JSON.stringify(failure), /jane@example\.com/)
// Kysely passes the driver's error through, which carries no bound values.
const kyselyFailure = await db
  .selectFrom('person')
  .select(sql`nope.x`.as('x'))
  .where('first_name', '=', email)
  .execute()
  .catch((error) => error)
assert.equal(kyselyFailure.code, '42P01')
assert(!('query' in kyselyFailure) && !('parameters' in kyselyFailure))
assert.doesNotMatch(JSON.stringify(kyselyFailure), /jane@example\.com/)
// PostgreSQL's own detail names the conflicting key, in both libraries.
const duplicate = await db
  .insertInto('person')
  .values({ id: 1, first_name: 'Again', age: null })
  .execute()
  .catch((error) => error)
assert.equal(duplicate.code, '23505')
assert.equal(duplicate.detail, 'Key (id)=(1) already exists.')

await cleanup()
console.log(
  `PASS (TypeORM ${typeormVersion}): typed find options in the builder through setFindOptions(), a closed operator set with Raw() text for the rest, select/orderBy/groupBy replacing earlier calls and a second having() appended without AND (42601) where Kysely appends, string conditions joined without parentheses leaking past an owner filter (Kysely's sql template too, eb.or() parenthesizing), take()/skip() ordered by a joined column repeating a person across pages, a joined filter trimming a hydrated collection, an undefined find value ${isLegacy ? 'dropping the condition' : 'throwing'}, getManyAndCount() sending two statements (three with a join) where Kysely's count(*) over() is one, Kysely's modifyEnd() comment, and QueryFailedError carrying every bound value as enumerable properties where Kysely passes the driver error through`,
)
