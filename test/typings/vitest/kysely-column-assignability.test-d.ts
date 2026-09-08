import { test } from 'vitest'
import type {
  ColumnType,
  Generated,
  ControlledTransaction,
  Kysely,
  Transaction,
} from '../../../dist/index.js'
import {
  accept,
  type Instances,
  type DatabaseA,
} from './assignability.fixtures.js'

test('rejects incompatible column types', () => {
  type Source = { a: { id: string } }
  type Target = DatabaseA
  const source = null! as Instances<Source>

  // @ts-expect-error id is a string in the source database
  accept<Kysely<Target>>(source.db)
  // @ts-expect-error id is a string in the source database
  accept<Kysely<Target>>(source.transaction)
  // @ts-expect-error id is a string in the source database
  accept<Transaction<Target>>(source.transaction)
  // @ts-expect-error id is a string in the source database
  accept<Kysely<Target>>(source.controlled)
  // @ts-expect-error id is a string in the source database
  accept<Transaction<Target>>(source.controlled)
  // @ts-expect-error id is a string in the source database
  accept<ControlledTransaction<Target>>(source.controlled)
})

test('rejects missing required columns', () => {
  type Source = { a: { name: string } }
  type Target = DatabaseA
  const source = null! as Instances<Source>

  // @ts-expect-error the source table does not declare id
  accept<Kysely<Target>>(source.db)
  // @ts-expect-error the source table does not declare id
  accept<Kysely<Target>>(source.transaction)
  // @ts-expect-error the source table does not declare id
  accept<Transaction<Target>>(source.transaction)
  // @ts-expect-error the source table does not declare id
  accept<Kysely<Target>>(source.controlled)
  // @ts-expect-error the source table does not declare id
  accept<Transaction<Target>>(source.controlled)
  // @ts-expect-error the source table does not declare id
  accept<ControlledTransaction<Target>>(source.controlled)
})

test('rejects nullable columns where nonnullable columns are needed', () => {
  type Source = { a: { id: number | null } }
  type Target = DatabaseA
  const source = null! as Instances<Source>

  // @ts-expect-error the source id can be null
  accept<Kysely<Target>>(source.db)
  // @ts-expect-error the source id can be null
  accept<Kysely<Target>>(source.transaction)
  // @ts-expect-error the source id can be null
  accept<Transaction<Target>>(source.transaction)
  // @ts-expect-error the source id can be null
  accept<Kysely<Target>>(source.controlled)
  // @ts-expect-error the source id can be null
  accept<Transaction<Target>>(source.controlled)
  // @ts-expect-error the source id can be null
  accept<ControlledTransaction<Target>>(source.controlled)
})

test('accepts structurally identical column declarations', () => {
  type Source = { a: { id: number } }
  type Target = DatabaseA
  const source = null! as Instances<Source>

  accept<Kysely<Target>>(source.db)
  accept<Kysely<Target>>(source.transaction)
  accept<Transaction<Target>>(source.transaction)
  accept<Kysely<Target>>(source.controlled)
  accept<Transaction<Target>>(source.controlled)
  accept<ControlledTransaction<Target>>(source.controlled)
})

test('accepts equivalent generated column declarations', () => {
  type Source = { a: { id: Generated<number> } }
  type Target = { a: { id: ColumnType<number, number | undefined, number> } }
  const source = null! as Instances<Source>

  accept<Kysely<Target>>(source.db)
  accept<Kysely<Target>>(source.transaction)
  accept<Transaction<Target>>(source.transaction)
  accept<Kysely<Target>>(source.controlled)
  accept<Transaction<Target>>(source.controlled)
  accept<ControlledTransaction<Target>>(source.controlled)
})

test('rejects incompatible generated column select types', () => {
  type Source = { a: { id: Generated<string> } }
  type Target = { a: { id: Generated<number> } }
  const source = null! as Instances<Source>

  // @ts-expect-error generated id selects string instead of number
  accept<Kysely<Target>>(source.db)
  // @ts-expect-error generated id selects string instead of number
  accept<Kysely<Target>>(source.transaction)
  // @ts-expect-error generated id selects string instead of number
  accept<Transaction<Target>>(source.transaction)
  // @ts-expect-error generated id selects string instead of number
  accept<Kysely<Target>>(source.controlled)
  // @ts-expect-error generated id selects string instead of number
  accept<Transaction<Target>>(source.controlled)
  // @ts-expect-error generated id selects string instead of number
  accept<ControlledTransaction<Target>>(source.controlled)
})

test('rejects incompatible ColumnType select types', () => {
  type Source = { a: { id: ColumnType<string, number, number> } }
  type Target = { a: { id: ColumnType<number, number, number> } }
  const source = null! as Instances<Source>

  // @ts-expect-error the select types differ
  accept<Kysely<Target>>(source.db)
  // @ts-expect-error the select types differ
  accept<Kysely<Target>>(source.transaction)
  // @ts-expect-error the select types differ
  accept<Transaction<Target>>(source.transaction)
  // @ts-expect-error the select types differ
  accept<Kysely<Target>>(source.controlled)
  // @ts-expect-error the select types differ
  accept<Transaction<Target>>(source.controlled)
  // @ts-expect-error the select types differ
  accept<ControlledTransaction<Target>>(source.controlled)
})

test('rejects incompatible ColumnType insert types', () => {
  type Source = { a: { id: ColumnType<number, string, number> } }
  type Target = { a: { id: ColumnType<number, number, number> } }
  const source = null! as Instances<Source>

  // @ts-expect-error the insert types differ
  accept<Kysely<Target>>(source.db)
  // @ts-expect-error the insert types differ
  accept<Kysely<Target>>(source.transaction)
  // @ts-expect-error the insert types differ
  accept<Transaction<Target>>(source.transaction)
  // @ts-expect-error the insert types differ
  accept<Kysely<Target>>(source.controlled)
  // @ts-expect-error the insert types differ
  accept<Transaction<Target>>(source.controlled)
  // @ts-expect-error the insert types differ
  accept<ControlledTransaction<Target>>(source.controlled)
})

test('rejects incompatible ColumnType update types', () => {
  type Source = { a: { id: ColumnType<number, number, string> } }
  type Target = { a: { id: ColumnType<number, number, number> } }
  const source = null! as Instances<Source>

  // @ts-expect-error the update types differ
  accept<Kysely<Target>>(source.db)
  // @ts-expect-error the update types differ
  accept<Kysely<Target>>(source.transaction)
  // @ts-expect-error the update types differ
  accept<Transaction<Target>>(source.transaction)
  // @ts-expect-error the update types differ
  accept<Kysely<Target>>(source.controlled)
  // @ts-expect-error the update types differ
  accept<Transaction<Target>>(source.controlled)
  // @ts-expect-error the update types differ
  accept<ControlledTransaction<Target>>(source.controlled)
})
