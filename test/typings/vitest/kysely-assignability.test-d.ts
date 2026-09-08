import { expectTypeOf, test } from 'vitest'
import type {
  ControlledTransaction,
  Kysely,
  Transaction,
} from '../../../dist/index.js'

declare const a: Kysely<{ a: { id: number } }>
declare const ab: Kysely<{ a: { id: number }; b: { id: number } }>
declare const transactionA: Transaction<{ a: { id: number } }>
declare const transactionAB: Transaction<{
  a: { id: number }
  b: { id: number }
}>
declare const controlledTransactionA: ControlledTransaction<{
  a: { id: number }
}>
declare const controlledTransactionAB: ControlledTransaction<{
  a: { id: number }
  b: { id: number }
}>
declare const controlledTransactionWithSavepoint: ControlledTransaction<
  { a: { id: number }; b: { id: number } },
  ['savepoint']
>

function queryA(db: Kysely<{ a: { id: number } }>) {
  return db.selectFrom('a').selectAll().execute()
}

function queryB(db: Kysely<{ b: { id: number } }>) {
  return db.selectFrom('b').selectAll().execute()
}

function queryAB(db: Kysely<{ a: { id: number }; b: { id: number } }>) {
  return db.selectFrom('b').selectAll().execute()
}

function queryAInTransaction(trx: Transaction<{ a: { id: number } }>) {
  return queryA(trx)
}

function queryBInTransaction(trx: Transaction<{ b: { id: number } }>) {
  return queryB(trx)
}

function queryABInTransaction(
  trx: Transaction<{ a: { id: number }; b: { id: number } }>,
) {
  return queryAB(trx)
}

function queryAInControlledTransaction(
  trx: ControlledTransaction<{ a: { id: number } }>,
) {
  return queryA(trx)
}

function queryBInControlledTransaction(
  trx: ControlledTransaction<{ b: { id: number } }>,
) {
  return queryB(trx)
}

function queryABInControlledTransaction(
  trx: ControlledTransaction<{ a: { id: number }; b: { id: number } }>,
) {
  return queryAB(trx)
}

test('accepts a database with { a } where { a } is required', () => {
  queryA(a)
})

test('rejects a database with { a } where { b } is required', () => {
  // @ts-expect-error the source database does not declare table b
  queryB(a)
})

test('accepts a database that declares both tables', () => {
  queryAB(ab)
})

test('rejects a database that does not declare table b', () => {
  // @ts-expect-error the source database does not declare table b
  queryAB(a)
})

test('accepts a transaction with { a } where { a } is required', () => {
  queryA(transactionA)
  queryAInTransaction(transactionA)
})

test('rejects a transaction with { a } where { b } is required', () => {
  // @ts-expect-error the source transaction does not declare table b
  queryB(transactionA)
  // @ts-expect-error the source transaction does not declare table b
  queryBInTransaction(transactionA)
})

test('accepts a transaction with { a, b } where { a } is required', () => {
  queryA(transactionAB)
  queryAInTransaction(transactionAB)
})

test('accepts a transaction that declares both tables', () => {
  queryAB(transactionAB)
  queryABInTransaction(transactionAB)
})

test('rejects a transaction that does not declare table b', () => {
  // @ts-expect-error the source transaction does not declare table b
  queryAB(transactionA)
  // @ts-expect-error the source transaction does not declare table b
  queryABInTransaction(transactionA)
})

test('accepts a controlled transaction with { a } where { a } is required', () => {
  queryA(controlledTransactionA)
  queryAInTransaction(controlledTransactionA)
  queryAInControlledTransaction(controlledTransactionA)
})

test('rejects a controlled transaction with { a } where { b } is required', () => {
  // @ts-expect-error the source transaction does not declare table b
  queryB(controlledTransactionA)
  // @ts-expect-error the source transaction does not declare table b
  queryBInTransaction(controlledTransactionA)
  // @ts-expect-error the source transaction does not declare table b
  queryBInControlledTransaction(controlledTransactionA)
})

test('accepts a controlled transaction with { a, b } where { a } is required', () => {
  queryA(controlledTransactionAB)
  queryAInTransaction(controlledTransactionAB)
  queryAInControlledTransaction(controlledTransactionAB)
})

test('accepts a controlled transaction that declares both tables', () => {
  queryAB(controlledTransactionAB)
  queryABInTransaction(controlledTransactionAB)
  queryABInControlledTransaction(controlledTransactionAB)
})

test('rejects a controlled transaction that does not declare table b', () => {
  // @ts-expect-error the source transaction does not declare table b
  queryAB(controlledTransactionA)
  // @ts-expect-error the source transaction does not declare table b
  queryABInTransaction(controlledTransactionA)
  // @ts-expect-error the source transaction does not declare table b
  queryABInControlledTransaction(controlledTransactionA)
})

test('preserves transaction types when changing tables', () => {
  queryABInTransaction(transactionA.$extendTables<{ b: { id: number } }>())
  queryABInTransaction(transactionA.withTables<{ b: { id: number } }>())
  queryAInTransaction(transactionAB.$pickTables<'a'>())
  queryAInTransaction(transactionAB.$omitTables<'b'>())

  // @ts-expect-error the picked database does not declare table b
  queryABInTransaction(transactionAB.$pickTables<'a'>())
  // @ts-expect-error the omitted database does not declare table b
  queryABInTransaction(transactionAB.$omitTables<'b'>())
})

test('preserves controlled transaction types when changing tables', () => {
  queryABInControlledTransaction(
    controlledTransactionA.$extendTables<{ b: { id: number } }>(),
  )
  queryABInControlledTransaction(
    controlledTransactionA.withTables<{ b: { id: number } }>(),
  )
  queryAInControlledTransaction(controlledTransactionAB.$pickTables<'a'>())
  queryAInControlledTransaction(controlledTransactionAB.$omitTables<'b'>())

  // @ts-expect-error the picked database does not declare table b
  queryABInControlledTransaction(controlledTransactionAB.$pickTables<'a'>())
  // @ts-expect-error the omitted database does not declare table b
  queryABInControlledTransaction(controlledTransactionAB.$omitTables<'b'>())
})

test('preserves savepoints when changing tables', () => {
  for (const trx of [
    controlledTransactionWithSavepoint.$extendTables<{ c: { id: number } }>(),
    controlledTransactionWithSavepoint.withTables<{ c: { id: number } }>(),
    controlledTransactionWithSavepoint.$pickTables<'a'>(),
    controlledTransactionWithSavepoint.$omitTables<'b'>(),
  ]) {
    trx.rollbackToSavepoint('savepoint')
    // @ts-expect-error the transaction does not declare this savepoint
    trx.rollbackToSavepoint('missing')
  }
})

test('preserves transaction helper types in ReturnType', () => {
  type TableHelpers =
    '$extendTables' | 'withTables' | '$pickTables' | '$omitTables'
  type ReturnedTransaction = ReturnType<(typeof transactionA)[TableHelpers]>
  type ReturnedControlledTransaction = ReturnType<
    (typeof controlledTransactionWithSavepoint)[TableHelpers]
  >

  expectTypeOf<ReturnedTransaction['isTransaction']>().toEqualTypeOf<true>()
  expectTypeOf<
    ReturnedControlledTransaction['isTransaction']
  >().toEqualTypeOf<true>()
  expectTypeOf<
    Parameters<ReturnedControlledTransaction['rollbackToSavepoint']>[0]
  >().toEqualTypeOf<'savepoint'>()
})
