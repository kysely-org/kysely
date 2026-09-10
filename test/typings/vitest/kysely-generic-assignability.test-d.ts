import { test } from 'vitest'
import type {
  ControlledTransaction,
  Kysely,
  Transaction,
} from '../../../dist/index.js'
import {
  accept,
  a,
  type DatabaseA,
  type DatabaseAB,
  type DatabaseB,
  type Instances,
} from './assignability.fixtures.js'

test('accepts the same generic schema across classes', () => {
  function check<DB>(source: Instances<DB>) {
    accept<Kysely<DB>>(source.transaction)
    accept<Kysely<DB>>(source.controlled)
    accept<Transaction<DB>>(source.controlled)
  }
})

test('rejects generic schema extensions across all classes', () => {
  function check<DB, Extra>(source: Instances<DB & Extra>) {
    // @ts-expect-error Extra may narrow existing columns and reject writes allowed by DB
    accept<Kysely<DB>>(source.db)
    // @ts-expect-error Extra may narrow existing columns and reject writes allowed by DB
    accept<Kysely<DB>>(source.transaction)
    // @ts-expect-error Extra may narrow existing columns and reject writes allowed by DB
    accept<Transaction<DB>>(source.transaction)
    // @ts-expect-error Extra may narrow existing columns and reject writes allowed by DB
    accept<Kysely<DB>>(source.controlled)
    // @ts-expect-error Extra may narrow existing columns and reject writes allowed by DB
    accept<Transaction<DB>>(source.controlled)
    // @ts-expect-error Extra may narrow existing columns and reject writes allowed by DB
    accept<ControlledTransaction<DB>>(source.controlled)
  }
})

test('rejects constrained generic schemas where their constraint is required', () => {
  function check<DB extends DatabaseA>(source: Instances<DB>) {
    // @ts-expect-error DB may reject writes allowed by its constraint
    accept<Kysely<DatabaseA>>(source.db)
    // @ts-expect-error DB may reject writes allowed by its constraint
    accept<Kysely<DatabaseA>>(source.transaction)
    // @ts-expect-error DB may reject writes allowed by its constraint
    accept<Transaction<DatabaseA>>(source.transaction)
    // @ts-expect-error DB may reject writes allowed by its constraint
    accept<Kysely<DatabaseA>>(source.controlled)
    // @ts-expect-error DB may reject writes allowed by its constraint
    accept<Transaction<DatabaseA>>(source.controlled)
    // @ts-expect-error DB may reject writes allowed by its constraint
    accept<ControlledTransaction<DatabaseA>>(source.controlled)
  }
})

test('rejects replacing a generic schema with only its constraint', () => {
  function check<DB extends DatabaseA>() {
    // @ts-expect-error DB may require more than a
    accept<Kysely<DB>>(a.db)
    // @ts-expect-error DB may require more than a
    accept<Kysely<DB>>(a.transaction)
    // @ts-expect-error DB may require more than a
    accept<Transaction<DB>>(a.transaction)
    // @ts-expect-error DB may require more than a
    accept<Kysely<DB>>(a.controlled)
    // @ts-expect-error DB may require more than a
    accept<Transaction<DB>>(a.controlled)
    // @ts-expect-error DB may require more than a
    accept<ControlledTransaction<DB>>(a.controlled)
  }
})

test('preserves generic table extensions when assigning to parent classes', () => {
  function check<DB>(source: Instances<DB>) {
    accept<Kysely<DB & DatabaseB>>(
      source.transaction.$extendTables<DatabaseB>(),
    )
    accept<Kysely<DB & DatabaseB>>(source.controlled.$extendTables<DatabaseB>())
    accept<Transaction<DB & DatabaseB>>(
      source.controlled.$extendTables<DatabaseB>(),
    )
    accept<Kysely<DB & DatabaseB>>(source.transaction.withTables<DatabaseB>())
    accept<Transaction<DB & DatabaseB>>(
      source.controlled.withTables<DatabaseB>(),
    )
  }
})

test('preserves generic table selections when assigning to parent classes', () => {
  function check<DB extends DatabaseAB>(source: Instances<DB>) {
    accept<Kysely<Pick<DB, 'a'>>>(source.transaction.$pickTables<'a'>())
    accept<Kysely<Pick<DB, 'a'>>>(source.controlled.$pickTables<'a'>())
    accept<Transaction<Pick<DB, 'a'>>>(source.controlled.$pickTables<'a'>())
    accept<Kysely<Omit<DB, 'b'>>>(source.transaction.$omitTables<'b'>())
    accept<Kysely<Omit<DB, 'b'>>>(source.controlled.$omitTables<'b'>())
    accept<Transaction<Omit<DB, 'b'>>>(source.controlled.$omitTables<'b'>())
  }
})
