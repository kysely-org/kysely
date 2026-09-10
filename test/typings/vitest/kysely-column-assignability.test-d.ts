import { test } from 'vitest'
import type {
  ColumnType,
  Generated,
  ControlledTransaction,
  Kysely,
  MergeQueryBuilder,
  MergeResult,
  Transaction,
} from '../../../dist/index.js'
import {
  accept,
  type Instances,
  type DatabaseA,
} from './assignability.fixtures.js'

test('accepts narrower column writes while preserving nullable reads', () => {
  type Source = {
    a: {
      updatedAt: ColumnType<
        Date | null,
        Date | string | null,
        Date | string | null
      >
    }
  }
  type Target = {
    a: { updatedAt: ColumnType<Date | null, Date | string, Date | string> }
  }
  const source = null! as Instances<Source>

  accept<Kysely<Target>>(source.db)
  accept<Kysely<Target>>(source.transaction)
  accept<Transaction<Target>>(source.transaction)
  accept<Transaction<Target>>(source.controlled)
  accept<ControlledTransaction<Target>>(source.controlled)
  accept<MergeQueryBuilder<Target, 'a', MergeResult>>(source.db.mergeInto('a'))

  source.db.transaction().execute(async (transaction) => {
    accept<Transaction<Target>>(transaction)
  })
})

test('rejects wider column writes even when nullable reads match', () => {
  type Source = {
    a: { updatedAt: ColumnType<Date | null, Date | string, Date | string> }
  }
  type Target = {
    a: {
      updatedAt: ColumnType<
        Date | null,
        Date | string | null,
        Date | string | null
      >
    }
  }
  const source = null! as Instances<Source>

  // @ts-expect-error the target permits writing null to the source column
  accept<Kysely<Target>>(source.db)
  // @ts-expect-error the target permits writing null to the source column
  accept<Transaction<Target>>(source.transaction)
  // @ts-expect-error the target permits writing null to the source column
  accept<ControlledTransaction<Target>>(source.controlled)
  // @ts-expect-error the target permits writing null to the source column
  accept<MergeQueryBuilder<Target, 'a', MergeResult>>(source.db.mergeInto('a'))
})

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

test('rejects widening writable columns to accept null', () => {
  type Source = DatabaseA
  type Target = { a: { id: number | null } }
  const source = null! as Instances<Source>

  // @ts-expect-error the target permits writing null to the nonnullable source column
  accept<Kysely<Target>>(source.db)
  // @ts-expect-error the target permits writing null to the nonnullable source column
  accept<Kysely<Target>>(source.transaction)
  // @ts-expect-error the target permits writing null to the nonnullable source column
  accept<Transaction<Target>>(source.transaction)
  // @ts-expect-error the target permits writing null to the nonnullable source column
  accept<Kysely<Target>>(source.controlled)
  // @ts-expect-error the target permits writing null to the nonnullable source column
  accept<Transaction<Target>>(source.controlled)
  // @ts-expect-error the target permits writing null to the nonnullable source column
  accept<ControlledTransaction<Target>>(source.controlled)
})

test('rejects forgetting required insert columns', () => {
  type Source = { a: { id: number; name: string } }
  type Target = DatabaseA
  const source = null! as Instances<Source>

  // @ts-expect-error the target permits inserts without the required source name
  accept<Kysely<Target>>(source.db)
  // @ts-expect-error the target permits inserts without the required source name
  accept<Kysely<Target>>(source.transaction)
  // @ts-expect-error the target permits inserts without the required source name
  accept<Transaction<Target>>(source.transaction)
  // @ts-expect-error the target permits inserts without the required source name
  accept<Kysely<Target>>(source.controlled)
  // @ts-expect-error the target permits inserts without the required source name
  accept<Transaction<Target>>(source.controlled)
  // @ts-expect-error the target permits inserts without the required source name
  accept<ControlledTransaction<Target>>(source.controlled)
})

test('rejects nullable selects where nonnullable selects are required', () => {
  type Source = { a: { id: ColumnType<number | null, number, number> } }
  type Target = { a: { id: ColumnType<number, number, number> } }
  const source = null! as Instances<Source>

  // @ts-expect-error the source can select null but the target promises number
  accept<Kysely<Target>>(source.db)
  // @ts-expect-error the source can select null but the target promises number
  accept<Kysely<Target>>(source.transaction)
  // @ts-expect-error the source can select null but the target promises number
  accept<Transaction<Target>>(source.transaction)
  // @ts-expect-error the source can select null but the target promises number
  accept<Kysely<Target>>(source.controlled)
  // @ts-expect-error the source can select null but the target promises number
  accept<Transaction<Target>>(source.controlled)
  // @ts-expect-error the source can select null but the target promises number
  accept<ControlledTransaction<Target>>(source.controlled)
})

test('rejects broader select unions', () => {
  type Source = { a: { id: ColumnType<1 | 2, number, number> } }
  type Target = { a: { id: ColumnType<1, number, number> } }
  const source = null! as Instances<Source>

  // @ts-expect-error the source can select 2 but the target promises 1
  accept<Kysely<Target>>(source.db)
  // @ts-expect-error the source can select 2 but the target promises 1
  accept<Kysely<Target>>(source.transaction)
  // @ts-expect-error the source can select 2 but the target promises 1
  accept<Transaction<Target>>(source.transaction)
  // @ts-expect-error the source can select 2 but the target promises 1
  accept<Kysely<Target>>(source.controlled)
  // @ts-expect-error the source can select 2 but the target promises 1
  accept<Transaction<Target>>(source.controlled)
  // @ts-expect-error the source can select 2 but the target promises 1
  accept<ControlledTransaction<Target>>(source.controlled)
})

test('rejects widening only update types to allow null', () => {
  type Source = { a: { id: ColumnType<number, number, number> } }
  type Target = { a: { id: ColumnType<number, number, number | null> } }
  const source = null! as Instances<Source>

  // @ts-expect-error the target permits updating the source column to null
  accept<Kysely<Target>>(source.db)
  // @ts-expect-error the target permits updating the source column to null
  accept<Kysely<Target>>(source.transaction)
  // @ts-expect-error the target permits updating the source column to null
  accept<Transaction<Target>>(source.transaction)
  // @ts-expect-error the target permits updating the source column to null
  accept<Kysely<Target>>(source.controlled)
  // @ts-expect-error the target permits updating the source column to null
  accept<Transaction<Target>>(source.controlled)
  // @ts-expect-error the target permits updating the source column to null
  accept<ControlledTransaction<Target>>(source.controlled)
})

test('rejects widening only update unions', () => {
  type Source = { a: { id: ColumnType<number, number, 1> } }
  type Target = { a: { id: ColumnType<number, number, 1 | 2> } }
  const source = null! as Instances<Source>

  // @ts-expect-error the target permits updating the source column to 2
  accept<Kysely<Target>>(source.db)
  // @ts-expect-error the target permits updating the source column to 2
  accept<Kysely<Target>>(source.transaction)
  // @ts-expect-error the target permits updating the source column to 2
  accept<Transaction<Target>>(source.transaction)
  // @ts-expect-error the target permits updating the source column to 2
  accept<Kysely<Target>>(source.controlled)
  // @ts-expect-error the target permits updating the source column to 2
  accept<Transaction<Target>>(source.controlled)
  // @ts-expect-error the target permits updating the source column to 2
  accept<ControlledTransaction<Target>>(source.controlled)
})
