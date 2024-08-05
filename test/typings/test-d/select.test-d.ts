import {expectError, expectType} from 'tsd'
import {
  ColumnType,
  Expression,
  Generated,
  Kysely,
  NotNull,
  RawBuilder,
  Selectable,
  Simplify,
  sql,
} from '..'
import {Database, Person, PersonMetadata} from '../shared'

async function testSelectSingle(db: Kysely<Database>) {
  const qb = db.selectFrom('person')

  // Column name
  const [r1] = await qb.select('id').execute()
  expectType<{ id: number }>(r1)

  // Table name and column name
  const [r2] = await qb.select('person.gender').execute()
  expectType<{ gender: 'male' | 'female' | 'other' }>(r2)

  // Table name and column name with alias
  const [r3] = await qb.select('person.age as a').execute()
  expectType<{ a: number }>(r3)

  // Raw selection
  const [r4] = await qb
    .select(sql<boolean>`random() > 0.5`.as('rando'))
    .execute()

  expectType<{ rando: boolean }>(r4)

  // Raw selection with a dynamic alias.
  const alias = 'col_' + Math.round(Math.random() * 1000)
  const [r5] = await qb
    .select(sql`random() > 0.5`.as(alias))
    .select('first_name')
    .execute()
  expectType<{ first_name: string; [key: string]: unknown }>(r5)

  // Subquery
  const [r6] = await qb
    .select(db.selectFrom('movie').select('id').as('movie_id'))
    .execute()
  expectType<{ movie_id: string | null }>(r6)

  // Subquery factory
  const [r7] = await qb
    .select((qb) =>
      qb
        .selectFrom('movie')
        .whereRef('movie.id', '=', 'person.id')
        .select('movie.id')
        .as('movie_id'),
    )
    .execute()
  expectType<{ movie_id: string | null }>(r7)

  // Aliased table
  const [r8] = await db.selectFrom('pet as p').select('p.name').execute()
  expectType<{ name: string }>(r8)

  // Table with schema
  const [r9] = await db
    .selectFrom('some_schema.movie')
    .select('some_schema.movie.id')
    .execute()
  expectType<{ id: string }>(r9)

  // Aliased table with schema and selection with alias
  const [r10] = await db
    .selectFrom('some_schema.movie as sm')
    .select('sm.id as identifier')
    .execute()
  expectType<{ identifier: string }>(r10)

  // Column name with alias
  const [r11] = await qb.select('id as identifier').execute()
  expectType<{ identifier: number }>(r11)

  // FunctionModule call
  const [r12] = await qb
    .select(db.fn.max('first_name').as('max_first_name'))
    .execute()
  expectType<{ max_first_name: string }>(r12)

  // FunctionModule call through expression builder
  const [r13] = await qb
    .select((qb) => qb.fn.max('first_name').as('max_first_name'))
    .execute()
  expectType<{ max_first_name: string }>(r13)

  // FunctionModule count call
  const { count } = db.fn
  const r14 = await qb
    .select(count<number>('id').as('count'))
    .executeTakeFirstOrThrow()
  expectType<{ count: number }>(r14)

  expectError(qb.select('not_property'))
  expectError(qb.select('person.not_property'))
  expectError(qb.select('person.not_property as np'))

  // Narrow Type
  type NarrowTarget =
    | { queue_id: string; callback_url: null }
    | { queue_id: null; callback_url: string }

  const [r15] = await db
    .selectFrom('action')
    .select(['callback_url', 'queue_id'])
    .$narrowType<NarrowTarget>()
    .execute()

  // Narrow not null
  const [r16] = await db
    .selectFrom('action')
    .select(['callback_url', 'queue_id'])
    .$narrowType<{ callback_url: NotNull }>()
    .execute()

  expectType<string>(r16.callback_url)
  expectType<string | null>(r16.queue_id)

  const [r17] = await db
    .selectFrom('action')
    .select(['callback_url', 'queue_id'])
    .$narrowType<{ callback_url: NotNull; queue_id: NotNull }>()
    .execute()

  expectType<string>(r17.callback_url)
  expectType<string>(r17.queue_id)
}

async function testSelectAll(db: Kysely<Database>) {
  // Select all when there's only one table to select from
  const r1 = await db.selectFrom('person').selectAll().executeTakeFirstOrThrow()

  expectType<Selectable<Person>>(r1)

  // Select all when there's two tables to select from
  const r2 = await db
    .selectFrom(['person', 'pet'])
    .selectAll()
    .executeTakeFirstOrThrow()

  expectType<{
    id: string | number
    name: string
    first_name: string
    last_name: string | null
    age: number
    gender: 'other' | 'male' | 'female'
    marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
    modified_at: Date
    owner_id: number
    species: 'dog' | 'cat'
    deleted_at: Date | null
  }>(r2)

  // Select all from a single table when there are two tables to select from
  const r3 = await db
    .selectFrom(['person', 'pet'])
    .selectAll('person')
    .executeTakeFirstOrThrow()

  expectType<Selectable<Person>>(r3)

  // Two selectAll('table') calls should accumulate selections.
  const [r4] = await db
    .selectFrom([
      db.selectFrom('person').select('id as person_id').as('per'),
      db.selectFrom('pet').select('id as pet_id').as('pet'),
    ])
    .selectAll('per')
    .selectAll('pet')
    .execute()

  expectType<{ person_id: number; pet_id: string }>(r4)

  // Select all from two tables when there's two tables to select from
  const r5 = await db
    .selectFrom(['person', 'pet'])
    .selectAll(['person', 'pet'])
    .executeTakeFirstOrThrow()

  expectType<{
    id: string | number
    name: string
    first_name: string
    last_name: string | null
    age: number
    gender: 'other' | 'male' | 'female'
    marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
    modified_at: Date
    owner_id: number
    species: 'dog' | 'cat'
    deleted_at: Date | null
  }>(r5)
}

async function testSelectMultiple(db: Kysely<Database>) {
  const qb = db
    .selectFrom([
      'person',
      (qb) =>
        qb
          .selectFrom('movie')
          .select(['movie.stars', 'movie.id as movie_id'])
          .as('m'),
    ])
    .innerJoin('pet as p', 'id', 'id')

  const [r1] = await qb
    .select([
      'first_name',
      'person.age',
      'species as sp',
      'p.name as pet_name',
      'm.stars',
      'movie_id',
      sql<number>`random()`.as('rand1'),
      sql<number>`random()`.as('rand2'),
      (qb) => qb.selectFrom('pet').select('pet.id').as('sub'),
    ])
    .execute()

  expectType<{
    first_name: string
    age: number
    sp: 'dog' | 'cat'
    pet_name: string
    stars: number
    movie_id: string
    rand1: number
    rand2: number
    sub: string | null
  }>(r1)

  expectError(qb.select(['person.id', 'notColumn']))
  expectError(qb.select(['person.id', 'person.notColumn']))
  expectError(qb.select(['person.id', 'person.notColumn as foo']))
}

async function testSelectDynamic(db: Kysely<Database>) {
  const dynamicColumn = Math.random().toString()

  // Single dynamic column name
  const [r1] = await db
    .selectFrom('person')
    .select(db.dynamic.ref(dynamicColumn))
    .execute()
  expectType<{}>(r1)

  // Single dynamic column name with column options
  const [r2] = await db
    .selectFrom('person')
    .select(db.dynamic.ref<'first_name' | 'age'>(dynamicColumn))
    .execute()
  expectType<{ first_name: string | undefined; age: number | undefined }>(r2)

  // Static selections and a dynamic one
  const [r3] = await db
    .selectFrom('person')
    .select(['last_name', db.dynamic.ref(dynamicColumn)])
    .execute()
  expectType<{
    last_name: string | null
  }>(r3)

  // Static selections and a dynamic one
  const [r4] = await db
    .selectFrom(['person', 'pet'])
    .select([
      'last_name',
      db.dynamic.ref<'first_name' | 'person.age'>(dynamicColumn),
      db.dynamic.ref<'pet.name' | 'doesnt_exist'>(dynamicColumn),
    ])
    .execute()

  expectType<{
    last_name: string | null
    first_name: string | undefined
    age: number | undefined
    name: string | undefined
    doesnt_exist: never | undefined
  }>(r4)
}

async function testIf(db: Kysely<Database>) {
  const r = await db
    .selectFrom('person')
    .select('id')
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f1'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f2'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f3'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f4'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f5'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f6'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f7'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f8'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f9'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f10'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f11'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f12'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f13'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f14'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f15'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f16'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f17'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f18'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f19'))
    .$if(Math.random() < 0.5, (qb) => qb.select('first_name as f20'))
    .executeTakeFirstOrThrow()

  expectType<{
    id: number
    f1?: string
    f2?: string
    f3?: string
    f4?: string
    f5?: string
    f6?: string
    f7?: string
    f8?: string
    f9?: string
    f10?: string
    f11?: string
    f12?: string
    f13?: string
    f14?: string
    f15?: string
    f16?: string
    f17?: string
    f18?: string
    f19?: string
    f20?: string
  }>(r)
}

async function testManyNestedSubqueries(db: Kysely<Database>) {
  const r = await db
    .selectFrom('person as p1')
    .select((eb1) => [
      'p1.id',
      jsonArrayFrom(
        eb1
          .selectFrom('pet as pet1')
          .whereRef('pet1.owner_id', '=', 'p1.id')
          .select((eb2) => [
            'pet1.id',
            jsonObjectFrom(
              eb2
                .selectFrom('person as p2')
                .whereRef('p2.id', '=', 'pet1.owner_id')
                .select((eb3) => [
                  'p2.id',
                  jsonArrayFrom(
                    eb3
                      .selectFrom('pet as pet2')
                      .whereRef('pet2.owner_id', '=', 'p2.id')
                      .select((eb4) => [
                        'pet2.id',
                        jsonObjectFrom(
                          eb4
                            .selectFrom('person as p3')
                            .whereRef('p3.id', '=', 'pet2.owner_id')
                            .select((eb5) => [
                              'p3.id',
                              jsonArrayFrom(
                                eb5
                                  .selectFrom('pet as pet3')
                                  .whereRef('pet3.owner_id', '=', 'p3.id')
                                  .select((eb6) => [
                                    'pet3.id',
                                    jsonObjectFrom(
                                      eb6
                                        .selectFrom('person as p4')
                                        .whereRef('p4.id', '=', 'pet3.owner_id')
                                        .select((eb7) => [
                                          'p4.id',
                                          jsonArrayFrom(
                                            eb7
                                              .selectFrom('pet as pet4')
                                              .whereRef(
                                                'pet4.owner_id',
                                                '=',
                                                'p4.id',
                                              )
                                              .select((eb8) => [
                                                'pet4.id',
                                                jsonObjectFrom(
                                                  eb8
                                                    .selectFrom('person as p5')
                                                    .whereRef(
                                                      'p5.id',
                                                      '=',
                                                      'pet4.owner_id',
                                                    )
                                                    .select('p5.id'),
                                                ).as('owner'),
                                              ]),
                                          ).as('pets'),
                                        ]),
                                    ).as('owner'),
                                  ]),
                              ).as('pets'),
                            ]),
                        ).as('owner'),
                      ]),
                  ).as('pets'),
                ]),
            ).as('owner'),
          ]),
      ).as('pets'),
    ])
    .executeTakeFirstOrThrow()

  expectType<{
    id: number
    pets: {
      id: string
      owner: {
        id: number
        pets: {
          id: string
          owner: {
            id: number
            pets: {
              id: string
              owner: {
                id: number
                pets: {
                  id: string
                  owner: { id: number } | null
                }[]
              } | null
            }[]
          } | null
        }[]
      } | null
    }[]
  }>(r)
}

type Json = JsonValue

type JsonArray = JsonValue[]

type JsonObject = {
  [K in string]?: JsonValue
}

type JsonPrimitive = boolean | number | string | null

type JsonValue = JsonArray | JsonObject | JsonPrimitive
type ArrayType<T> =
  ArrayTypeImpl<T> extends (infer U)[] ? U[] : ArrayTypeImpl<T>

type ArrayTypeImpl<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S[], I[], U[]>
    : T[]
type PGGenDatabase = Omit<Database, 'person_metadata'> & {
  person_metadata: Omit<PersonMetadata, 'experience'> & {
    experience: Generated<ArrayType<Json>>
  }
}
async function testSelectConflicts(db: Kysely<PGGenDatabase>) {
  const r1 = await db
    .selectFrom('person_metadata')
    .select('experience')
    .select(({ fn }) => [
      fn<{ establishment: string }[]>('to_json', ['experience']).as(
        'experience',
      ),
    ])
    .executeTakeFirstOrThrow()

  expectType<{
    experience: {
      establishment: string
    }[]}>(r1)

  const r2 = await db
    .selectFrom('person_metadata')
    .select(() => sql<number>`1`.as('answer'))
    .select(sql<string>`foo`.as('answer'))
    .select([sql<boolean>`true`.as('answer')])
    .executeTakeFirstOrThrow()

  expectType<{answer: boolean}>(r2)
}

export function jsonArrayFrom<O>(
  expr: Expression<O>,
): RawBuilder<Simplify<O>[]> {
  return sql`(select coalesce(json_agg(agg), '[]') from ${expr} as agg)`
}

export function jsonObjectFrom<O>(
  expr: Expression<O>,
): RawBuilder<Simplify<O> | null> {
  return sql`(select to_json(obj) from ${expr} as obj)`
}
