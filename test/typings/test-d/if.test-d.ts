import type { Kysely, InsertResult, UpdateResult, DeleteResult } from '..'
import type { Database } from '../shared'
import { expectType } from 'tsd'

async function testIfInSelect(db: Kysely<Database>) {
  const condition = Math.random() < 0.5

  // Conditional select
  const [r1] = await db
    .selectFrom('pet as p')
    .select('p.species')
    .$if(condition, (qb) => qb.select('id'))
    .execute()

  // Conditional inner join
  const [r2] = await db
    .selectFrom('pet as p')
    .select('p.species')
    .$if(condition, (qb) => qb.innerJoin('person', 'person.id', 'p.owner_id'))
    .execute()

  expectType<{ species: 'dog' | 'cat' }>(r2)

  // Conditional inner join with selection
  const [r3] = await db
    .selectFrom('pet as p')
    .select('p.species')
    .$if(condition, (qb) =>
      qb
        .innerJoin('person', 'person.id', 'p.owner_id')
        .select('age as person_age'),
    )
    .execute()

  expectType<{ species: 'dog' | 'cat'; person_age?: number }>(r3)

  // Conditional left join
  const [r4] = await db
    .selectFrom('pet as p')
    .select('p.species')
    .$if(condition, (qb) => qb.leftJoin('person', 'person.id', 'p.owner_id'))
    .execute()

  expectType<{ species: 'dog' | 'cat' }>(r4)

  // Conditional left join with selection
  const [r5] = await db
    .selectFrom('pet as p')
    .select('p.species')
    .$if(condition, (qb) =>
      qb
        .leftJoin('person', 'person.id', 'p.owner_id')
        .select('age as person_age'),
    )
    .execute()

  expectType<{ species: 'dog' | 'cat'; person_age?: number | null }>(r5)
}

async function testIfInInsert(db: Kysely<Database>) {
  const condition = Math.random() < 0.5

  // Conditional returning in insert
  const [r1] = await db
    .insertInto('person')
    .values({ first_name: 'Foo', last_name: 'Bar', gender: 'other', age: 0 })
    .$if(condition, (qb) => qb.returning('first_name'))
    .execute()

  expectType<{ first_name?: string }>(r1)

  // Conditional additional returning in insert
  const [r2] = await db
    .insertInto('person')
    .values({ first_name: 'Foo', last_name: 'Bar', gender: 'other', age: 0 })
    .returning('first_name')
    .$if(condition, (qb) => qb.returning('last_name'))
    .execute()

  expectType<{ first_name: string; last_name?: string | null }>(r2)

  // Conditional ignore in insert
  const [r3] = await db
    .insertInto('person')
    .values({ first_name: 'Foo', last_name: 'Bar', gender: 'other', age: 0 })
    .$if(condition, (qb) => qb.ignore())
    .execute()

  expectType<InsertResult>(r3)

  // Conditional ignore after returning in insert
  const [r4] = await db
    .insertInto('person')
    .values({ first_name: 'Foo', last_name: 'Bar', gender: 'other', age: 0 })
    .returning('first_name')
    .$if(condition, (qb) => qb.ignore())
    .execute()

  expectType<{ first_name: string }>(r4)
}

async function testIfInUpdate(db: Kysely<Database>) {
  const condition = Math.random() < 0.5

  // Conditional returning in update
  const [r1] = await db
    .updateTable('person')
    .set({ last_name: 'Foo' })
    .$if(condition, (qb) => qb.returning('first_name'))
    .execute()

  expectType<{ first_name?: string }>(r1)

  // Conditional additional returning in update
  const [r2] = await db
    .updateTable('person')
    .set({ last_name: 'Foo' })
    .returning('first_name')
    .$if(condition, (qb) => qb.returning('last_name'))
    .execute()

  expectType<{ first_name: string; last_name?: string | null }>(r2)

  // Conditional where in update
  const [r3] = await db
    .updateTable('person')
    .set({ last_name: 'Foo' })
    .$if(condition, (qb) => qb.where('id', '=', 1))
    .execute()

  expectType<UpdateResult>(r3)

  // Conditional where after returning in update
  const [r4] = await db
    .updateTable('person')
    .set({ last_name: 'Foo' })
    .returning('first_name')
    .$if(condition, (qb) => qb.where('id', '=', 1))
    .execute()

  expectType<{ first_name: string }>(r4)
}

async function testIfInDelete(db: Kysely<Database>) {
  const condition = Math.random() < 0.5

  // Conditional returning in delete
  const [r1] = await db
    .deleteFrom('person')
    .$if(condition, (qb) => qb.returning('first_name'))
    .execute()

  expectType<{ first_name?: string }>(r1)

  // Conditional additional returning in delete
  const [r2] = await db
    .deleteFrom('person')
    .returning('first_name')
    .$if(condition, (qb) => qb.returning('last_name'))
    .execute()

  expectType<{ first_name: string; last_name?: string | null }>(r2)

  // Conditional where in delete
  const [r3] = await db
    .deleteFrom('person')
    .$if(condition, (qb) => qb.where('id', '=', 1))
    .execute()

  expectType<DeleteResult>(r3)

  // Conditional where after returning in delete
  const [r4] = await db
    .deleteFrom('person')
    .returning('first_name')
    .$if(condition, (qb) => qb.where('id', '=', 1))
    .execute()

  expectType<{ first_name: string }>(r4)
}
