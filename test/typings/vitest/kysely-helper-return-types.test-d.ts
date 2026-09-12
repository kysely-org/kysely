import { expectTypeOf, test } from 'vitest'
import type {
  ControlledTransaction,
  Generated,
  Kysely,
  Transaction,
} from '../../../dist/index.js'
import type {
  ReadonlyControlledTransaction,
  ReadonlyKysely,
  ReadonlyTransaction,
} from '../../../dist/readonly/index.js'
import type { DatabaseA, DatabaseAB, Row } from './assignability.fixtures.js'

type DatabaseOf<T> =
  T extends ControlledTransaction<infer DB, any>
    ? DB
    : T extends Transaction<infer DB>
      ? DB
      : T extends Kysely<infer DB>
        ? DB
        : T extends ReadonlyControlledTransaction<infer DB, any>
          ? DB
          : T extends ReadonlyTransaction<infer DB>
            ? DB
            : T extends ReadonlyKysely<infer DB>
              ? DB
              : never

type SchemaOf<T, DB = DatabaseOf<T>> = { [K in keyof DB]: DB[K] }

type Extra = { c: { id: Generated<number> } }
type Extended = { a: Row; b: Row; c: { id: Generated<number> } }

test('Kysely.$extendTables retains the exact schema in ReturnType', () => {
  const source = null! as Kysely<DatabaseAB>
  type Result = ReturnType<typeof source.$extendTables<Extra>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<Extended>()
})

test('Kysely.withTables retains the exact schema in ReturnType', () => {
  const source = null! as Kysely<DatabaseAB>
  type Result = ReturnType<typeof source.withTables<Extra>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<Extended>()
})

test('Kysely.$pickTables retains the exact schema in ReturnType', () => {
  const source = null! as Kysely<DatabaseAB>
  type Result = ReturnType<typeof source.$pickTables<'a'>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<DatabaseA>()
})

test('Kysely.$omitTables retains the exact schema in ReturnType', () => {
  const source = null! as Kysely<DatabaseAB>
  type Result = ReturnType<typeof source.$omitTables<'b'>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<DatabaseA>()
})

test('Transaction.$extendTables retains the exact schema in ReturnType', () => {
  const source = null! as Transaction<DatabaseAB>
  type Result = ReturnType<typeof source.$extendTables<Extra>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<Extended>()
})

test('Transaction.withTables retains the exact schema in ReturnType', () => {
  const source = null! as Transaction<DatabaseAB>
  type Result = ReturnType<typeof source.withTables<Extra>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<Extended>()
})

test('Transaction.$pickTables retains the exact schema in ReturnType', () => {
  const source = null! as Transaction<DatabaseAB>
  type Result = ReturnType<typeof source.$pickTables<'a'>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<DatabaseA>()
})

test('Transaction.$omitTables retains the exact schema in ReturnType', () => {
  const source = null! as Transaction<DatabaseAB>
  type Result = ReturnType<typeof source.$omitTables<'b'>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<DatabaseA>()
})

test('ControlledTransaction.$extendTables retains the exact schema in ReturnType', () => {
  const source = null! as ControlledTransaction<DatabaseAB>
  type Result = ReturnType<typeof source.$extendTables<Extra>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<Extended>()
})

test('ControlledTransaction.withTables retains the exact schema in ReturnType', () => {
  const source = null! as ControlledTransaction<DatabaseAB>
  type Result = ReturnType<typeof source.withTables<Extra>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<Extended>()
})

test('ControlledTransaction.$pickTables retains the exact schema in ReturnType', () => {
  const source = null! as ControlledTransaction<DatabaseAB>
  type Result = ReturnType<typeof source.$pickTables<'a'>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<DatabaseA>()
})

test('ControlledTransaction.$omitTables retains the exact schema in ReturnType', () => {
  const source = null! as ControlledTransaction<DatabaseAB>
  type Result = ReturnType<typeof source.$omitTables<'b'>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<DatabaseA>()
})

test('ReadonlyKysely.$extendTables retains the exact schema in ReturnType', () => {
  const source = null! as ReadonlyKysely<DatabaseAB>
  type Result = ReturnType<typeof source.$extendTables<Extra>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<Extended>()
})

test('ReadonlyKysely.withTables retains the exact schema in ReturnType', () => {
  const source = null! as ReadonlyKysely<DatabaseAB>
  type Result = ReturnType<typeof source.withTables<Extra>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<Extended>()
})

test('ReadonlyKysely.$pickTables retains the exact schema in ReturnType', () => {
  const source = null! as ReadonlyKysely<DatabaseAB>
  type Result = ReturnType<typeof source.$pickTables<'a'>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<DatabaseA>()
})

test('ReadonlyKysely.$omitTables retains the exact schema in ReturnType', () => {
  const source = null! as ReadonlyKysely<DatabaseAB>
  type Result = ReturnType<typeof source.$omitTables<'b'>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<DatabaseA>()
})

test('ReadonlyTransaction.$extendTables retains the exact schema in ReturnType', () => {
  const source = null! as ReadonlyTransaction<DatabaseAB>
  type Result = ReturnType<typeof source.$extendTables<Extra>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<Extended>()
})

test('ReadonlyTransaction.withTables retains the exact schema in ReturnType', () => {
  const source = null! as ReadonlyTransaction<DatabaseAB>
  type Result = ReturnType<typeof source.withTables<Extra>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<Extended>()
})

test('ReadonlyTransaction.$pickTables retains the exact schema in ReturnType', () => {
  const source = null! as ReadonlyTransaction<DatabaseAB>
  type Result = ReturnType<typeof source.$pickTables<'a'>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<DatabaseA>()
})

test('ReadonlyTransaction.$omitTables retains the exact schema in ReturnType', () => {
  const source = null! as ReadonlyTransaction<DatabaseAB>
  type Result = ReturnType<typeof source.$omitTables<'b'>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<DatabaseA>()
})

test('ReadonlyControlledTransaction.$extendTables retains the exact schema in ReturnType', () => {
  const source = null! as ReadonlyControlledTransaction<DatabaseAB>
  type Result = ReturnType<typeof source.$extendTables<Extra>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<Extended>()
})

test('ReadonlyControlledTransaction.withTables retains the exact schema in ReturnType', () => {
  const source = null! as ReadonlyControlledTransaction<DatabaseAB>
  type Result = ReturnType<typeof source.withTables<Extra>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<Extended>()
})

test('ReadonlyControlledTransaction.$pickTables retains the exact schema in ReturnType', () => {
  const source = null! as ReadonlyControlledTransaction<DatabaseAB>
  type Result = ReturnType<typeof source.$pickTables<'a'>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<DatabaseA>()
})

test('ReadonlyControlledTransaction.$omitTables retains the exact schema in ReturnType', () => {
  const source = null! as ReadonlyControlledTransaction<DatabaseAB>
  type Result = ReturnType<typeof source.$omitTables<'b'>>
  expectTypeOf<SchemaOf<Result>>().toEqualTypeOf<DatabaseA>()
})

test('Kysely retains schemas in uninstantiated ReturnType', () => {
  const source = null! as Kysely<DatabaseAB>
  type Picked = ReturnType<typeof source.$pickTables>
  type Omitted = ReturnType<typeof source.$omitTables>
  expectTypeOf<SchemaOf<Picked>>().toEqualTypeOf<{ a: Row; b: Row }>()
  expectTypeOf<SchemaOf<Omitted>>().toEqualTypeOf<{}>()
})

test('Transaction retains schemas in uninstantiated ReturnType', () => {
  const source = null! as Transaction<DatabaseAB>
  type Picked = ReturnType<typeof source.$pickTables>
  type Omitted = ReturnType<typeof source.$omitTables>
  expectTypeOf<SchemaOf<Picked>>().toEqualTypeOf<{ a: Row; b: Row }>()
  expectTypeOf<SchemaOf<Omitted>>().toEqualTypeOf<{}>()
})

test('ControlledTransaction retains schemas in uninstantiated ReturnType', () => {
  const source = null! as ControlledTransaction<DatabaseAB>
  type Picked = ReturnType<typeof source.$pickTables>
  type Omitted = ReturnType<typeof source.$omitTables>
  expectTypeOf<SchemaOf<Picked>>().toEqualTypeOf<{ a: Row; b: Row }>()
  expectTypeOf<SchemaOf<Omitted>>().toEqualTypeOf<{}>()
})

test('ReadonlyKysely retains schemas in uninstantiated ReturnType', () => {
  const source = null! as ReadonlyKysely<DatabaseAB>
  type Picked = ReturnType<typeof source.$pickTables>
  type Omitted = ReturnType<typeof source.$omitTables>
  expectTypeOf<SchemaOf<Picked>>().toEqualTypeOf<{ a: Row; b: Row }>()
  expectTypeOf<SchemaOf<Omitted>>().toEqualTypeOf<{}>()
})

test('ReadonlyTransaction retains schemas in uninstantiated ReturnType', () => {
  const source = null! as ReadonlyTransaction<DatabaseAB>
  type Picked = ReturnType<typeof source.$pickTables>
  type Omitted = ReturnType<typeof source.$omitTables>
  expectTypeOf<SchemaOf<Picked>>().toEqualTypeOf<{ a: Row; b: Row }>()
  expectTypeOf<SchemaOf<Omitted>>().toEqualTypeOf<{}>()
})

test('ReadonlyControlledTransaction retains schemas in uninstantiated ReturnType', () => {
  const source = null! as ReadonlyControlledTransaction<DatabaseAB>
  type Picked = ReturnType<typeof source.$pickTables>
  type Omitted = ReturnType<typeof source.$omitTables>
  expectTypeOf<SchemaOf<Picked>>().toEqualTypeOf<{ a: Row; b: Row }>()
  expectTypeOf<SchemaOf<Omitted>>().toEqualTypeOf<{}>()
})

test('readonly transaction table helper calls retain transaction results', () => {
  const source = null! as ReadonlyTransaction<DatabaseAB>
  expectTypeOf(
    source.$extendTables<Extra>().isTransaction,
  ).toEqualTypeOf<true>()
  expectTypeOf(source.withTables<Extra>().isTransaction).toEqualTypeOf<true>()
  expectTypeOf(source.$pickTables<'a'>().isTransaction).toEqualTypeOf<true>()
  expectTypeOf(source.$omitTables<'b'>().isTransaction).toEqualTypeOf<true>()
})
