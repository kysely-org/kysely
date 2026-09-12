import { test } from 'vitest'
import type {
  ColumnType,
  Kysely,
  Transaction,
  ControlledTransaction,
} from '../../../dist/index.js'
import type {
  ReadonlyKysely,
  ReadonlyTransaction,
  ReadonlyControlledTransaction,
} from '../../../dist/readonly/index.js'
import * as readonlyKyselyModule from '../../../dist/readonly/readonly-kysely.js'
import * as readonlyQueryCreatorModule from '../../../dist/readonly/readonly-query-creator.js'
import {
  accept,
  type DatabaseA,
  type DatabaseB,
  type DatabaseAB,
} from './assignability.fixtures.js'

type Instances<DB> = {
  db: ReadonlyKysely<DB>
  transaction: ReadonlyTransaction<DB>
  controlled: ReadonlyControlledTransaction<DB>
}

test('does not expose readonly constructors through their declaring modules', () => {
  // @ts-expect-error ReadonlyQueryCreator has no runtime constructor
  new readonlyQueryCreatorModule.ReadonlyQueryCreator<DatabaseA>()
  // @ts-expect-error ReadonlyKysely has no runtime constructor
  new readonlyKyselyModule.ReadonlyKysely<DatabaseA>()
  // @ts-expect-error ReadonlyTransaction has no runtime constructor
  new readonlyKyselyModule.ReadonlyTransaction<DatabaseA>()
  // @ts-expect-error ReadonlyControlledTransaction has no runtime constructor
  new readonlyKyselyModule.ReadonlyControlledTransaction<DatabaseA>()
})

test('accepts identical readonly schemas', () => {
  const source = null! as Instances<DatabaseA>
  accept<ReadonlyKysely<DatabaseA>>(source.db)
  accept<ReadonlyKysely<DatabaseA>>(source.transaction)
  accept<ReadonlyTransaction<DatabaseA>>(source.transaction)
  accept<ReadonlyKysely<DatabaseA>>(source.controlled)
  accept<ReadonlyTransaction<DatabaseA>>(source.controlled)
  accept<ReadonlyControlledTransaction<DatabaseA>>(source.controlled)
})

test('accepts readonly schemas with extra tables', () => {
  const source = null! as Instances<DatabaseAB>
  accept<ReadonlyKysely<DatabaseA>>(source.db)
  accept<ReadonlyKysely<DatabaseA>>(source.transaction)
  accept<ReadonlyTransaction<DatabaseA>>(source.transaction)
  accept<ReadonlyKysely<DatabaseA>>(source.controlled)
  accept<ReadonlyTransaction<DatabaseA>>(source.controlled)
  accept<ReadonlyControlledTransaction<DatabaseA>>(source.controlled)
})

test('accepts identical readonly schemas with both tables', () => {
  const source = null! as Instances<DatabaseAB>
  accept<ReadonlyKysely<DatabaseAB>>(source.db)
  accept<ReadonlyKysely<DatabaseAB>>(source.transaction)
  accept<ReadonlyTransaction<DatabaseAB>>(source.transaction)
  accept<ReadonlyKysely<DatabaseAB>>(source.controlled)
  accept<ReadonlyTransaction<DatabaseAB>>(source.controlled)
  accept<ReadonlyControlledTransaction<DatabaseAB>>(source.controlled)
})

test('rejects unrelated readonly schemas', () => {
  const source = null! as Instances<DatabaseA>
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyKysely<DatabaseB>>(source.db)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyKysely<DatabaseB>>(source.transaction)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyTransaction<DatabaseB>>(source.transaction)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyKysely<DatabaseB>>(source.controlled)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyTransaction<DatabaseB>>(source.controlled)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyControlledTransaction<DatabaseB>>(source.controlled)
})

test('rejects readonly schemas missing a required table', () => {
  const source = null! as Instances<DatabaseA>
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyKysely<DatabaseAB>>(source.db)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyKysely<DatabaseAB>>(source.transaction)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyTransaction<DatabaseAB>>(source.transaction)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyKysely<DatabaseAB>>(source.controlled)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyTransaction<DatabaseAB>>(source.controlled)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyControlledTransaction<DatabaseAB>>(source.controlled)
})

test('rejects readonly schemas with incompatible column types', () => {
  const source = null! as Instances<{ a: { id: string } }>
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyKysely<DatabaseA>>(source.db)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyKysely<DatabaseA>>(source.transaction)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyTransaction<DatabaseA>>(source.transaction)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyKysely<DatabaseA>>(source.controlled)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyTransaction<DatabaseA>>(source.controlled)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyControlledTransaction<DatabaseA>>(source.controlled)
})

test('accepts readonly column widening', () => {
  const source = null! as Instances<DatabaseA>
  accept<ReadonlyKysely<{ a: { id: number | null } }>>(source.db)
  accept<ReadonlyKysely<{ a: { id: number | null } }>>(source.transaction)
  accept<ReadonlyTransaction<{ a: { id: number | null } }>>(source.transaction)
  accept<ReadonlyKysely<{ a: { id: number | null } }>>(source.controlled)
  accept<ReadonlyTransaction<{ a: { id: number | null } }>>(source.controlled)
  accept<ReadonlyControlledTransaction<{ a: { id: number | null } }>>(
    source.controlled,
  )
})

test('accepts readonly schemas with identical reads and different write types', () => {
  type Source = { a: { id: ColumnType<number, string, boolean> } }
  type Target = { a: { id: ColumnType<number, Date, number> } }
  const source = null! as Instances<Source>

  accept<ReadonlyKysely<Target>>(source.db)
  accept<ReadonlyKysely<Target>>(source.transaction)
  accept<ReadonlyTransaction<Target>>(source.transaction)
  accept<ReadonlyKysely<Target>>(source.controlled)
  accept<ReadonlyTransaction<Target>>(source.controlled)
  accept<ReadonlyControlledTransaction<Target>>(source.controlled)
})

test('rejects readonly nullable columns where nonnullable columns are required', () => {
  const source = null! as Instances<{ a: { id: number | null } }>
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyKysely<DatabaseA>>(source.db)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyKysely<DatabaseA>>(source.transaction)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyTransaction<DatabaseA>>(source.transaction)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyKysely<DatabaseA>>(source.controlled)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyTransaction<DatabaseA>>(source.controlled)
  // @ts-expect-error the source does not meet the target schema
  accept<ReadonlyControlledTransaction<DatabaseA>>(source.controlled)
})

test('rejects readonly values where writable values are required', () => {
  const source = null! as Instances<DatabaseAB>
  // @ts-expect-error readonly databases do not provide writable capabilities
  accept<Kysely<DatabaseA>>(source.db)
  // @ts-expect-error readonly transactions do not provide writable capabilities
  accept<Kysely<DatabaseA>>(source.transaction)
  // @ts-expect-error readonly transactions do not provide writable capabilities
  accept<Transaction<DatabaseA>>(source.transaction)
  // @ts-expect-error readonly controlled transactions do not provide writable capabilities
  accept<Kysely<DatabaseA>>(source.controlled)
  // @ts-expect-error readonly controlled transactions do not provide writable capabilities
  accept<Transaction<DatabaseA>>(source.controlled)
  // @ts-expect-error readonly controlled transactions do not provide writable capabilities
  accept<ControlledTransaction<DatabaseA>>(source.controlled)
})

test('rejects inventing readonly transaction capabilities', () => {
  const source = null! as Instances<DatabaseA>
  // @ts-expect-error a readonly database is not a transaction
  accept<ReadonlyTransaction<DatabaseA>>(source.db)
  // @ts-expect-error a readonly database is not a controlled transaction
  accept<ReadonlyControlledTransaction<DatabaseA>>(source.db)
  // @ts-expect-error an automatic transaction does not expose controlled operations
  accept<ReadonlyControlledTransaction<DatabaseA>>(source.transaction)
})

test('rejects generic readonly schema extensions across classes', () => {
  function check<DB, Extra>(source: Instances<DB & Extra>) {
    // @ts-expect-error Extra may change the selected column types through ColumnType
    accept<ReadonlyKysely<DB>>(source.db)
    // @ts-expect-error Extra may change the selected column types through ColumnType
    accept<ReadonlyKysely<DB>>(source.transaction)
    // @ts-expect-error Extra may change the selected column types through ColumnType
    accept<ReadonlyTransaction<DB>>(source.transaction)
    // @ts-expect-error Extra may change the selected column types through ColumnType
    accept<ReadonlyKysely<DB>>(source.controlled)
    // @ts-expect-error Extra may change the selected column types through ColumnType
    accept<ReadonlyTransaction<DB>>(source.controlled)
    // @ts-expect-error Extra may change the selected column types through ColumnType
    accept<ReadonlyControlledTransaction<DB>>(source.controlled)
  }
})

test('accepts any as an explicit readonly schema escape hatch', () => {
  const source = null! as Instances<any>
  const concrete = null! as Instances<DatabaseA>

  accept<ReadonlyKysely<DatabaseA>>(source.db)
  accept<ReadonlyKysely<DatabaseA>>(source.transaction)
  accept<ReadonlyTransaction<DatabaseA>>(source.transaction)
  accept<ReadonlyKysely<DatabaseA>>(source.controlled)
  accept<ReadonlyTransaction<DatabaseA>>(source.controlled)
  accept<ReadonlyControlledTransaction<DatabaseA>>(source.controlled)

  accept<ReadonlyKysely<any>>(concrete.db)
  accept<ReadonlyKysely<any>>(concrete.transaction)
  accept<ReadonlyTransaction<any>>(concrete.transaction)
  accept<ReadonlyKysely<any>>(concrete.controlled)
  accept<ReadonlyTransaction<any>>(concrete.controlled)
  accept<ReadonlyControlledTransaction<any>>(concrete.controlled)
})
