import type {
  ReadonlyKysely,
  ReadonlyTransaction,
} from '../../../dist/readonly/index.js'
import { expectTypeOf, test } from 'vitest'
import type {
  ControlledTransaction,
  Kysely,
  Transaction,
} from '../../../dist/index.js'
import {
  accept,
  a,
  type DatabaseA,
  type DatabaseB,
  type Instances,
  type ReadonlyInstances,
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

// TODO: Investigate generic table selection assignability later. Couldn't find a
// solution that doesn't heavily regress type benchmarks, especially on TS7.
// test('preserves generic table selections when assigning to parent classes', () => {
//   function check<DB extends DatabaseAB>(source: Instances<DB>) {
//     accept<Kysely<Pick<DB, 'a'>>>(source.transaction.$pickTables<'a'>())
//     accept<Kysely<Pick<DB, 'a'>>>(source.controlled.$pickTables<'a'>())
//     accept<Transaction<Pick<DB, 'a'>>>(source.controlled.$pickTables<'a'>())
//   }
// })

// TODO: Investigate generic table omission assignability later. Couldn't find a
// solution that doesn't significantly regress type benchmarks on TS6 and TS7.
// test('preserves generic table omissions when assigning to parent classes', () => {
//   function check<DB extends DatabaseAB>(source: Instances<DB>) {
//     accept<Kysely<Omit<DB, 'b'>>>(source.transaction.$omitTables<'b'>())
//     accept<Kysely<Omit<DB, 'b'>>>(source.controlled.$omitTables<'b'>())
//     accept<Transaction<Omit<DB, 'b'>>>(source.controlled.$omitTables<'b'>())
//   }
// })

test('preserves any schemas through table helpers', () => {
  const db = null! as Kysely<any>
  const tx = null! as Transaction<any>
  const controlled = null! as ControlledTransaction<any, ['s']>
  expectTypeOf(db.$pickTables<'a'>()).toEqualTypeOf<Kysely<any>>()
  expectTypeOf(db.$omitTables<'a'>()).toEqualTypeOf<Kysely<any>>()
  expectTypeOf(tx.$pickTables<'a'>()).toEqualTypeOf<Transaction<any>>()
  expectTypeOf(tx.$omitTables<'a'>()).toEqualTypeOf<Transaction<any>>()
  expectTypeOf(controlled.$pickTables<'a'>()).toEqualTypeOf<
    ControlledTransaction<any, ['s']>
  >()
  expectTypeOf(controlled.$omitTables<'a'>()).toEqualTypeOf<
    ControlledTransaction<any, ['s']>
  >()
  expectTypeOf<ReturnType<typeof db.$pickTables<'a'>>>().toEqualTypeOf<
    Kysely<any>
  >()
  expectTypeOf<ReturnType<typeof db.$omitTables<'a'>>>().toEqualTypeOf<
    Kysely<any>
  >()
  expectTypeOf<ReturnType<typeof tx.$pickTables<'a'>>>().toEqualTypeOf<
    Transaction<any>
  >()
  expectTypeOf<ReturnType<typeof tx.$omitTables<'a'>>>().toEqualTypeOf<
    Transaction<any>
  >()
  expectTypeOf<ReturnType<typeof controlled.$pickTables<'a'>>>().toEqualTypeOf<
    ControlledTransaction<any, ['s']>
  >()
  expectTypeOf<ReturnType<typeof controlled.$omitTables<'a'>>>().toEqualTypeOf<
    ControlledTransaction<any, ['s']>
  >()
  db.$pickTables<'a'>().selectFrom('other').selectAll()
  tx.$pickTables<'a'>().selectFrom('other').selectAll()
  controlled.$pickTables<'a'>().selectFrom('other').selectAll()
})

test('readonly: preserves generic table extensions when assigning to parent classes', () => {
  function check<DB>(source: ReadonlyInstances<DB>) {
    accept<ReadonlyKysely<DB & DatabaseB>>(
      source.transaction.$extendTables<DatabaseB>(),
    )
    accept<ReadonlyKysely<DB & DatabaseB>>(
      source.controlled.$extendTables<DatabaseB>(),
    )
    accept<ReadonlyTransaction<DB & DatabaseB>>(
      source.controlled.$extendTables<DatabaseB>(),
    )
    accept<ReadonlyKysely<DB & DatabaseB>>(
      source.transaction.withTables<DatabaseB>(),
    )
    accept<ReadonlyTransaction<DB & DatabaseB>>(
      source.controlled.withTables<DatabaseB>(),
    )
  }
})
