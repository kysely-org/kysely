import {
  Kysely,
  ExpressionBuilder,
  SelectQueryBuilder,
  Generated,
  Nullable,
  Selectable,
  SelectType,
} from '..'

import { expectAssignable, expectType } from 'tsd'
import { Database, Movie, Person } from '../shared'

// TODO: type-checking this is crazy slow. Figure out the cause.
function testSelectQueryBuilderExtends() {
  type A = { a: number }
  type B = { b: string }

  type T1 = SelectQueryBuilder<{ a: A }, 'a', unknown>

  // This type extends T1 and should be assignable to it.
  type T2 = SelectQueryBuilder<{ a: A; b: B }, 'a' | 'b', { a: number }>

  const t2 = {} as T2
  expectAssignable<T1>(t2)
}

// TODO: type-checking this is crazy slow. Figure out the cause.
function testExpressionBuilderExtends() {
  type A = { a: number }
  type B = { b: string }

  type T1 = ExpressionBuilder<{ a: A }, 'a'>

  // This type extends T1 and should be assignable to it.
  type T2 = ExpressionBuilder<{ a: A; b: B }, 'a' | 'b'>

  const t2 = {} as T2
  expectAssignable<T1>(t2)
}

// TODO: type-checking this is crazy slow. Figure out the cause.
function testExpressionBuilderExtendsFuncArg() {
  type A = { a: number }
  type B = { b: string }
  type C = { c: boolean }

  // This type extends T1 and should be assignable to it.
  type T2 = ExpressionBuilder<{ a: A; b: B; c: C }, 'a' | 'b' | 'c'>

  function test(eb: ExpressionBuilder<{ a: A; b: B; c: C }, 'b' | 'c'>) {
    console.log(eb)
  }

  const t2 = {} as T2
  test(t2)
}

// TODO: type-checking this is crazy slow. Figure out the cause.
async function testGenericSelectHelper() {
  type Parent = { id: Generated<string> }
  type Person = { id: Generated<string>; parent_id: string }
  type Pet = { owner_id: string; name: string }
  const db: Kysely<{ person: Person; parent: Parent; pet: Pet }> = undefined!

  function personPetSelect(
    eb: ExpressionBuilder<
      {
        parent: Nullable<Pick<Parent, 'id'>>
        petJoin: Nullable<Pick<Pet, 'owner_id'>>
      },
      'parent' | 'petJoin'
    >,
  ) {
    return ['parent.id'] as const
  }

  const result = await db
    .selectFrom('parent')
    .leftJoin('person as personJoin', 'personJoin.parent_id', 'parent.id')
    .leftJoin('pet as petJoin', 'petJoin.owner_id', 'personJoin.id')
    .select(personPetSelect)
    .execute()
}

async function testSelectsInVariable(db: Kysely<Database>) {
  const selects = [
    'first_name',
    (eb: ExpressionBuilder<Database, 'person'>) =>
      eb
        .selectFrom('pet')
        .select('name')
        .whereRef('pet.owner_id', '=', 'person.id')
        .as('pet_name'),
  ] as const

  const r1 = await db
    .selectFrom('person')
    .select(selects)
    .executeTakeFirstOrThrow()

  expectType<{ first_name: string; pet_name: string | null }>(r1)
}

async function testSelectFromDynamic(db: Kysely<Database>) {
  const r1 = await getIdDynamic(db, 'person')
  expectType<{ id: number }>(r1)

  const r2 = await getIdDynamic(db, 'pet')
  expectType<{ id: string }>(r2)

  const r3 = await getRowDynamic(db, 'movie')
  expectType<Selectable<Movie>>(r3)

  const r4 = await getRowDynamic(db, 'person')
  expectType<Selectable<Person>>(r4)

  const r5 = await getRowByColumnDynamic(db, 'person', 'first_name', 'Jennifer')
  expectType<Selectable<Person>>(r5)
}

async function getIdDynamic<T extends 'person' | 'pet'>(
  db: Kysely<Database>,
  t: T,
) {
  const { table } = db.dynamic

  return await db
    .selectFrom(table(t).as('t'))
    .select('t.id')
    .executeTakeFirstOrThrow()
}

async function getRowDynamic<T extends keyof Database>(
  db: Kysely<Database>,
  t: T,
) {
  const { table } = db.dynamic

  return await db
    .selectFrom(table(t).as('t'))
    .selectAll('t')
    .executeTakeFirstOrThrow()
}

async function getRowByColumnDynamic<
  T extends keyof Database,
  C extends keyof Database[T] & string,
  V extends SelectType<Database[T][C]>,
>(db: Kysely<Database>, t: T, c: C, v: V) {
  const { table, ref } = db.dynamic

  return await db
    .selectFrom(table(t).as('t'))
    .selectAll()
    .where(ref(c), '=', v)
    .orderBy('t.id')
    .executeTakeFirstOrThrow()
}
