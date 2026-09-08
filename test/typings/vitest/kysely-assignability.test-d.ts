import { test } from 'vitest'
import type {
  ControlledTransaction,
  Kysely,
  Transaction,
} from '../../../dist/index.js'

type DatabaseA = { a: { id: number } }
type DatabaseAB = DatabaseA & { b: { id: number } }

declare function accept<T>(value: T): void

test('rejects a database with { a } where { a, b } is required', () => {
  const source = null! as Kysely<DatabaseA>
  // @ts-expect-error the source database does not declare table b
  accept<Kysely<DatabaseAB>>(source)
})

test('rejects a transaction with { a } where { a, b } is required', () => {
  const source = null! as Transaction<DatabaseA>
  // @ts-expect-error the source transaction does not declare table b
  accept<Transaction<DatabaseAB>>(source)
})

test('rejects a controlled transaction with { a } where { a, b } is required', () => {
  const source = null! as ControlledTransaction<DatabaseA>
  // @ts-expect-error the source transaction does not declare table b
  accept<ControlledTransaction<DatabaseAB>>(source)
})
