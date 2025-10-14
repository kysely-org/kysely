import { expectError, expectType } from 'tsd'
import {
  Kysely,
  type DeleteResult,
  type InsertResult,
  type UpdateResult,
} from '..'
import { Database } from '../shared'

void async function testBasicBatch(db: Kysely<Database>) {
  // Two select queries - should preserve tuple types
  const [persons, pets] = await db
    .batch()
    .add(db.selectFrom('person').selectAll())
    .add(db.selectFrom('pet').selectAll())
    .execute()

  expectType<
    {
      id: number
      first_name: string
      last_name: string | null
      gender: 'male' | 'female' | 'other'
      age: number
      modified_at: Date
      marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
      deleted_at: Date | null
    }[]
  >(persons)

  expectType<
    {
      id: string
      name: string
      owner_id: number
      species: 'dog' | 'cat'
    }[]
  >(pets)
}

void async function testSingleQueryBatch(db: Kysely<Database>) {
  // Single query should still return a tuple with one element
  const [result] = await db
    .batch()
    .add(db.selectFrom('person').select(['id', 'first_name']))
    .execute()

  expectType<{ id: number; first_name: string }[]>(result)
}

void async function testMixedQueryTypes(db: Kysely<Database>) {
  // Mix of select, insert, update, delete
  const [selected, inserted, updated, deleted] = await db
    .batch()
    .add(db.selectFrom('person').select('id'))
    .add(
      db.insertInto('person').values({
        first_name: 'Test',
        gender: 'other',
        age: 25,
      }),
    )
    .add(db.updateTable('person').set({ age: 30 }).where('id', '=', 1))
    .add(db.deleteFrom('pet').where('id', '=', '1'))
    .execute()

  expectType<{ id: number }[]>(selected)
  expectType<InsertResult[]>(inserted)
  expectType<UpdateResult[]>(updated)
  expectType<DeleteResult[]>(deleted)
}

void async function testBatchWithReturning(db: Kysely<Database>) {
  const [inserted, updated] = await db
    .batch()
    .add(
      db
        .insertInto('person')
        .values({
          first_name: 'John',
          gender: 'male',
          age: 30,
        })
        .returning(['id', 'first_name']),
    )
    .add(
      db
        .updateTable('person')
        .set({ age: 31 })
        .where('id', '=', 1)
        .returningAll(),
    )
    .execute()

  expectType<{ id: number; first_name: string }[]>(inserted)
  expectType<
    {
      id: number
      first_name: string
      last_name: string | null
      gender: 'male' | 'female' | 'other'
      age: number
      modified_at: Date
      marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
      deleted_at: Date | null
    }[]
  >(updated)
}

void async function testBatchWithCompiledQueries(db: Kysely<Database>) {
  const query1 = db.selectFrom('person').select(['id', 'first_name']).compile()

  const query2 = db.selectFrom('pet').selectAll().compile()

  const [persons, pets] = await db.batch().add(query1).add(query2).execute()

  expectType<{ id: number; first_name: string }[]>(persons)
  expectType<
    {
      id: string
      name: string
      owner_id: number
      species: 'dog' | 'cat'
    }[]
  >(pets)
}

void async function testEmptyBatch(db: Kysely<Database>) {
  const result = await db.batch().execute()

  expectType<[]>(result)
}

void async function testBatchWithSubqueries(db: Kysely<Database>) {
  const [result] = await db
    .batch()
    .add(
      db
        .selectFrom('person')
        .select((eb) => [
          'id',
          eb
            .selectFrom('pet')
            .select('name')
            .whereRef('pet.owner_id', '=', 'person.id')
            .limit(1)
            .as('pet_name'),
        ]),
    )
    .execute()

  expectType<{ id: number; pet_name: string | null }[]>(result)
}

void async function testBatchWithJoins(db: Kysely<Database>) {
  const [result] = await db
    .batch()
    .add(
      db
        .selectFrom('person')
        .innerJoin('pet', 'pet.owner_id', 'person.id')
        .select(['person.first_name', 'pet.name as pet_name']),
    )
    .execute()

  expectType<{ first_name: string; pet_name: string }[]>(result)
}

void async function testBatchTypeInference(db: Kysely<Database>) {
  // Test that adding queries incrementally preserves types
  const batch1 = db.batch()
  const batch2 = batch1.add(db.selectFrom('person').select('id'))
  const batch3 = batch2.add(db.selectFrom('pet').select('name'))
  const batch4 = batch3.add(db.selectFrom('movie').select(['id', 'stars']))

  const [persons, pets, movies] = await batch4.execute()

  expectType<{ id: number }[]>(persons)
  expectType<{ name: string }[]>(pets)
  expectType<{ id: string; stars: number }[]>(movies)
}

void async function testBatchWithExpressions(db: Kysely<Database>) {
  const [result] = await db
    .batch()
    .add(
      db
        .selectFrom('person')
        .select((eb) => [
          'id',
          eb.fn.count('id').as('count'),
          eb.fn.max('age').as('max_age'),
        ])
        .groupBy('id'),
    )
    .execute()

  expectType<
    { id: number; max_age: number; count: number | bigint | string }[]
  >(result)
}

void async function testBatchErrors(db: Kysely<Database>) {
  // Non-existent table
  expectError(
    db.batch().add(db.selectFrom('not_a_table').selectAll()).execute(),
  )

  // Non-existent column
  expectError(
    db.batch().add(db.selectFrom('person').select('not_a_column')).execute(),
  )

  // Type mismatch in values
  expectError(
    db
      .batch()
      .add(
        db.insertInto('person').values({
          first_name: 123, // Should be string
          gender: 'other',
          age: 30,
        }),
      )
      .execute(),
  )

  // Missing required columns
  expectError(
    db
      .batch()
      .add(
        db.insertInto('person').values({
          first_name: 'Test',
          // Missing gender and age
        }),
      )
      .execute(),
  )
}

void async function testBatchWithCTE(db: Kysely<Database>) {
  const [result] = await db
    .batch()
    .add(
      db
        .with('top_persons', (db) =>
          db.selectFrom('person').select(['id', 'first_name']).limit(10),
        )
        .selectFrom('top_persons')
        .selectAll(),
    )
    .execute()

  expectType<{ id: number; first_name: string }[]>(result)
}

void async function testLongBatchChain(db: Kysely<Database>) {
  // Test with many queries to ensure tuple types scale
  const [r1, r2, r3, r4, r5] = await db
    .batch()
    .add(db.selectFrom('person').select('id'))
    .add(db.selectFrom('pet').select('name'))
    .add(db.selectFrom('movie').select('stars'))
    .add(db.selectFrom('person').select(['first_name', 'last_name']))
    .add(db.selectFrom('pet').select(['id', 'species']))
    .execute()

  expectType<{ id: number }[]>(r1)
  expectType<{ name: string }[]>(r2)
  expectType<{ stars: number }[]>(r3)
  expectType<{ first_name: string; last_name: string | null }[]>(r4)
  expectType<{ id: string; species: 'dog' | 'cat' }[]>(r5)
}

void async function testBatchWithDynamicReferences(db: Kysely<Database>) {
  const { ref } = db.dynamic

  const [result] = await db
    .batch()
    .add(
      db
        .selectFrom('person')
        .select(['id', ref<'first_name' | 'last_name'>('first_name')]),
    )
    .execute()

  expectType<
    {
      id: number
      first_name: string | undefined
      last_name: string | null | undefined
    }[]
  >(result)
}
