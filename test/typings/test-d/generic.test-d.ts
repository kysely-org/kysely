import type {
  ControlledTransaction,
  Kysely,
  ExpressionBuilder,
  SelectQueryBuilder,
  Generated,
  Nullable,
  Selectable,
  SelectType,
  Transaction,
} from '../index.js'

import { expectAssignable, expectNotAssignable, expectType } from 'tsd'
import type { Database, Movie, Person } from '../shared.js'

// The tests below relate two different instantiations of the same builder type.
//
// To do that, TypeScript first needs the variance of each type parameter. Nothing
// declares it, so the compiler measures it: it instantiates the type twice with
// synthetic marker types and relates the two results structurally, member by
// member. For these builders that measurement comes back "unreliable" - they
// mention their `DB`/`TB` parameters under `keyof` and in conditional types - so
// every comparison then *also* falls back to the same structural walk. That makes
// these the most expensive type-level operations in the library, and three rules
// keep them in check. Breaking any of them is easy to do by accident, and expensive:
//
//   1. A method that accepts a `DB`/`TB`-parameterized expression type must keep it
//      behind a generic type parameter (`limit<VE extends ValueExpression<...>>(v: VE)`,
//      not `limit(v: ValueExpression<...>)`). Otherwise the comparison expands the
//      whole expression union, which pulls in `ExpressionBuilder`, which pulls in
//      `SelectQueryBuilder` again.
//
//   2. A method whose result type is computed from the arguments must converge when
//      asked what it returns for an *unknown* argument, because that is what the
//      compiler computes while comparing two builders. If it instead expands into a
//      union of builders, the comparison recurses until the compiler's internal
//      limit - and that limit is not the same across TypeScript versions. The join
//      result types guard against this with `TableExpression<DB, TB> extends TE`, and
//      `UpdateQueryBuilder.$if`/`DeleteQueryBuilder.$if` with `unknown extends O2`.
//
//   3. A type that is only ever related at a single `DB` should declare its variance
//      instead, with an `in out` annotation. That skips the measurement entirely, and
//      with it the recursion - it is what makes relating two `Kysely` types free. This
//      is only available to types that don't need the structural fallback: the query
//      builders let a wider builder stand in for a narrower one (the first tests
//      below), which is bivariance, and bivariance can't be spelled as an annotation.
//
// Note that a rule 2 guard is only worth adding where it *replaces* a conditional that
// would otherwise expand into a union of builders. Adding one to a result type that is
// already a single type makes things dramatically worse, because the guard is itself a
// conditional - it was measured at 15x on `Kysely.$extendTables` and friends. Not every
// expensive comparison is worth guarding either: the guard has a fixed cost of its own,
// so it only pays where the recursion actually blows up.
//
// See `test/ts-benchmarks/generic.bench.ts`.
function testSelectQueryBuilderExtends() {
  type A = { a: number }
  type B = { b: string }

  type T1 = SelectQueryBuilder<{ a: A }, 'a', unknown>

  // This type extends T1 and should be assignable to it.
  type T2 = SelectQueryBuilder<{ a: A; b: B }, 'a' | 'b', { a: number }>

  const t2 = {} as T2
  expectAssignable<T1>(t2)
}

function testExpressionBuilderExtends() {
  type A = { a: number }
  type B = { b: string }

  type T1 = ExpressionBuilder<{ a: A }, 'a'>

  // This type extends T1 and should be assignable to it.
  type T2 = ExpressionBuilder<{ a: A; b: B }, 'a' | 'b'>

  const t2 = {} as T2
  expectAssignable<T1>(t2)
}

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

// `Kysely` and the transaction types declare `DB` as `in out` (rule 3 above).
function testKyselyAssignability() {
  type A = { a: number }
  type B = { b: string }

  // Written out a second time on purpose: an identical *type* short-circuits the
  // whole comparison, so it wouldn't test anything. Two separately written but
  // mutually assignable databases is the case that has to go through variance.
  const db = {} as Kysely<{ a: A; b: B }>
  const trx = {} as Transaction<{ a: A; b: B }>
  const controlled = {} as ControlledTransaction<{ a: A; b: B }>

  expectAssignable<Kysely<{ a: { a: number }; b: { b: string } }>>(db)

  // A transaction can stand in for a `Kysely`, but not the other way around.
  expectAssignable<Kysely<{ a: A; b: B }>>(trx)
  expectAssignable<Kysely<{ a: A; b: B }>>(controlled)
  expectAssignable<Transaction<{ a: A; b: B }>>(controlled)
  expectNotAssignable<Transaction<{ a: A; b: B }>>(db)

  // A `Kysely` over a *different* database is not interchangeable, in either
  // direction. Use `$omitTables`/`$pickTables`/`$extendTables` to change it.
  //
  // Both of these used to be allowed, but only because the compiler didn't trust
  // the variance it had measured and fell back to comparing the two structurally,
  // where the methods match bivariantly. It was never a variance the library could
  // have declared - TypeScript rejects `out DB` on `Kysely` with TS2636 - and the
  // second one is unsound: it hands you a `Kysely` typed with a table the
  // underlying database doesn't have.
  expectNotAssignable<Kysely<{ a: A }>>(db)
  expectNotAssignable<Kysely<{ a: A; b: B }>>({} as Kysely<{ a: A }>)
}

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

async function getRowByIdDynamic<
  T extends keyof Database,
  ID extends SelectType<Database[T]['id']>,
>(db: Kysely<Database>, t: T, id: ID) {
  const { table } = db.dynamic

  return await db
    .selectFrom(table(t).as('t'))
    .selectAll('t')
    .where('id', '=', id as any)
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
