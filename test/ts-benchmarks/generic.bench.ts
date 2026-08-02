import { bench } from '@ark/attest'
import type {
  ControlledTransaction,
  DeleteQueryBuilder,
  ExpressionBuilder,
  Generated,
  InsertQueryBuilder,
  Kysely,
  MergeQueryBuilder,
  Nullable,
  SelectQueryBuilder,
  Transaction,
  UpdateQueryBuilder,
  WheneableMergeQueryBuilder,
} from '../../dist/index.js'
import type {
  ReadonlyControlledTransaction,
  ReadonlyKysely,
  ReadonlyTransaction,
} from '../../dist/readonly/index.js'

// These benchmarks cover the scenarios in `test/typings/test-d/generic.test-d.ts`.
// They all relate two different instantiations of the same builder type, which
// TypeScript can only do by comparing them structurally, member by member. That
// makes them by far the most expensive type-level operations Kysely users hit,
// so they're worth guarding against regressions.
//
// Every builder whose methods return a *computed* builder type recurses this way,
// so each one gets a case here. Watch the ratio between TypeScript versions too,
// not just the absolute numbers: these comparisons are only bounded by the
// compiler's internal recursion limit unless the computed return types converge,
// and that limit is not the same across versions.

type A = { a: number }
type B = { b: string }
type C = { c: boolean }

type Parent = { id: Generated<string> }
type Person = { id: Generated<string>; parent_id: string }
type Pet = { owner_id: string; name: string }

declare const wideSelectQueryBuilder: SelectQueryBuilder<
  { a: A; b: B },
  'a' | 'b',
  { a: number }
>
declare function acceptsNarrowSelectQueryBuilder(
  qb: SelectQueryBuilder<{ a: A }, 'a', unknown>,
): void

declare const wideExpressionBuilder: ExpressionBuilder<
  { a: A; b: B },
  'a' | 'b'
>
declare function acceptsNarrowExpressionBuilder(
  eb: ExpressionBuilder<{ a: A }, 'a'>,
): void

declare const threeTableExpressionBuilder: ExpressionBuilder<
  { a: A; b: B; c: C },
  'a' | 'b' | 'c'
>
declare function acceptsTwoTableExpressionBuilder(
  eb: ExpressionBuilder<{ a: A; b: B; c: C }, 'b' | 'c'>,
): void

declare const kysely: Kysely<{ person: Person; parent: Parent; pet: Pet }>

// The other builders that compute their result types from their arguments. Their
// `DeleteResult`/`UpdateResult` handling means widening `DB` isn't assignable the
// way it is for `SelectQueryBuilder`, so these narrow `TB` and widen `O` instead.
declare const wideDeleteQueryBuilder: DeleteQueryBuilder<
  { a: A; b: B },
  'a' | 'b',
  { a: number }
>
declare function acceptsNarrowDeleteQueryBuilder(
  qb: DeleteQueryBuilder<{ a: A; b: B }, 'a', unknown>,
): void

declare const wideInsertQueryBuilder: InsertQueryBuilder<
  { a: A; b: B },
  'a',
  { a: number }
>
declare function acceptsNarrowInsertQueryBuilder(
  qb: InsertQueryBuilder<{ a: A; b: B }, 'a', unknown>,
): void

declare const wideUpdateQueryBuilder: UpdateQueryBuilder<
  { a: A; b: B },
  'a',
  'a' | 'b',
  { a: number }
>
declare function acceptsNarrowUpdateQueryBuilder(
  qb: UpdateQueryBuilder<{ a: A; b: B }, 'a', 'a', unknown>,
): void

declare const wideMergeQueryBuilder: WheneableMergeQueryBuilder<
  { a: A; b: B },
  'a',
  'a' | 'b',
  { a: number }
>
declare function acceptsNarrowMergeQueryBuilder(
  qb: WheneableMergeQueryBuilder<{ a: A; b: B }, 'a', 'a', unknown>,
): void

// `MergeQueryBuilder.using()` returns a computed type, the same shape that makes
// the join result types expensive.
declare const wideMergeInto: MergeQueryBuilder<
  { a: A; b: B },
  'a' | 'b',
  { a: number }
>
declare function acceptsNarrowMergeInto(
  qb: MergeQueryBuilder<{ a: A; b: B }, 'a', unknown>,
): void

declare function selectParentId(
  eb: ExpressionBuilder<
    {
      parent: Nullable<Pick<Parent, 'id'>>
      petJoin: Nullable<Pick<Pet, 'owner_id'>>
    },
    'parent' | 'petJoin'
  >,
): readonly ['parent.id']

declare const plainKysely: Kysely<{ a: A; b: B }>
declare const transaction: Transaction<{ a: A; b: B }>
declare function acceptsKysely(db: Kysely<{ a: A; b: B }>): void

declare const controlledTransaction: ControlledTransaction<{ a: A; b: B }>
declare function acceptsTransaction(trx: Transaction<{ a: A; b: B }>): void

declare const readonlyKysely: ReadonlyKysely<{ a: A; b: B }>
declare const readonlyTransaction: ReadonlyTransaction<{ a: A; b: B }>
declare const readonlyControlledTransaction: ReadonlyControlledTransaction<{
  a: A
  b: B
}>
declare function acceptsReadonlyKysely(db: ReadonlyKysely<{ a: A; b: B }>): void
declare function acceptsReadonlyTransaction(
  trx: ReadonlyTransaction<{ a: A; b: B }>,
): void

console.log('generic.bench.ts:\n')

bench.baseline(() => {})

bench('SelectQueryBuilder assignable to narrower SelectQueryBuilder', () => {
  return acceptsNarrowSelectQueryBuilder(wideSelectQueryBuilder)
}).types([45134, 'instantiations'])

bench('ExpressionBuilder assignable to narrower ExpressionBuilder', () => {
  return acceptsNarrowExpressionBuilder(wideExpressionBuilder)
}).types([55494, 'instantiations'])

bench('ExpressionBuilder passed to function expecting fewer tables', () => {
  return acceptsTwoTableExpressionBuilder(threeTableExpressionBuilder)
}).types([55545, 'instantiations'])

bench('select(genericSelectHelper) on a left joined query', () => {
  return kysely
    .selectFrom('parent')
    .leftJoin('person as personJoin', 'personJoin.parent_id', 'parent.id')
    .leftJoin('pet as petJoin', 'petJoin.owner_id', 'personJoin.id')
    .select(selectParentId)
}).types([57871, 'instantiations'])

bench('DeleteQueryBuilder assignable to narrower DeleteQueryBuilder', () => {
  return acceptsNarrowDeleteQueryBuilder(wideDeleteQueryBuilder)
}).types([10919, 'instantiations'])

bench('InsertQueryBuilder assignable to narrower InsertQueryBuilder', () => {
  return acceptsNarrowInsertQueryBuilder(wideInsertQueryBuilder)
}).types([2614, 'instantiations'])

bench('UpdateQueryBuilder assignable to narrower UpdateQueryBuilder', () => {
  return acceptsNarrowUpdateQueryBuilder(wideUpdateQueryBuilder)
}).types([91178, 'instantiations'])

bench('WheneableMergeQueryBuilder assignable to a narrower one', () => {
  return acceptsNarrowMergeQueryBuilder(wideMergeQueryBuilder)
}).types([7573, 'instantiations'])

bench('MergeQueryBuilder assignable to narrower MergeQueryBuilder', () => {
  return acceptsNarrowMergeInto(wideMergeInto)
}).types([22733, 'instantiations'])

bench('Kysely assignable to Kysely', () => {
  return acceptsKysely(plainKysely)
}).types([2, 'instantiations'])

bench('Transaction assignable to Kysely', () => {
  return acceptsKysely(transaction)
}).types([50, 'instantiations'])

bench('ControlledTransaction assignable to Kysely', () => {
  return acceptsKysely(controlledTransaction)
}).types([64, 'instantiations'])

bench('ControlledTransaction assignable to Transaction', () => {
  return acceptsTransaction(controlledTransaction)
}).types([136150, 'instantiations'])

// The read-only mirror of the four cases above. It has the same shape for the
// same reason, and had the same problem: before `ReadonlyTransaction` became an
// intersection, the second of these cost 1.3M instantiations on TypeScript 7.
bench('ReadonlyKysely assignable to ReadonlyKysely', () => {
  return acceptsReadonlyKysely(readonlyKysely)
}).types([26, 'instantiations'])

bench('ReadonlyTransaction assignable to ReadonlyKysely', () => {
  return acceptsReadonlyKysely(readonlyTransaction)
}).types([101, 'instantiations'])

bench('ReadonlyControlledTransaction assignable to ReadonlyKysely', () => {
  return acceptsReadonlyKysely(readonlyControlledTransaction)
}).types([131, 'instantiations'])

bench('ReadonlyControlledTransaction assignable to ReadonlyTransaction', () => {
  return acceptsReadonlyTransaction(readonlyControlledTransaction)
}).types([74677, 'instantiations'])
