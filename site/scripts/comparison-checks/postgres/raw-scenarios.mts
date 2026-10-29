import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'
import postgres from 'postgres'
import { createPool, sql as slonikSql } from 'slonik'
import { createPgDriverFactory } from '@slonik/pg-driver'
import { z } from 'zod'
import { PrismaPg } from '@prisma/adapter-pg'
import type { Prisma } from './generated/client.ts'
import type { findAssetsWithTags as TagsQuery } from './generated/sql/findAssetsWithTags.ts'
// PgTyped and sqlc output is generated before the type checks run: PgTyped
// inside this program once the fixture tables exist, sqlc by verify.mjs.
import type {
  IFindAssetsParams,
  IFindAssetsResult,
} from './pgtyped/generated/findAssets.queries.ts'
import type { ICountAssetsResult } from './pgtyped/generated/countAssets.queries.ts'
import type {
  IFindAssetsWithTagsResult,
  Json as PgTypedJson,
} from './pgtyped/generated/findAssetsWithTags.queries.ts'
import type {
  CountAssetsRow,
  FindAssetsArgs,
  FindAssetsRow,
  FindAssetsWithTagsRow,
  countAssets as sqlcCountAssets,
} from './sqlc/generated/queries_sql.ts'
import { Kysely, PostgresDialect } from 'kysely'
import { jsonArrayFrom } from 'kysely/helpers/postgres'

interface Database {
  asset: { id: string; name: string; owner_id: string }
  album_asset: { album_id: string; asset_id: string }
  asset_tag: { asset_id: string; tag_id: string }
  tag: { id: string; name: string }
}

const adminUrl = process.env.COMPARISON_DATABASE_URL!
assert(
  adminUrl,
  'Set COMPARISON_DATABASE_URL to a disposable PostgreSQL server',
)
const admin = new Pool({ connectionString: adminUrl })
const database = `seo_raw_comparisons_${Date.now()}`
await admin.query(`create database "${database}"`)
const fixtureUrl = new URL(adminUrl)
fixtureUrl.pathname = '/' + database
const connectionString = fixtureUrl.toString()
const pgPool = new Pool({ connectionString })
const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool: pgPool }),
})
const sql = postgres(connectionString)
const slonik = await createPool(connectionString, {
  driverFactory: createPgDriverFactory(),
  interceptors: [
    {
      name: 'comparison-result-validation',
      transformRowAsync: async (context, _query, row) => {
        if (!context.resultParser) return row
        const checked = await context.resultParser['~standard'].validate(row)
        if (checked.issues) throw new Error('Result validation failed')
        return checked.value as typeof row
      },
    },
  ],
})

// DOC:options
type AssetOptions = {
  ownerId: string
  albumId?: string
  includeTags: boolean
  namePrefix?: string
}
// END:options

// DOC:postgres-assets
type AssetRow = {
  id: string
  name: string
  tags?: { id: string; name: string }[]
}

function findAssetsWithPostgres(options: AssetOptions) {
  const albumJoin =
    options.albumId !== undefined
      ? sql`inner join album_asset on album_asset.asset_id = asset.id`
      : sql``
  const albumFilter =
    options.albumId !== undefined
      ? sql`and album_asset.album_id = ${options.albumId}`
      : sql``
  const nameFilter =
    options.namePrefix !== undefined
      ? sql`and asset.name like ${options.namePrefix + '%'}`
      : sql``
  const tagsSelection = options.includeTags
    ? sql`, coalesce((
        select json_agg(tag_rows)
        from (
          select tag.id, tag.name
          from asset_tag
          inner join tag on tag.id = asset_tag.tag_id
          where asset_tag.asset_id = asset.id
          order by tag.name
        ) as tag_rows
      ), '[]'::json) as tags`
    : sql``

  return sql<AssetRow[]>`
    select asset.id, asset.name ${tagsSelection}
    from asset ${albumJoin}
    where asset.owner_id = ${options.ownerId}
      ${albumFilter} ${nameFilter}
    order by asset.name, asset.id
    limit 50
  `
}
// END:postgres-assets

// DOC:slonik-assets
const assetRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  tags: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
})

function findAssetsWithSlonik(options: AssetOptions) {
  const albumJoin =
    options.albumId !== undefined
      ? slonikSql.fragment`inner join album_asset on album_asset.asset_id = asset.id`
      : slonikSql.fragment``
  const albumFilter =
    options.albumId !== undefined
      ? slonikSql.fragment`and album_asset.album_id = ${options.albumId}`
      : slonikSql.fragment``
  const nameFilter =
    options.namePrefix !== undefined
      ? slonikSql.fragment`and asset.name like ${options.namePrefix + '%'}`
      : slonikSql.fragment``
  const tagsSelection = options.includeTags
    ? slonikSql.fragment`, coalesce((
        select json_agg(tag_rows)
        from (
          select tag.id, tag.name
          from asset_tag
          inner join tag on tag.id = asset_tag.tag_id
          where asset_tag.asset_id = asset.id
          order by tag.name
        ) as tag_rows
      ), '[]'::json) as tags`
    : slonikSql.fragment``

  return slonik.any(slonikSql.type(assetRowSchema)`
    select asset.id, asset.name ${tagsSelection}
    from asset ${albumJoin}
    where asset.owner_id = ${options.ownerId}
      ${albumFilter} ${nameFilter}
    order by asset.name, asset.id
    limit 50
  `)
}
// END:slonik-assets

// DOC:matching-assets
function matchingAssets(options: AssetOptions) {
  return db
    .selectFrom('asset')
    .where('asset.owner_id', '=', options.ownerId)
    .$if(options.albumId !== undefined, (qb) =>
      qb
        .innerJoin('album_asset', 'album_asset.asset_id', 'asset.id')
        .where('album_asset.album_id', '=', options.albumId!),
    )
    .$if(options.namePrefix !== undefined, (qb) =>
      qb.where('asset.name', 'like', options.namePrefix! + '%'),
    )
}
// END:matching-assets

// DOC:kysely-listing
function assetListing(options: AssetOptions) {
  return matchingAssets(options)
    .select(['asset.id', 'asset.name'])
    .$if(options.includeTags, (qb) =>
      qb.select((eb) =>
        jsonArrayFrom(
          eb
            .selectFrom('asset_tag')
            .innerJoin('tag', 'tag.id', 'asset_tag.tag_id')
            .select(['tag.id', 'tag.name'])
            .whereRef('asset_tag.asset_id', '=', 'asset.id')
            .orderBy('tag.name'),
        ).as('tags'),
      ),
    )
    .orderBy('asset.name')
    .orderBy('asset.id')
    .limit(50)
}
// END:kysely-listing

// DOC:kysely-count
function assetCount(options: AssetOptions) {
  return matchingAssets(options).select((eb) =>
    eb.cast<number>(eb.fn.countAll(), 'integer').as('count'),
  )
}
// END:kysely-count

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false
type Expect<T extends true> = T
type TypedSqlJsonShape = Expect<
  Equal<TagsQuery.Result['tags'], Prisma.JsonValue | null>
>
type CheckedResult = Expect<
  Equal<
    Awaited<ReturnType<ReturnType<typeof assetListing>['execute']>>,
    AssetRow[]
  >
>
// PgTyped 2.4: `:ownerId!` is required, bare `:albumId` and `:namePrefix` are
// optional and accept null or undefined. Columns that do not come straight from
// a NOT NULL table column are nullable, so `count(*)::integer` and the
// `coalesce(json_agg(...), '[]'::json)` expression both gain `| null`.
type PgTypedParams = Expect<
  Equal<
    IFindAssetsParams,
    {
      albumId?: string | null | void
      namePrefix?: string | null | void
      ownerId: string
    }
  >
>
type PgTypedListing = Expect<
  Equal<IFindAssetsResult, { id: string; name: string }>
>
type PgTypedCount = Expect<Equal<ICountAssetsResult, { count: number | null }>>
type PgTypedTags = Expect<
  Equal<IFindAssetsWithTagsResult['tags'], PgTypedJson | null>
>
// sqlc-gen-typescript 0.1.3: `sqlc.arg` is required, `sqlc.narg` is
// `string | null` (never optional, never undefined). `count(*)::integer` is a
// non-null `number`, but a `:one` query resolves to `Row | null`. The json
// `tags` column is typed `string | null`; node-postgres parses json at runtime,
// so the value is really an array of tag objects.
type SqlcParams = Expect<
  Equal<
    FindAssetsArgs,
    { ownerId: string; albumId: string | null; namePrefix: string | null }
  >
>
type SqlcListing = Expect<Equal<FindAssetsRow, { id: string; name: string }>>
type SqlcCount = Expect<Equal<CountAssetsRow, { count: number }>>
type SqlcCountResult = Expect<
  Equal<Awaited<ReturnType<typeof sqlcCountAssets>>, CountAssetsRow | null>
>
type SqlcTags = Expect<Equal<FindAssetsWithTagsRow['tags'], string | null>>

let prismaForCleanup: import('./generated/client.ts').PrismaClient | undefined
try {
  await pgPool.query(`
    create table asset (id text primary key, name text not null, owner_id text not null);
    create table album_asset (album_id text not null, asset_id text not null references asset(id), primary key (album_id, asset_id));
    create table tag (id text primary key, name text not null);
    create table asset_tag (asset_id text references asset(id), tag_id text references tag(id), primary key (asset_id, tag_id));
    insert into asset values ('a1','First','o1'),('a2','Second','o1'),('a3','Third','o2');
    insert into album_asset values ('album1','a1'),('album2','a2'),('album1','a3');
    insert into tag values ('t1','Travel'),('t2','Beach');
    insert into asset_tag values ('a1','t1'),('a1','t2');
  `)
  const generated = spawnSync(
    process.execPath,
    [
      'node_modules/prisma/build/index.js',
      'generate',
      '--sql',
      '--schema',
      'schema.prisma',
    ],
    {
      cwd: dirname(fileURLToPath(import.meta.url)),
      env: { ...process.env, RAW_COMPARISON_DATABASE_URL: connectionString },
      encoding: 'utf8',
    },
  )
  assert.equal(generated.status, 0, generated.stdout + '\n' + generated.stderr)
  console.log(generated.stdout.trim())
  const { PrismaClient } = await import('./generated/client.ts')
  const queries = await import('./generated/sql.ts')
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })
  prismaForCleanup = prisma
  const { findAssets, findAssetsWithTags, countAssets } = queries
  // DOC:file-listing
  function findAssetsFromFiles(options: AssetOptions) {
    if (options.includeTags) {
      return prisma.$queryRawTyped(
        findAssetsWithTags(
          options.ownerId,
          options.albumId ?? null,
          options.namePrefix ?? null,
        ),
      )
    }
    return prisma.$queryRawTyped(
      findAssets(
        options.ownerId,
        options.albumId ?? null,
        options.namePrefix ?? null,
      ),
    )
  }
  // END:file-listing
  // PgTyped connects to a live database to describe each statement, so it is
  // generated here, against the fixture tables. The `--uri` flag overrides
  // pgtyped.config.json, which carries no connection details. PgTyped skips
  // files whose output is unchanged, so start from an empty output directory.
  const here = dirname(fileURLToPath(import.meta.url))
  rmSync(join(here, 'pgtyped', 'generated'), { recursive: true, force: true })
  const pgTypedGenerated = spawnSync(
    process.execPath,
    [
      'node_modules/@pgtyped/cli/lib/index.js',
      '--config',
      'pgtyped.config.json',
      '--uri',
      connectionString,
    ],
    { cwd: here, encoding: 'utf8' },
  )
  assert.equal(
    pgTypedGenerated.status,
    0,
    pgTypedGenerated.stdout + '\n' + pgTypedGenerated.stderr,
  )
  assert.match(
    pgTypedGenerated.stdout,
    /Saved 1 query types from pgtyped\/findAssets\.sql/,
  )
  assert.match(
    pgTypedGenerated.stdout,
    /Saved 1 query types from pgtyped\/countAssets\.sql/,
  )
  assert.match(
    pgTypedGenerated.stdout,
    /Saved 1 query types from pgtyped\/findAssetsWithTags\.sql/,
  )
  console.log(pgTypedGenerated.stdout.trim())
  const pgTyped = {
    ...(await import('./pgtyped/generated/findAssets.queries.ts')),
    ...(await import('./pgtyped/generated/countAssets.queries.ts')),
    ...(await import('./pgtyped/generated/findAssetsWithTags.queries.ts')),
  }
  // sqlc parsed the SQL files locally (see verify.mjs); no connection was used.
  const sqlc = await import('./sqlc/generated/queries_sql.ts')
  // DOC:pgtyped-listing
  function findAssetsWithPgTyped(options: AssetOptions) {
    const params = {
      ownerId: options.ownerId,
      albumId: options.albumId,
      namePrefix: options.namePrefix,
    }
    if (options.includeTags) {
      return pgTyped.findAssetsWithTags.run(params, pgPool)
    }
    return pgTyped.findAssets.run(params, pgPool)
  }
  // END:pgtyped-listing
  // DOC:sqlc-listing
  function findAssetsWithSqlc(options: AssetOptions) {
    const args = {
      ownerId: options.ownerId,
      albumId: options.albumId ?? null,
      namePrefix: options.namePrefix ?? null,
    }
    if (options.includeTags) {
      return sqlc.findAssetsWithTags(pgPool, args)
    }
    return sqlc.findAssets(pgPool, args)
  }
  // END:sqlc-listing
  if (false) {
    const absentAlbum = { ownerId: 'o1', albumId: undefined, namePrefix: null }
    // @ts-expect-error sqlc.narg produces `string | null`; an absent option must be converted first.
    sqlc.findAssets(pgPool, absentAlbum)
    // @ts-expect-error sqlc.narg arguments are not optional either.
    sqlc.findAssets(pgPool, { ownerId: 'o1' })
  }
  let combinations = 0
  for (const ownerId of ['o1', 'o2'])
    for (const albumId of [undefined, 'album1', 'album2', 'empty'])
      for (const includeTags of [false, true])
        for (const namePrefix of [undefined, 'F', 'none']) {
          const options = { ownerId, albumId, includeTags, namePrefix }
          const kyselyRows = await assetListing(options).execute()
          const postgresRows = await findAssetsWithPostgres(options)
          const slonikRows = await findAssetsWithSlonik(options)
          const fileRows = await findAssetsFromFiles(options)
          const pgTypedRows = await findAssetsWithPgTyped(options)
          const sqlcRows = await findAssetsWithSqlc(options)
          assert.deepEqual([...postgresRows], kyselyRows)
          assert.deepEqual([...slonikRows], kyselyRows)
          assert.deepEqual(fileRows, kyselyRows)
          assert.deepEqual(pgTypedRows, kyselyRows)
          assert.deepEqual(sqlcRows, kyselyRows)
          const count = await assetCount(options).executeTakeFirstOrThrow()
          const fileCount = await prisma.$queryRawTyped(
            queries.countAssets(ownerId, albumId ?? null, namePrefix ?? null),
          )
          const pgTypedCount = await pgTyped.countAssets.run(
            { ownerId, albumId, namePrefix },
            pgPool,
          )
          const sqlcCount = await sqlc.countAssets(pgPool, {
            ownerId,
            albumId: albumId ?? null,
            namePrefix: namePrefix ?? null,
          })
          assert.equal(count.count, kyselyRows.length)
          assert.equal(fileCount[0]?.count, count.count)
          assert.equal(pgTypedCount[0]?.count, count.count)
          assert.equal(sqlcCount?.count, count.count)
          const compiled = assetListing(options).compile()
          assert.equal(
            compiled.sql.includes('"album_asset"'),
            albumId !== undefined,
          )
          assert.equal(compiled.sql.includes('json_agg'), includeTags)
          assert.equal(
            compiled.sql.includes(' like '),
            namePrefix !== undefined,
          )
          for (const row of kyselyRows)
            assert.equal(Object.hasOwn(row, 'tags'), includeTags)
          combinations++
        }
  await pgPool.query(`
    insert into asset select 'bulk'||lpad(g::text,3,'0'), 'Bulk', 'o3' from generate_series(1,60) g;
    insert into album_asset select 'bulkAlbum',id from asset where owner_id='o3';
  `)
  for (const includeTags of [false, true]) {
    const options = {
      ownerId: 'o3',
      albumId: 'bulkAlbum',
      includeTags,
      namePrefix: 'B',
    }
    const rows = await assetListing(options).execute()
    assert.equal(rows.length, 50)
    assert.deepEqual(
      rows.map((row) => row.id),
      Array.from(
        { length: 50 },
        (_, i) => 'bulk' + String(i + 1).padStart(3, '0'),
      ),
    )
    assert.deepEqual([...(await findAssetsWithPostgres(options))], rows)
    assert.deepEqual([...(await findAssetsWithSlonik(options))], rows)
    assert.deepEqual(await findAssetsFromFiles(options), rows)
    assert.deepEqual(await findAssetsWithPgTyped(options), rows)
    assert.deepEqual(await findAssetsWithSqlc(options), rows)
    assert.equal(
      (await assetCount(options).executeTakeFirstOrThrow()).count,
      60,
    )
    assert.equal(
      (await prisma.$queryRawTyped(countAssets('o3', 'bulkAlbum', 'B')))[0]
        ?.count,
      60,
    )
    assert.equal(
      (
        await pgTyped.countAssets.run(
          { ownerId: 'o3', albumId: 'bulkAlbum', namePrefix: 'B' },
          pgPool,
        )
      )[0]?.count,
      60,
    )
    assert.equal(
      (
        await sqlc.countAssets(pgPool, {
          ownerId: 'o3',
          albumId: 'bulkAlbum',
          namePrefix: 'B',
        })
      )?.count,
      60,
    )
  }
  const injectionOptions = { ownerId: "' OR true --", includeTags: true }
  assert.deepEqual(await assetListing(injectionOptions).execute(), [])
  assert.deepEqual([...(await findAssetsWithPostgres(injectionOptions))], [])
  assert.deepEqual([...(await findAssetsWithSlonik(injectionOptions))], [])
  assert.deepEqual(await findAssetsFromFiles(injectionOptions), [])
  assert.deepEqual(await findAssetsWithPgTyped(injectionOptions), [])
  assert.deepEqual(await findAssetsWithSqlc(injectionOptions), [])
  assert(
    !assetListing(injectionOptions)
      .compile()
      .sql.includes(injectionOptions.ownerId),
  )
  const lies = await sql<
    AssetRow[]
  >`select id, name as label from asset order by id limit 1`
  assert.equal(lies[0]?.name, undefined)
  const renamed = await db
    .selectFrom('asset')
    .select(['id', 'name as label'])
    .orderBy('id')
    .limit(1)
    .execute()
  if (false) {
    // @ts-expect-error A changed selection changes Kysely's inferred result.
    renamed[0]?.name
  }
  assert.equal(renamed[0]?.label, 'First')
  await assert.rejects(
    slonik.any(
      slonikSql.type(
        assetRowSchema,
      )`select id, name as label from asset order by id limit 1`,
    ),
    /Result validation failed/,
  )
  const typedTags = await prisma.$queryRawTyped(
    findAssetsWithTags('o1', null, null),
  )
  if (false) {
    // @ts-expect-error Prisma TypedSQL 7 describes this column as JsonValue, not a tag object array.
    typedTags[0]?.tags?.[0]?.name
  }
  const pgTypedTags = await pgTyped.findAssetsWithTags.run(
    { ownerId: 'o1' },
    pgPool,
  )
  const sqlcTags = await sqlc.findAssetsWithTags(pgPool, {
    ownerId: 'o1',
    albumId: null,
    namePrefix: null,
  })
  const pgTypedO1Count = await pgTyped.countAssets.run(
    { ownerId: 'o1' },
    pgPool,
  )
  assert.equal(pgTypedO1Count[0]?.count, 2)
  if (false) {
    // @ts-expect-error PgTyped 2.4 describes this column as `Json | null`, not a tag object array.
    pgTypedTags[0]?.tags?.[0]?.name
    // @ts-expect-error sqlc-gen-typescript 0.1.3 describes this json column as `string | null`.
    sqlcTags[0]?.tags?.[0]?.name
    // @ts-expect-error PgTyped keeps `count(*)::integer` nullable; it is not assignable to number.
    const pgTypedCountValue: number = pgTypedO1Count[0]!.count
  }
  // At runtime both deliver parsed JSON, whatever the declared type says.
  assert.deepEqual(pgTypedTags[0]?.tags, [
    { id: 't2', name: 'Beach' },
    { id: 't1', name: 'Travel' },
  ])
  assert.deepEqual(sqlcTags[0]?.tags as unknown, [
    { id: 't2', name: 'Beach' },
    { id: 't1', name: 'Travel' },
  ])
  assert.equal(typeof sqlcTags[0]?.tags, 'object')
  // A CASE can omit the expensive expression, but it cannot remove an output column.
  const caseRows = await pgPool.query(
    'select id, name, case when $1 then json_build_array() else null end as tags from asset order by id limit 1',
    [false],
  )
  assert(Object.hasOwn(caseRows.rows[0], 'tags'))
  assert.equal(caseRows.rows[0].tags, null)
  console.log(
    `PASS: ${combinations} combinations across Kysely, Postgres.js, Slonik, generated Prisma TypedSQL, PgTyped, and sqlc; listing/count equivalence; empty tags and absent columns; alias drift; CASE output contract; 50-row pagination with a 60-row count; bound SQL-like input`,
  )
} finally {
  await prismaForCleanup?.$disconnect()
  await slonik.end()
  await sql.end()
  await db.destroy()
  await admin.query(`drop database "${database}"`)
  await admin.end()
}
