import { Kysely, ExpressionBuilder, SelectQueryBuilder, Generated } from '..'

import { expectAssignable, expectType } from 'tsd'
import { Database } from '../shared'

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
        parent: { id: string | null }
        petJoin: { name: string | null }
      },
      'parent' | 'petJoin'
    >
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

async function testGenericSelect<T extends keyof Database>(
  db: Kysely<Database>,
  table: T
) {
  const r1 = await db.selectFrom(table).select('id').executeTakeFirstOrThrow()
  expectAssignable<string | number>(r1.id)
}

async function testGenericUpdate(db: Kysely<Database>, table: 'pet' | 'movie') {
  await db.updateTable(table).set({ id: '123' }).execute()
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
