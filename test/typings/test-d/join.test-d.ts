import { Kysely, Selectable } from '..'
import { Database, Pet } from '../shared'
import { expectType, expectError } from 'tsd'

async function testJoin(db: Kysely<Database>) {
  // Simple join with two columns
  const r1 = await db
    .selectFrom('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .selectAll()
    .execute()

  expectType<
    {
      // Person columns
      id: number | string
      first_name: string
      last_name: string | null
      age: number
      gender: 'male' | 'female' | 'other'
      modified_at: Date
      marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
      deleted_at: Date | null

      // Pet columns.
      name: string
      species: 'cat' | 'dog'
      owner_id: number
    }[]
  >(r1)

  // Join with an alias using the join builder instead of two columns
  const r2 = await db
    .selectFrom('person')
    .innerJoin('pet as p', (join) => join.onRef('p.owner_id', '=', 'person.id'))
    .where('p.species', 'in', ['cat'])
    .selectAll('p')
    .execute()

  expectType<Selectable<Pet>[]>(r2)
  expectType<
    { id: string; name: string; species: 'cat' | 'dog'; owner_id: number }[]
  >(r2)

  // Join subquery
  const r3 = await db
    .selectFrom('person')
    .innerJoin(
      db.selectFrom('pet').select(['pet.id', 'pet.owner_id as owner']).as('p'),
      'p.owner',
      'person.id',
    )
    .where('p.owner', '>', 2)
    .selectAll('p')
    .execute()

  expectType<{ id: string; owner: number }[]>(r3)

  // Join subquery using join builder
  const r4 = await db
    .selectFrom('person')
    .innerJoin(
      (qb) => qb.selectFrom('pet').selectAll('pet').as('p'),
      (join) => join.onRef('p.owner_id', '=', 'person.id'),
    )
    .where('p.owner_id', '>', 2)
    .selectAll('p')
    .execute()

  expectType<Selectable<Pet>[]>(r4)

  // Two left joins
  const r5 = await db
    .selectFrom('person')
    .leftJoin('pet', 'pet.owner_id', 'person.id')
    .leftJoin('movie', 'movie.id', 'person.id')
    .selectAll()
    .executeTakeFirstOrThrow()

  expectType<{
    id: number | string | null
    first_name: string
    last_name: string | null
    age: number
    gender: 'male' | 'female' | 'other'
    modified_at: Date
    marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
    deleted_at: Date | null

    // All Pet columns should be nullable because of the left join
    name: string | null
    species: 'dog' | 'cat' | null
    owner_id: number | null

    // All Movie columns should be nullable because of the left join
    stars: number | null
  }>(r5)

  // Two right joins
  const r6 = await db
    .selectFrom('person')
    .rightJoin('pet', 'pet.owner_id', 'person.id')
    .rightJoin('movie', 'movie.id', 'person.id')
    .selectAll()
    .executeTakeFirstOrThrow()

  expectType<{
    // All Person columns should be nullable because of the right join.
    id: number | string | null
    first_name: string | null
    last_name: string | null
    age: number | null
    gender: 'male' | 'female' | 'other' | null
    modified_at: Date | null
    marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
    deleted_at: Date | null

    // All Pet columns should also be nullable because there's another
    // right join after the Pet join.
    name: string | null
    species: 'dog' | 'cat' | null
    owner_id: number | null

    // Movie columns should not be nullable because it's the last
    // right joined table.
    stars: number
  }>(r6)

  // Two full joins.
  const r7 = await db
    .selectFrom('person')
    .fullJoin('pet', 'pet.owner_id', 'person.id')
    .fullJoin('movie', 'movie.id', 'person.id')
    .selectAll()
    .executeTakeFirstOrThrow()

  // All columns should be nullable because of the full join
  expectType<{
    id: number | string | null
    first_name: string | null
    last_name: string | null
    age: number | null
    gender: 'male' | 'female' | 'other' | null
    modified_at: Date | null
    marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
    deleted_at: Date | null

    name: string | null
    species: 'dog' | 'cat' | null
    owner_id: number | null

    stars: number | null
  }>(r7)

  // Update query with a join
  const r8 = await db
    .updateTable('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .set({ last_name: 'Jennifer' })
    .where('pet.id', '=', '1')

  // Refer to table that's not joined
  expectError(
    db.selectFrom('person').innerJoin('movie', 'movie.id', 'pet.owner_id'),
  )

  // Refer to column that doesn't exist
  expectError(db.selectFrom('person').innerJoin('movie', 'foo', 'person.id'))

  // Refer to table that's not joined
  expectError(
    db
      .selectFrom('person')
      .innerJoin('movie as m', (join) =>
        join.onRef('pet.id', '=', 'person.id'),
      ),
  )

  // Refer to table with wrong alias
  expectError(
    db
      .selectFrom('person')
      .innerJoin('movie as m', (join) =>
        join.onRef('movie.id', '=', 'person.id'),
      ),
  )

  // Join using
  const r9 = await db
    .selectFrom('pet')
    .innerJoin('book', (join) => join.using(['name']))
    .selectAll()
    .executeTakeFirstOrThrow()

  const r10 = await db
    .selectFrom('person as a')
    .innerJoin('person as b', (join) => join.using(['first_name', 'last_name']))
    .select(['a.id', 'b.id'])
    .executeTakeFirstOrThrow()

  // Refer to a column that's not present in both tables
  expectError(
    db
      .selectFrom('person')
      .innerJoin('movie', (join) => join.using(['last_name']))
  )

  // Refer to a column with table qualifier
  expectError(
    db.selectFrom('pet').innerJoin('book', (join) => join.using(['pet.name']))
  )
}

async function testManyJoins(db: Kysely<Database>) {
  // Make sure things still work if we add a huge amount of joins.
  const r1 = await db
    .selectFrom('person')
    .innerJoin('pet as p1', 'p1.owner_id', 'person.id')
    .innerJoin('pet as p2', 'p2.owner_id', 'person.id')
    .innerJoin('pet as p3', 'p3.owner_id', 'person.id')
    .innerJoin('pet as p4', 'p4.owner_id', 'person.id')
    .innerJoin('pet as p5', 'p5.owner_id', 'person.id')
    .innerJoin('pet as p6', 'p6.owner_id', 'person.id')
    .innerJoin('pet as p7', 'p7.owner_id', 'person.id')
    .innerJoin('pet as p8', 'p8.owner_id', 'person.id')
    .innerJoin('pet as p9', 'p9.owner_id', 'person.id')
    .innerJoin('pet as p10', 'p10.owner_id', 'person.id')
    .innerJoin('pet as p11', 'p11.owner_id', 'person.id')
    .innerJoin('pet as p12', 'p12.owner_id', 'person.id')
    .innerJoin('pet as p13', 'p13.owner_id', 'person.id')
    .innerJoin('pet as p14', 'p14.owner_id', 'person.id')
    .innerJoin('pet as p15', 'p15.owner_id', 'person.id')
    .innerJoin('pet as p16', 'p16.owner_id', 'person.id')
    .innerJoin('pet as p17', 'p17.owner_id', 'person.id')
    .innerJoin('pet as p18', 'p18.owner_id', 'person.id')
    .innerJoin('pet as p19', 'p19.owner_id', 'person.id')
    .innerJoin('pet as p20', 'p20.owner_id', 'person.id')
    .select(['age', 'last_name'])
    .executeTakeFirstOrThrow()

  expectType<{ age: number; last_name: string | null }>(r1)

  const r2 = await db
    .selectFrom('person')
    .rightJoin('pet as p1', 'p1.owner_id', 'person.id')
    .rightJoin('pet as p2', 'p2.owner_id', 'person.id')
    .rightJoin('pet as p3', 'p3.owner_id', 'person.id')
    .rightJoin('pet as p4', 'p4.owner_id', 'person.id')
    .rightJoin('pet as p5', 'p5.owner_id', 'person.id')
    .rightJoin('pet as p6', 'p6.owner_id', 'person.id')
    .rightJoin('pet as p7', 'p7.owner_id', 'person.id')
    .rightJoin('pet as p8', 'p8.owner_id', 'person.id')
    .rightJoin('pet as p9', 'p9.owner_id', 'person.id')
    .rightJoin('pet as p10', 'p10.owner_id', 'person.id')
    .rightJoin('pet as p11', 'p11.owner_id', 'person.id')
    .rightJoin('pet as p13', 'p13.owner_id', 'person.id')
    .rightJoin('pet as p14', 'p14.owner_id', 'person.id')
    .rightJoin('pet as p15', 'p15.owner_id', 'person.id')
    .rightJoin('pet as p16', 'p16.owner_id', 'person.id')
    .rightJoin('pet as p17', 'p17.owner_id', 'person.id')
    .rightJoin('pet as p18', 'p18.owner_id', 'person.id')
    .rightJoin('pet as p19', 'p19.owner_id', 'person.id')
    .rightJoin('pet as p20', 'p20.owner_id', 'person.id')
    .select(['age', 'last_name'])
    .executeTakeFirstOrThrow()

  expectType<{ age: number | null; last_name: string | null }>(r2)

  const r3 = await db
    .selectFrom('person')
    .leftJoin('pet as p1', (join) =>
      join.onRef('p1.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p2', (join) =>
      join.onRef('p2.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p3', (join) =>
      join.onRef('p3.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p4', (join) =>
      join.onRef('p4.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p5', (join) =>
      join.onRef('p5.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p6', (join) =>
      join.onRef('p6.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p7', (join) =>
      join.onRef('p7.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p8', (join) =>
      join.onRef('p8.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p9', (join) =>
      join.onRef('p9.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p10', (join) =>
      join.onRef('p10.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p11', (join) =>
      join.onRef('p11.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p12', (join) =>
      join.onRef('p12.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p13', (join) =>
      join.onRef('p13.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p14', (join) =>
      join.onRef('p14.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p15', (join) =>
      join.onRef('p15.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p16', (join) =>
      join.onRef('p16.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p17', (join) =>
      join.onRef('p17.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p18', (join) =>
      join.onRef('p18.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p19', (join) =>
      join.onRef('p19.owner_id', '=', 'person.id'),
    )
    .leftJoin('pet as p20', (join) =>
      join.onRef('p20.owner_id', '=', 'person.id'),
    )
    .select(['age', 'last_name'])
    .executeTakeFirstOrThrow()

  expectType<{ age: number; last_name: string | null }>(r3)
}
