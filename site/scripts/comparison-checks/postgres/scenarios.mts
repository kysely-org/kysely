import assert from 'node:assert/strict'
import { Pool } from 'pg'
import knexFactory from 'knex'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Prisma } from './generated/client.ts'
import { Kysely, PostgresDialect } from 'kysely'
import type { InferResult } from 'kysely'

// DOC:database
interface Database {
  author: {
    id: number
    name: string
    organization_id: number
    active: boolean
    article_target: number
  }
  article: { id: number; author_id: number; published_at: Date | null }
  page: { id: number; title: string; parent_id: number | null }
  page_access: { page_id: number; user_id: number; level: string }
  person: { id: number; first_name: string; age: number | null }
  pet: { id: number; name: string; owner_id: number }
}
// END:database

declare module 'knex/types/tables.js' {
  interface Tables {
    person: Database['person']
    pet: Database['pet']
  }
}

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false
type Expect<T extends true> = T
type IsAny<T> = 0 extends 1 & T ? true : false

const connectionString = process.env.COMPARISON_DATABASE_URL!
assert(
  connectionString,
  'Set COMPARISON_DATABASE_URL to a disposable PostgreSQL server',
)
const schema = `seo_comparisons_${Date.now()}`
const admin = new Pool({ connectionString })
await admin.query(`create schema "${schema}"`)
const pool = new Pool({ connectionString, options: `-c search_path=${schema}` })
const db = new Kysely<Database>({ dialect: new PostgresDialect({ pool }) })
const prisma = new PrismaClient({
  adapter: new PrismaPg(
    { connectionString, options: `-c search_path=${schema}` },
    { schema },
  ),
})
const knex = knexFactory({
  client: 'pg',
  connection: connectionString,
  searchPath: [schema],
})

// DOC:prisma-leaderboard
async function prismaLeaderboard(options: {
  organizationId: number
  since: Date
  minArticles: number
}) {
  const groups = await prisma.article.groupBy({
    by: ['authorId'],
    where: {
      publishedAt: { gte: options.since },
      author: { organizationId: options.organizationId, active: true },
    },
    _count: { id: true },
    having: { id: { _count: { gte: options.minArticles } } },
    orderBy: [{ _count: { id: 'desc' } }, { authorId: 'asc' }],
    take: 20,
  })

  const authors = await prisma.author.findMany({
    where: { id: { in: groups.map((group) => group.authorId) } },
    select: { id: true, name: true },
  })
  const names = new Map(authors.map((author) => [author.id, author.name]))

  return groups.map((group) => ({
    author_id: group.authorId,
    name: names.get(group.authorId)!,
    article_count: group._count.id,
  }))
}
// END:prisma-leaderboard

// DOC:kysely-activity
function authorActivity(organizationId: number, since: Date) {
  return db
    .selectFrom('author')
    .innerJoin('article', 'article.author_id', 'author.id')
    .select(['author.id as author_id', 'author.name'])
    .select((eb) =>
      eb.cast<number>(eb.fn.count('article.id'), 'integer').as('article_count'),
    )
    .where('author.organization_id', '=', organizationId)
    .where('author.active', '=', true)
    .where('article.published_at', '>=', since)
    .groupBy(['author.id', 'author.name', 'author.article_target'])
}
// END:kysely-activity

// DOC:kysely-global-threshold
function kyselyLeaderboard(options: {
  organizationId: number
  since: Date
  minArticles: number
}) {
  return authorActivity(options.organizationId, options.since)
    .having((eb) => eb.fn.count('article.id'), '>=', options.minArticles)
    .orderBy('article_count', 'desc')
    .orderBy('author.id')
    .limit(20)
    .execute()
}
// END:kysely-global-threshold

// DOC:kysely-per-author-threshold
function authorsMeetingTheirTarget(organizationId: number, since: Date) {
  return authorActivity(organizationId, since)
    .having((eb) =>
      eb(eb.fn.count('article.id'), '>=', eb.ref('author.article_target')),
    )
    .orderBy('article_count', 'desc')
    .orderBy('author.id')
    .limit(20)
    .execute()
}
// END:kysely-per-author-threshold

// DOC:kysely-nearest-permission
function nearestPermission(pageId: number, userId: number) {
  return db
    .withRecursive('ancestors', (qb) =>
      qb
        .selectFrom('page')
        .select(['id', 'parent_id'])
        .select((eb) => eb.lit<number>(0).as('depth'))
        .where('id', '=', pageId)
        .unionAll((eb) =>
          eb
            .selectFrom('page as parent')
            .innerJoin('ancestors', 'ancestors.parent_id', 'parent.id')
            .select(['parent.id', 'parent.parent_id'])
            .select((eb) => eb('ancestors.depth', '+', 1).as('depth')),
        ),
    )
    .selectFrom('ancestors')
    .innerJoin('page_access', 'page_access.page_id', 'ancestors.id')
    .select(['ancestors.id as page_id', 'page_access.level', 'ancestors.depth'])
    .where('page_access.user_id', '=', userId)
    .orderBy('ancestors.depth')
    .limit(1)
    .executeTakeFirst()
}
// END:kysely-nearest-permission

// DOC:prisma-nearest-permission
async function nearestPermissionWithSql(pageId: number, userId: number) {
  const rows = await prisma.$queryRaw<
    { page_id: number; level: string; depth: number }[]
  >`
    with recursive ancestors as (
      select id, parent_id, 0 as depth
      from page
      where id = ${pageId}
      union all
      select parent.id, parent.parent_id, ancestors.depth + 1
      from page as parent
      inner join ancestors on ancestors.parent_id = parent.id
    )
    select ancestors.id as page_id, page_access.level, ancestors.depth
    from ancestors
    inner join page_access on page_access.page_id = ancestors.id
    where page_access.user_id = ${userId}
    order by ancestors.depth
    limit 1
  `
  return rows.at(0)
}
// END:prisma-nearest-permission

// DOC:knex-joined-query
const knexJoined = knex('person')
  .innerJoin('pet', 'pet.owner_id', 'person.id')
  .select('person.first_name', 'pet.name as pet_name')
  .where('person.age', '>=', 18)
  .orderBy('person.first_name')
// END:knex-joined-query

// DOC:kysely-joined-query
const kyselyJoined = db
  .selectFrom('person')
  .innerJoin('pet', 'pet.owner_id', 'person.id')
  .select(['person.first_name', 'pet.name as pet_name'])
  .where('person.age', '>=', 18)
  .orderBy('person.first_name')
// END:kysely-joined-query

type CheckedLeaderboard = Expect<
  Equal<
    Awaited<ReturnType<typeof kyselyLeaderboard>>,
    { author_id: number; name: string; article_count: number }[]
  >
>
type CheckedPermission = Expect<
  Equal<
    Awaited<ReturnType<typeof nearestPermission>>,
    { page_id: number; level: string; depth: number } | undefined
  >
>
type CheckedRawPermission = Expect<
  Equal<
    Awaited<ReturnType<typeof nearestPermissionWithSql>>,
    Awaited<ReturnType<typeof nearestPermission>>
  >
>
type CheckedJoined = Expect<
  Equal<
    InferResult<typeof kyselyJoined>,
    { first_name: string; pet_name: string }[]
  >
>
type KnexQualifiedRowIsAny = Expect<IsAny<Awaited<typeof knexJoined>[number]>>
const knexBasic = knex('person').select('id', 'first_name')
type KnexRegisteredTableWorks = Expect<
  Equal<Awaited<typeof knexBasic>[number], { id: number; first_name: string }>
>

const missingJoin = knex('person').select('id').where('pet.name', '=', 'Catto')
const misspelledColumn = knex('person')
  .select('id')
  .where('first_nam', '=', 'Jennifer')
const wrongAlias = knex('person as p')
  .select('p.id')
  .where('person.first_name', '=', 'Jennifer')

if (false) {
  // @ts-expect-error An unjoined table is outside the query scope.
  db.selectFrom('person').select('id').where('pet.name', '=', 'Catto')
  // @ts-expect-error The column does not exist.
  db.selectFrom('person').select('id').where('first_nam', '=', 'Jennifer')
  db.selectFrom('person as p')
    .select('p.id')
    // @ts-expect-error The table is known as p after aliasing.
    .where('person.first_name', '=', 'Jennifer')
  prisma.author.findMany({
    where: {
      // @ts-expect-error Relation-list filters do not support aggregate count thresholds.
      articles: { _count: { gte: 2 } },
    },
  })
  prisma.author.findMany({
    // @ts-expect-error Relation count ordering takes a direction, not a filtered count.
    orderBy: {
      articles: {
        _count: { sort: 'desc', where: { publishedAt: { gte: new Date() } } },
      },
    },
  })
  prisma.article.groupBy({
    by: ['authorId'],
    having: {
      id: {
        _count: {
          // @ts-expect-error Article aggregate filters cannot reference an Author field.
          gte: prisma.author.fields.articleTarget,
        },
      },
    },
  })
}

try {
  await pool.query(`
    create table author (id integer primary key, name text not null, organization_id integer not null, active boolean not null, article_target integer not null);
    create table article (id integer primary key, author_id integer not null references author(id), published_at timestamptz);
    create table page (id integer primary key, title text not null, parent_id integer references page(id));
    create table page_access (page_id integer references page(id), user_id integer, level text not null, primary key (page_id, user_id));
    create table person (id integer primary key, first_name text not null, age integer);
    create table pet (id integer primary key, name text not null, owner_id integer not null references person(id));
    insert into author values (1,'Ada',1,true,4),(2,'Grace',1,true,1),(3,'Inactive',1,false,1),(4,'Elsewhere',2,true,1),(5,'Don',1,true,3);
    insert into article values
      (1,1,'2026-10-01'),(2,1,'2026-10-02'),(3,1,'2026-10-03'),(4,1,'2025-01-01'),(5,1,null),
      (6,2,'2026-10-01'),(7,2,'2026-10-02'),(8,3,'2026-10-01'),(9,3,'2026-10-02'),
      (10,4,'2026-10-01'),(11,4,'2026-10-02'),(12,5,'2026-10-01'),(13,5,'2026-10-02');
    insert into page values (1,'Root',null),(2,'Second',1),(3,'Third',2),(4,'Fourth',3),(5,'Leaf',4);
    insert into page_access values (1,7,'edit'),(3,7,'view'),(4,8,'edit');
    insert into person values (1,'Jennifer',18),(2,'Arnold',17),(3,'Sylvester',null);
    insert into pet values (1,'Catto',1),(2,'Doggo',2);
  `)
  assert.deepEqual(
    await prisma.page.findUniqueOrThrow({
      where: { id: 5 },
      select: {
        id: true,
        title: true,
        parent: { select: { id: true, title: true } },
      },
    }),
    { id: 5, title: 'Leaf', parent: { id: 4, title: 'Fourth' } },
  )
  // Prisma raw SQL is intentionally unqualified in the published example.
  // Configure its connections' search_path just as db and knex are configured.
  const options = {
    organizationId: 1,
    since: new Date('2026-01-01T00:00:00Z'),
    minArticles: 2,
  }
  const expected = [
    { author_id: 1, name: 'Ada', article_count: 3 },
    { author_id: 2, name: 'Grace', article_count: 2 },
    { author_id: 5, name: 'Don', article_count: 2 },
  ]
  const filteredRelationCounts = await prisma.author.findMany({
    where: { organizationId: 1, active: true },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          articles: { where: { publishedAt: { gte: options.since } } },
        },
      },
    },
    orderBy: { id: 'asc' },
  })
  assert.deepEqual(filteredRelationCounts, [
    { id: 1, name: 'Ada', _count: { articles: 3 } },
    { id: 2, name: 'Grace', _count: { articles: 2 } },
    { id: 5, name: 'Don', _count: { articles: 2 } },
  ])
  assert.deepEqual(await prismaLeaderboard(options), expected)
  assert.deepEqual(await kyselyLeaderboard(options), expected)
  assert.deepEqual(await authorsMeetingTheirTarget(1, options.since), [
    { author_id: 2, name: 'Grace', article_count: 2 },
  ])
  assert.deepEqual(await prismaLeaderboard({ ...options, minArticles: 4 }), [])
  assert.deepEqual(await kyselyLeaderboard({ ...options, minArticles: 4 }), [])
  await pool.query(`
    insert into author select 100 + g, 'Below target ' || g, 1, true, 99 from generate_series(1,24) g;
    insert into article select 1000 + g * 10 + n, 100 + g, '2026-10-01'::timestamptz from generate_series(1,24) g cross join generate_series(1,3) n;
  `)
  assert.deepEqual(await authorsMeetingTheirTarget(1, options.since), [
    { author_id: 2, name: 'Grace', article_count: 2 },
  ])
  const sqlTargets = await prisma.$queryRaw<
    { author_id: number; name: string; article_count: number }[]
  >(Prisma.sql`
    select author.id as author_id, author.name, count(article.id)::integer as article_count
    from author inner join article on article.author_id=author.id
    where author.organization_id=${1} and author.active=true and article.published_at>=${options.since}
    group by author.id,author.name,author.article_target
    having count(article.id)>=author.article_target
    order by article_count desc,author.id limit 20
  `)
  assert.deepEqual(
    sqlTargets,
    await authorsMeetingTheirTarget(1, options.since),
  )
  const globalTop20 = await prismaLeaderboard(options)
  assert.equal(globalTop20.length, 20)
  assert(
    !globalTop20.some((author) => author.author_id === 2),
    'Filtering the first global page cannot recover the qualifying author below it',
  )
  for (const [pageId, userId, expected] of [
    [5, 7, { page_id: 3, level: 'view', depth: 2 }],
    [5, 8, { page_id: 4, level: 'edit', depth: 1 }],
    [2, 7, { page_id: 1, level: 'edit', depth: 1 }],
    [1, 7, { page_id: 1, level: 'edit', depth: 0 }],
    [5, 9, undefined],
  ] as const) {
    assert.deepEqual(await nearestPermission(pageId, userId), expected)
    assert.deepEqual(await nearestPermissionWithSql(pageId, userId), expected)
  }
  assert.deepEqual(await knexJoined, [
    { first_name: 'Jennifer', pet_name: 'Catto' },
  ])
  assert.deepEqual(await kyselyJoined.execute(), [
    { first_name: 'Jennifer', pet_name: 'Catto' },
  ])
  await assert.rejects(async () => await missingJoin, /missing FROM-clause/)
  await assert.rejects(
    async () => await misspelledColumn,
    /column .* does not exist/,
  )
  await assert.rejects(
    async () => await wrongAlias,
    /invalid reference to FROM-clause entry/,
  )
  const knexBase = knex('person').where('age', '>=', 18)
  const knexJennifer = knexBase.where('first_name', '=', 'Jennifer')
  assert(knexBase.toSQL().sql.includes('first_name'))
  const kyselyBase = db.selectFrom('person').where('age', '>=', 18)
  const kyselyJennifer = kyselyBase.where('first_name', '=', 'Jennifer')
  assert(!kyselyBase.compile().sql.includes('first_name'))
  assert(kyselyJennifer.compile().sql.includes('first_name'))
  const clonedBase = knex('person').where('age', '>=', 18)
  const clonedNamed = clonedBase.clone().where('first_name', '=', 'Jennifer')
  assert(!clonedBase.toSQL().sql.includes('first_name'))
  assert(clonedNamed.toSQL().sql.includes('first_name'))
  let asyncExecutionCount = 0
  const trackQuery = () => {
    asyncExecutionCount++
  }
  knex.on('query', trackQuery)
  async function adultQuery() {
    return knex('person').select('id').where('age', '>=', 18)
  }
  const executedRows = await adultQuery()
  assert.deepEqual(executedRows, [{ id: 1 }])
  assert.equal(asyncExecutionCount, 1)
  knex.removeListener('query', trackQuery)
  async function kyselyAdultQuery() {
    return db.selectFrom('person').select('id').where('age', '>=', 18)
  }
  const unexecuted = await kyselyAdultQuery()
  assert.equal(typeof unexecuted.compile, 'function')
  assert.deepEqual(
    await unexecuted.where('first_name', '=', 'Jennifer').execute(),
    [{ id: 1 }],
  )
  assert.match(knex('person').first().toSQL().sql, /limit/)
  const takeFirst = db.selectFrom('person').select('id')
  assert(!takeFirst.compile().sql.includes('limit'))
  assert.deepEqual(await takeFirst.executeTakeFirst(), { id: 1 })
  assert.deepEqual(
    await db
      .selectFrom('person')
      .select('id')
      .where('id', '=', -1)
      .executeTakeFirst(),
    undefined,
  )
  await assert.rejects(
    db
      .selectFrom('person')
      .select('id')
      .where('id', '=', -1)
      .executeTakeFirstOrThrow(),
  )
  const untypedDb = db as Kysely<any>
  assert.deepEqual(
    await untypedDb
      .selectFrom('person')
      .select(['id', 'first_name'])
      .where('age', '>=', 18)
      .execute(),
    [{ id: 1, first_name: 'Jennifer' }],
  )
  console.log(
    'PASS: Prisma filtered relation counts work; aggregate relation filters/filtered ordering are rejected by types; Prisma.sql reproduces per-author results; Knex async helpers execute; Kysely async helpers remain composable; explicit first-row/limit behavior verified',
  )
  console.log(
    'PASS: Prisma 7.10.1 and Kysely leaderboard equivalence; per-author target change; recursive permission lookup at multiple depths and missing rules; typed Knex 3.3.0 inference/scope gaps; immutable base query',
  )
} finally {
  await prisma.$disconnect()
  await knex.destroy()
  await db.destroy()
  await admin.query(`drop schema "${schema}" cascade`)
  await admin.end()
}
