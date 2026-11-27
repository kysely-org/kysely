import { expectTypeOf, test } from 'vitest'
import type {
  ControlledTransaction,
  Kysely,
  QueryCreator,
  Transaction,
} from '../../../dist/index.js'
import {
  accept,
  a,
  type Instances,
  type Row,
  type DatabaseA,
  type DatabaseB,
  type DatabaseAB,
} from './assignability.fixtures.js'

test('accepts unions whose every member declares the required table', () => {
  const source = null! as Instances<DatabaseA | DatabaseAB>

  accept<Kysely<DatabaseA>>(source.db)
  accept<Kysely<DatabaseA>>(source.transaction)
  accept<Transaction<DatabaseA>>(source.transaction)
  accept<Kysely<DatabaseA>>(source.controlled)
  accept<Transaction<DatabaseA>>(source.controlled)
  accept<ControlledTransaction<DatabaseA>>(source.controlled)
})

test('rejects unions with a member missing the required table', () => {
  const source = null! as Instances<DatabaseA | DatabaseB>

  // @ts-expect-error one union member does not declare a
  accept<Kysely<DatabaseA>>(source.db)
  // @ts-expect-error one union member does not declare a
  accept<Kysely<DatabaseA>>(source.transaction)
  // @ts-expect-error one union member does not declare a
  accept<Transaction<DatabaseA>>(source.transaction)
  // @ts-expect-error one union member does not declare a
  accept<Kysely<DatabaseA>>(source.controlled)
  // @ts-expect-error one union member does not declare a
  accept<Transaction<DatabaseA>>(source.controlled)
  // @ts-expect-error one union member does not declare a
  accept<ControlledTransaction<DatabaseA>>(source.controlled)
})

test('accepts index signatures with an explicit required table', () => {
  const source = null! as Instances<{ a: Row; [table: string]: Row }>

  accept<Kysely<DatabaseA>>(source.db)
  accept<Transaction<DatabaseA>>(source.transaction)
  accept<ControlledTransaction<DatabaseA>>(source.controlled)

  // TODO: Support these index-signature assignments to parent classes.
  // We currently consider this uncommon schema pattern not worth the extra
  // type complexity and instantiation cost needed to support it.
  // To fix these assignments:
  // - In QueryCreatorWithCommonTableExpression, replace the DB intersection
  //   operand with:
  //   string extends CN ? (DB extends object ? Omit<DB, CN> : DB) : DB
  // - Add a Transaction<DB extends object ? Pick<DB, T> : DB> return overload
  //   to ControlledTransaction.$pickTables, between its Kysely and final
  //   ControlledTransaction overloads.
  // accept<Kysely<DatabaseA>>(source.transaction)
  // accept<Kysely<DatabaseA>>(source.controlled)
  // accept<Transaction<DatabaseA>>(source.controlled)
})

test('rejects index signatures without an explicit required table', () => {
  const source = null! as Instances<Record<string, Row>>

  // @ts-expect-error an index signature does not guarantee that a exists
  accept<Kysely<DatabaseA>>(source.db)
  // @ts-expect-error an index signature does not guarantee that a exists
  accept<Kysely<DatabaseA>>(source.transaction)
  // @ts-expect-error an index signature does not guarantee that a exists
  accept<Transaction<DatabaseA>>(source.transaction)
  // @ts-expect-error an index signature does not guarantee that a exists
  accept<Kysely<DatabaseA>>(source.controlled)
  // @ts-expect-error an index signature does not guarantee that a exists
  accept<Transaction<DatabaseA>>(source.controlled)
  // @ts-expect-error an index signature does not guarantee that a exists
  accept<ControlledTransaction<DatabaseA>>(source.controlled)
})

test('rejects widening a finite schema to arbitrary table names', () => {
  const source = null! as Instances<DatabaseA>

  // @ts-expect-error the target permits queries against undeclared table names
  accept<Kysely<Record<string, Row>>>(source.db)
  // @ts-expect-error the target permits queries against undeclared table names
  accept<Kysely<Record<string, Row>>>(source.transaction)
  // @ts-expect-error the target permits queries against undeclared table names
  accept<Transaction<Record<string, Row>>>(source.transaction)
  // @ts-expect-error the target permits queries against undeclared table names
  accept<Kysely<Record<string, Row>>>(source.controlled)
  // @ts-expect-error the target permits queries against undeclared table names
  accept<Transaction<Record<string, Row>>>(source.controlled)
  // @ts-expect-error the target permits queries against undeclared table names
  accept<ControlledTransaction<Record<string, Row>>>(source.controlled)
})

test('rejects widening the schema type to {}', () => {
  const source = null! as Instances<DatabaseA>

  // @ts-expect-error
  accept<Kysely<{}>>(source.db)
  // @ts-expect-error
  accept<Kysely<{}>>(source.transaction)
  // @ts-expect-error
  accept<Transaction<{}>>(source.transaction)
  // @ts-expect-error
  accept<Kysely<{}>>(source.controlled)
  // @ts-expect-error
  accept<Transaction<{}>>(source.controlled)
  // @ts-expect-error
  accept<ControlledTransaction<{}>>(source.controlled)
})

test('rejects erasing table knowledge to unknown', () => {
  const source = null! as Instances<DatabaseA>

  // @ts-expect-error
  accept<Kysely<unknown>>(source.db)
  // @ts-expect-error
  accept<Kysely<unknown>>(source.transaction)
  // @ts-expect-error
  accept<Transaction<unknown>>(source.transaction)
  // @ts-expect-error
  accept<Kysely<unknown>>(source.controlled)
  // @ts-expect-error
  accept<Transaction<unknown>>(source.controlled)
  // @ts-expect-error
  accept<ControlledTransaction<unknown>>(source.controlled)
})

test('rejects {} where a table is required', () => {
  const source = null! as Instances<{}>

  // @ts-expect-error {} does not guarantee that a exists
  accept<Kysely<DatabaseA>>(source.db)
  // @ts-expect-error {} does not guarantee that a exists
  accept<Kysely<DatabaseA>>(source.transaction)
  // @ts-expect-error {} does not guarantee that a exists
  accept<Transaction<DatabaseA>>(source.transaction)
  // @ts-expect-error {} does not guarantee that a exists
  accept<Kysely<DatabaseA>>(source.controlled)
  // @ts-expect-error {} does not guarantee that a exists
  accept<Transaction<DatabaseA>>(source.controlled)
  // @ts-expect-error {} does not guarantee that a exists
  accept<ControlledTransaction<DatabaseA>>(source.controlled)
})

test('rejects unknown schemas where a table is required', () => {
  const source = null! as Instances<unknown>

  // @ts-expect-error unknown does not establish that a exists
  accept<Kysely<DatabaseA>>(source.db)
  // @ts-expect-error unknown does not establish that a exists
  accept<Kysely<DatabaseA>>(source.transaction)
  // @ts-expect-error unknown does not establish that a exists
  accept<Transaction<DatabaseA>>(source.transaction)
  // @ts-expect-error unknown does not establish that a exists
  accept<Kysely<DatabaseA>>(source.controlled)
  // @ts-expect-error unknown does not establish that a exists
  accept<Transaction<DatabaseA>>(source.controlled)
  // @ts-expect-error unknown does not establish that a exists
  accept<ControlledTransaction<DatabaseA>>(source.controlled)
})

test('rejects optional tables where a required table is needed', () => {
  const source = null! as Instances<{ a?: Row }>

  // @ts-expect-error an optional table does not guarantee that a exists
  accept<Kysely<DatabaseA>>(source.db)
  // @ts-expect-error an optional table does not guarantee that a exists
  accept<Kysely<DatabaseA>>(source.transaction)
  // @ts-expect-error an optional table does not guarantee that a exists
  accept<Transaction<DatabaseA>>(source.transaction)
  // @ts-expect-error an optional table does not guarantee that a exists
  accept<Kysely<DatabaseA>>(source.controlled)
  // @ts-expect-error an optional table does not guarantee that a exists
  accept<Transaction<DatabaseA>>(source.controlled)
  // @ts-expect-error an optional table does not guarantee that a exists
  accept<ControlledTransaction<DatabaseA>>(source.controlled)
})

test('accepts unrelated optional tables alongside a required table', () => {
  const source = null! as Instances<DatabaseA & Partial<DatabaseB>>

  accept<Kysely<DatabaseA>>(source.db)
  accept<Kysely<DatabaseA>>(source.transaction)
  accept<Transaction<DatabaseA>>(source.transaction)
  accept<Kysely<DatabaseA>>(source.controlled)
  accept<Transaction<DatabaseA>>(source.controlled)
  accept<ControlledTransaction<DatabaseA>>(source.controlled)
})

test('rejects schema unions whose members have incompatible columns', () => {
  const source = null! as Instances<DatabaseA | { a: { id: string } }>

  // @ts-expect-error one union member returns string ids instead of number ids
  accept<Kysely<DatabaseA>>(source.db)
  // @ts-expect-error one union member returns string ids instead of number ids
  accept<Kysely<DatabaseA>>(source.transaction)
  // @ts-expect-error one union member returns string ids instead of number ids
  accept<Transaction<DatabaseA>>(source.transaction)
  // @ts-expect-error one union member returns string ids instead of number ids
  accept<Kysely<DatabaseA>>(source.controlled)
  // @ts-expect-error one union member returns string ids instead of number ids
  accept<Transaction<DatabaseA>>(source.controlled)
  // @ts-expect-error one union member returns string ids instead of number ids
  accept<ControlledTransaction<DatabaseA>>(source.controlled)
})

test('accepts readonly schema table mappings', () => {
  const source = null! as Instances<Readonly<DatabaseAB>>

  accept<Kysely<DatabaseA>>(source.db)
  accept<Kysely<DatabaseA>>(source.transaction)
  accept<Transaction<DatabaseA>>(source.transaction)
  accept<Kysely<DatabaseA>>(source.controlled)
  accept<Transaction<DatabaseA>>(source.controlled)
  accept<ControlledTransaction<DatabaseA>>(source.controlled)
})

test('accepts mutable schemas where readonly table mappings are requested', () => {
  const source = null! as Instances<DatabaseA>

  accept<Kysely<Readonly<DatabaseA>>>(source.db)
  accept<Kysely<Readonly<DatabaseA>>>(source.transaction)
  accept<Transaction<Readonly<DatabaseA>>>(source.transaction)
  accept<Kysely<Readonly<DatabaseA>>>(source.controlled)
  accept<Transaction<Readonly<DatabaseA>>>(source.controlled)
  accept<ControlledTransaction<Readonly<DatabaseA>>>(source.controlled)
})

test('accepts any as an explicit schema escape hatch', () => {
  const source = null! as Instances<any>

  accept<Kysely<DatabaseA>>(source.db)
  accept<Kysely<DatabaseA>>(source.transaction)
  accept<Transaction<DatabaseA>>(source.transaction)
  accept<Kysely<DatabaseA>>(source.controlled)
  accept<Transaction<DatabaseA>>(source.controlled)
  accept<ControlledTransaction<DatabaseA>>(source.controlled)
})

test('accepts concrete schemas where any is requested', () => {
  const source = null! as Instances<DatabaseA>

  accept<Kysely<any>>(source.db)
  accept<Kysely<any>>(source.transaction)
  accept<Transaction<any>>(source.transaction)
  accept<Kysely<any>>(source.controlled)
  accept<Transaction<any>>(source.controlled)
  accept<ControlledTransaction<any>>(source.controlled)
})

test('accepts interface and type alias schemas with the same structure', () => {
  interface InterfaceDatabase {
    a: Row
  }
  const source = null! as Instances<InterfaceDatabase>
  accept<Kysely<DatabaseA>>(source.db)
  accept<Kysely<DatabaseA>>(source.transaction)
  accept<Kysely<DatabaseA>>(source.controlled)
  accept<Transaction<DatabaseA>>(source.transaction)
  accept<Transaction<DatabaseA>>(source.controlled)
  accept<ControlledTransaction<DatabaseA>>(source.controlled)
  accept<Kysely<InterfaceDatabase>>(a.db)
  accept<Transaction<InterfaceDatabase>>(a.transaction)
  accept<ControlledTransaction<InterfaceDatabase>>(a.controlled)
})

test('preserves any through common table expressions', () => {
  const db = null! as Kysely<any>
  const query = db.with('a', (qb) => qb.selectFrom('b').select('id'))
  expectTypeOf(query).toEqualTypeOf<QueryCreator<any>>()
})
