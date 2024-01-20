import { expectError, expectType } from 'tsd'
import { Kysely, sql } from '..'
import { Database } from '../shared'

async function testUnion(db: Kysely<Database>) {
  // Subquery
  const r1 = await db
    .selectFrom('person')
    .select(['id', 'first_name as name'])
    .where('id', 'in', [1, 2, 3])
    .union(db.selectFrom('pet').select('name').select('owner_id as id'))
    .executeTakeFirstOrThrow()

  expectType<{ id: number; name: string }>(r1)

  // Raw expression
  const r2 = await db
    .selectFrom('person')
    .select(['id', 'first_name as name'])
    .where('id', 'in', [1, 2, 3])
    .union(sql<{ id: number; name: string }>`(1, 'Sami')`)
    .executeTakeFirstOrThrow()

  expectType<{ id: number; name: string }>(r2)

  // Two subqueries
  const r3 = await db
    .selectFrom('person')
    .select(['id', 'first_name as name'])
    .where('id', 'in', [1, 2, 3])
    .union([
      db.selectFrom('pet').select('name').select('owner_id as id'),
      db.selectFrom('book').select(['id', 'name']),
    ])
    .executeTakeFirstOrThrow()

  expectType<{ id: number; name: string }>(r3)

  // Subquery using a callback
  const r4 = await db
    .selectFrom('person')
    .select(['id', 'first_name as name'])
    .where('id', 'in', [1, 2, 3])
    .union((eb) => eb.selectFrom('pet').select('name').select('owner_id as id'))
    .executeTakeFirstOrThrow()

  expectType<{ id: number; name: string }>(r4)

  // Two subqueries using a callback
  const r5 = await db
    .selectFrom('person')
    .select(['id', 'first_name as name'])
    .where('id', 'in', [1, 2, 3])
    .union((eb) => [
      eb.selectFrom('pet').select('name').select('owner_id as id'),
      eb.selectFrom('book').select(['id', 'name']),
    ])
    .executeTakeFirstOrThrow()

  expectType<{ id: number; name: string }>(r5)

  // Unioned expression has a different type
  expectError(
    db
      .selectFrom('person')
      .select(['id', 'first_name as name'])
      .where('id', 'in', [1, 2, 3])
      .union(db.selectFrom('pet').select('name').select('owner_id')),
  )
}

async function testUnionAll(db: Kysely<Database>) {
  // Subquery
  const r1 = await db
    .selectFrom('person')
    .select(['id', 'first_name as name'])
    .where('id', 'in', [1, 2, 3])
    .unionAll(db.selectFrom('pet').select('name').select('owner_id as id'))
    .executeTakeFirstOrThrow()

  expectType<{ id: number; name: string }>(r1)

  // Raw expression
  const r2 = await db
    .selectFrom('person')
    .select(['id', 'first_name as name'])
    .where('id', 'in', [1, 2, 3])
    .unionAll(sql<{ id: number; name: string }>`(1, 'Sami')`)
    .executeTakeFirstOrThrow()

  expectType<{ id: number; name: string }>(r2)

  // Unioned expression has a different type
  expectError(
    db
      .selectFrom('person')
      .select(['id', 'first_name as name'])
      .where('id', 'in', [1, 2, 3])
      .unionAll(db.selectFrom('pet').select('name').select('owner_id')),
  )
}

async function testIntersect(db: Kysely<Database>) {
  // Subquery
  const r1 = await db
    .selectFrom('person')
    .select(['id', 'first_name as name'])
    .where('id', 'in', [1, 2, 3])
    .intersect(db.selectFrom('pet').select('name').select('owner_id as id'))
    .executeTakeFirstOrThrow()

  expectType<{ id: number; name: string }>(r1)

  // Raw expression
  const r2 = await db
    .selectFrom('person')
    .select(['id', 'first_name as name'])
    .where('id', 'in', [1, 2, 3])
    .intersect(sql<{ id: number; name: string }>`(1, 'Sami')`)
    .executeTakeFirstOrThrow()

  expectType<{ id: number; name: string }>(r2)

  // Unioned expression has a different type
  expectError(
    db
      .selectFrom('person')
      .select(['id', 'first_name as name'])
      .where('id', 'in', [1, 2, 3])
      .intersect(db.selectFrom('pet').select('name').select('owner_id')),
  )
}

async function testIntersectAll(db: Kysely<Database>) {
  // Subquery
  const r1 = await db
    .selectFrom('person')
    .select(['id', 'first_name as name'])
    .where('id', 'in', [1, 2, 3])
    .intersectAll(db.selectFrom('pet').select('name').select('owner_id as id'))
    .executeTakeFirstOrThrow()

  expectType<{ id: number; name: string }>(r1)

  // Raw expression
  const r2 = await db
    .selectFrom('person')
    .select(['id', 'first_name as name'])
    .where('id', 'in', [1, 2, 3])
    .intersectAll(sql<{ id: number; name: string }>`(1, 'Sami')`)
    .executeTakeFirstOrThrow()

  expectType<{ id: number; name: string }>(r2)

  // Unioned expression has a different type
  expectError(
    db
      .selectFrom('person')
      .select(['id', 'first_name as name'])
      .where('id', 'in', [1, 2, 3])
      .intersectAll(db.selectFrom('pet').select('name').select('owner_id')),
  )
}

async function testExcept(db: Kysely<Database>) {
  // Subquery
  const r1 = await db
    .selectFrom('person')
    .select(['id', 'first_name as name'])
    .where('id', 'in', [1, 2, 3])
    .except(db.selectFrom('pet').select('name').select('owner_id as id'))
    .executeTakeFirstOrThrow()

  expectType<{ id: number; name: string }>(r1)

  // Raw expression
  const r2 = await db
    .selectFrom('person')
    .select(['id', 'first_name as name'])
    .where('id', 'in', [1, 2, 3])
    .except(sql<{ id: number; name: string }>`(1, 'Sami')`)
    .executeTakeFirstOrThrow()

  expectType<{ id: number; name: string }>(r2)

  // Unioned expression has a different type
  expectError(
    db
      .selectFrom('person')
      .select(['id', 'first_name as name'])
      .where('id', 'in', [1, 2, 3])
      .except(db.selectFrom('pet').select('name').select('owner_id')),
  )
}

async function testExceptAll(db: Kysely<Database>) {
  // Subquery
  const r1 = await db
    .selectFrom('person')
    .select(['id', 'first_name as name'])
    .where('id', 'in', [1, 2, 3])
    .exceptAll(db.selectFrom('pet').select('name').select('owner_id as id'))
    .executeTakeFirstOrThrow()

  expectType<{ id: number; name: string }>(r1)

  // Raw expression
  const r2 = await db
    .selectFrom('person')
    .select(['id', 'first_name as name'])
    .where('id', 'in', [1, 2, 3])
    .exceptAll(sql<{ id: number; name: string }>`(1, 'Sami')`)
    .executeTakeFirstOrThrow()

  expectType<{ id: number; name: string }>(r2)

  // Unioned expression has a different type
  expectError(
    db
      .selectFrom('person')
      .select(['id', 'first_name as name'])
      .where('id', 'in', [1, 2, 3])
      .exceptAll(db.selectFrom('pet').select('name').select('owner_id')),
  )
}
