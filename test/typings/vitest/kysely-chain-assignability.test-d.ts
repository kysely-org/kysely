import { test } from 'vitest'
import type {
  ControlledTransaction,
  Kysely,
  KyselyPlugin,
  Transaction,
} from '../../../dist/index.js'
import type { QueryCreator } from '../../../dist/query-creator.js'
import {
  accept,
  a,
  ab,
  type DatabaseA,
  type DatabaseAB,
  type DatabaseB,
  type Row,
} from './assignability.fixtures.js'

declare const plugin: KyselyPlugin

test('accepts cross-class assignment after plugin and table helper chains', () => {
  const db = a.db
    .$extendTables<DatabaseB>()
    .withPlugin(plugin)
    .withSchema('app')
    .$pickTables<'a' | 'b'>()
    .withoutPlugins()
  const transaction = a.transaction
    .$extendTables<DatabaseB>()
    .withPlugin(plugin)
    .withSchema('app')
    .$pickTables<'a' | 'b'>()
    .withoutPlugins()
  const controlled = a.controlled
    .withTables<DatabaseB>()
    .withPlugin(plugin)
    .withSchema('app')
    .$pickTables<'a' | 'b'>()
    .withoutPlugins()

  accept<Kysely<DatabaseA>>(db)
  accept<Kysely<DatabaseA>>(transaction)
  accept<Transaction<DatabaseA>>(transaction)
  accept<Kysely<DatabaseA>>(controlled)
  accept<Transaction<DatabaseA>>(controlled)
  accept<ControlledTransaction<DatabaseA>>(controlled)
  accept<Kysely<DatabaseAB>>(db)
  accept<Transaction<DatabaseAB>>(transaction)
  accept<ControlledTransaction<DatabaseAB>>(controlled)
})

test('rejects missing tables after plugin and table helper chains', () => {
  const db = ab.db.$omitTables<'b'>().withSchema('app').withPlugin(plugin)
  const transaction = ab.transaction
    .$pickTables<'a'>()
    .withSchema('app')
    .withoutPlugins()
  const controlled = ab.controlled
    .$omitTables<'b'>()
    .withPlugin(plugin)
    .withoutPlugins()

  // @ts-expect-error the chain removed b
  accept<Kysely<DatabaseAB>>(db)
  // @ts-expect-error the chain removed b
  accept<Kysely<DatabaseAB>>(transaction)
  // @ts-expect-error the chain removed b
  accept<Transaction<DatabaseAB>>(transaction)
  // @ts-expect-error the chain removed b
  accept<Kysely<DatabaseAB>>(controlled)
  // @ts-expect-error the chain removed b
  accept<Transaction<DatabaseAB>>(controlled)
  // @ts-expect-error the chain removed b
  accept<ControlledTransaction<DatabaseAB>>(controlled)
})

test('accepts CTE query creators from all three classes', () => {
  const db = a.db.with('b', (qb) => qb.selectFrom('a').select('id'))
  const transaction = a.transaction.with('b', (qb) =>
    qb.selectFrom('a').select('id'),
  )
  const controlled = a.controlled.with('b', (qb) =>
    qb.selectFrom('a').select('id'),
  )

  accept<QueryCreator<DatabaseAB>>(db)
  accept<QueryCreator<DatabaseAB>>(transaction)
  accept<QueryCreator<DatabaseAB>>(controlled)
  accept<QueryCreator<DatabaseA>>(db)
  accept<QueryCreator<DatabaseA>>(transaction)
  accept<QueryCreator<DatabaseA>>(controlled)
  // @ts-expect-error a CTE query creator does not expose transaction methods
  accept<Transaction<DatabaseAB>>(transaction)
  // @ts-expect-error a CTE query creator does not expose controlled operations
  accept<ControlledTransaction<DatabaseAB>>(controlled)
})

test('rejects missing tables in CTE query creator assignments', () => {
  const db = a.db.with('c', (qb) => qb.selectFrom('a').select('id'))
  const transaction = a.transaction.with('c', (qb) =>
    qb.selectFrom('a').select('id'),
  )
  const controlled = a.controlled.with('c', (qb) =>
    qb.selectFrom('a').select('id'),
  )
  // @ts-expect-error the CTE added c, not b
  accept<QueryCreator<DatabaseAB>>(db)
  // @ts-expect-error the CTE added c, not b
  accept<QueryCreator<DatabaseAB>>(transaction)
  // @ts-expect-error the CTE added c, not b
  accept<QueryCreator<DatabaseAB>>(controlled)
})

test('preserves schemas through table helpers and recursive CTE chains', () => {
  const query = a.controlled
    .$extendTables<DatabaseB>()
    .$pickTables<'a' | 'b'>()
    .withPlugin(plugin)
    .withSchema('app')
    .withRecursive('c', (qb) =>
      qb.selectFrom('a').select('id').unionAll(qb.selectFrom('c').select('id')),
    )
    .with('d', (qb) => qb.selectFrom('c').select('id'))
    .withoutPlugins()

  accept<QueryCreator<DatabaseAB & { c: Row; d: Row }>>(query)
  accept<QueryCreator<{ d: Row }>>(query)
  // @ts-expect-error neither the helpers nor the CTEs declare e
  accept<QueryCreator<{ e: Row }>>(query)
})
