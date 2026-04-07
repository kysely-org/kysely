import {
  expectAssignable,
  expectDeprecated,
  expectError,
  expectNotDeprecated,
  expectType,
} from 'tsd'
import type { Database } from '../shared.js'
import type {
  ReadonlyAccessMode,
  ReadonlyConnectionBuilder,
  ReadonlyControlledTransaction,
  ReadonlyControlledTransactionBuilder,
  ReadonlyKysely,
  ReadonlyQueryCreator,
  ReadonlyQueryResult,
  ReadonlyTransaction,
  ReadonlyTransactionBuilder,
} from '../../../dist/cjs/readonly/index.js'
import {
  createQueryId,
  DeleteQueryNode,
  type InferResult,
  type ControlledTransaction,
  type ControlledTransactionBuilder,
  type Kysely,
  type KyselyTypeError,
  type Selectable,
  SelectQueryNode,
  type Transaction,
  type TransactionBuilder,
} from '../../../dist/cjs/index.js'

async function testReadonlyKysely(
  db: Kysely<Database>,
  rdb: ReadonlyKysely<Database>,
) {
  // this one ensures that we keep `ReadonlyKysely` aligned with addition/removal of props/functions.
  expectType<keyof typeof db & string>(keyof(rdb))

  expectType<
    ReadonlyKysely<
      DatabaseOf<
        ReturnType<typeof db.$extendTables<{ moshe: { haim: boolean } }>>
      >
    >
  >(rdb.$extendTables<{ moshe: { haim: boolean } }>())
  expectNotDeprecated(rdb.$extendTables)

  expectType<
    ReadonlyKysely<
      DatabaseOf<ReturnType<typeof db.$omitTables<'person_metadata'>>>
    >
  >(rdb.$omitTables<'person_metadata'>())
  expectNotDeprecated(rdb.$omitTables)

  expectType<
    ReadonlyKysely<
      DatabaseOf<ReturnType<typeof db.$pickTables<'person_metadata'>>>
    >
  >(rdb.$pickTables<'person_metadata'>())
  expectNotDeprecated(rdb.$pickTables)

  expectType<(typeof db)['case']>(rdb.case)
  expectNotDeprecated(rdb.case)

  expectType<ReadonlyConnectionBuilder<Database>>(rdb.connection())
  expectNotDeprecated(rdb.connection)
  expectType<
    (
      callback: (db: ReadonlyKysely<Database>) => Promise<{ moshe: true }>,
    ) => Promise<{ moshe: true }>
  >(rdb.connection().execute<{ moshe: true }>)
  expectNotDeprecated(rdb.connection().execute)

  expectType<NotAllowed>(rdb.deleteFrom)
  expectDeprecated(rdb.deleteFrom)

  expectType<(typeof db)['destroy']>(rdb.destroy)
  expectNotDeprecated(rdb.destroy)

  expectType<(typeof db)['dynamic']>(rdb.dynamic)
  expectNotDeprecated(rdb.dynamic)

  const compiledSelectQuery = {
    query: SelectQueryNode.create(),
    queryId: createQueryId(),
    sql: '',
    parameters: [],
  }
  const executeCompiledSelectQueryResult = await rdb.executeQuery<{
    moshe: true
  }>(compiledSelectQuery)
  expectType<ReadonlyQueryResult<{ moshe: true }>>(
    executeCompiledSelectQueryResult,
  )
  expectNotDeprecated(rdb.executeQuery<{ moshe: true }>(compiledSelectQuery))
  const selectQuery = db.selectFrom('action').selectAll()
  const executeSelectQueryResult = await rdb.executeQuery(selectQuery)
  expectType<ReadonlyQueryResult<InferResult<typeof selectQuery>[number]>>(
    executeSelectQueryResult,
  )
  expectNotDeprecated(rdb.executeQuery(selectQuery))
  expectAssignable<NotAllowed>(rdb.executeQuery)
  expectDeprecated(
    rdb.executeQuery({
      query: DeleteQueryNode.create([]),
      queryId: createQueryId(),
      sql: '',
      parameters: [],
    }),
  )
  expectType<
    keyof Awaited<ReturnType<typeof db.executeQuery<{ moshe: true }>>>
  >(keyof(executeCompiledSelectQueryResult))
  expectType<{ moshe: true }[]>(executeCompiledSelectQueryResult.rows)
  expectNotDeprecated(executeCompiledSelectQueryResult.rows)
  expectType<
    KyselyTypeError<'read-only queries do not insert anything.'> | undefined
  >(executeCompiledSelectQueryResult.insertId)
  expectDeprecated(executeCompiledSelectQueryResult.insertId)
  expectType<
    KyselyTypeError<'read-only queries do not affect any rows.'> | undefined
  >(executeCompiledSelectQueryResult.numAffectedRows)
  expectDeprecated(executeCompiledSelectQueryResult.numAffectedRows)
  expectType<
    KyselyTypeError<'read-only queries do not change any rows.'> | undefined
  >(executeCompiledSelectQueryResult.numChangedRows)
  expectDeprecated(executeCompiledSelectQueryResult.numChangedRows)

  expectType<(typeof db)['fn']>(rdb.fn)
  expectNotDeprecated(rdb.fn)

  expectType<NotAllowed>(rdb.getExecutor)
  expectDeprecated(rdb.getExecutor)

  expectType<NotAllowed>(rdb.insertInto)
  expectDeprecated(rdb.insertInto)

  expectType<(typeof db)['introspection']>(rdb.introspection)
  expectNotDeprecated(rdb.introspection)

  expectType<(typeof db)['isTransaction']>(rdb.isTransaction)
  expectNotDeprecated(rdb.isTransaction)

  expectType<NotAllowed>(rdb.mergeInto)
  expectDeprecated(rdb.mergeInto)

  expectType<NotAllowed>(rdb.replaceInto)
  expectDeprecated(rdb.replaceInto)

  expectType<KyselyTypeError<'not allowed with a read-only Kysely instance.'>>
  expectDeprecated(rdb.schema)

  expectType<(typeof db)['selectFrom']>(rdb.selectFrom)
  expectNotDeprecated(rdb.selectFrom)

  expectType<(typeof db)['selectNoFrom']>(rdb.selectNoFrom)
  expectNotDeprecated(rdb.selectNoFrom)

  const startTransactionResult = rdb.startTransaction()
  expectType<ReadonlyControlledTransactionBuilder<Database>>(
    startTransactionResult,
  )
  expectNotDeprecated(rdb.startTransaction)
  expectType<keyof ReturnType<typeof db.startTransaction>>(
    keyof(startTransactionResult),
  )
  expectType<
    (
      accessMode: ReadonlyAccessMode,
    ) => ReadonlyControlledTransactionBuilder<Database>
  >(startTransactionResult.setAccessMode)
  expectNotDeprecated(startTransactionResult.setAccessMode)
  expectType<
    (
      ...args: Parameters<
        ControlledTransactionBuilder<Database>['setIsolationLevel']
      >
    ) => ReadonlyControlledTransactionBuilder<Database>
  >(startTransactionResult.setIsolationLevel)
  expectNotDeprecated(startTransactionResult.setIsolationLevel)
  const controlledTransaction = await startTransactionResult.execute()
  expectType<ReadonlyControlledTransaction<Database>>(controlledTransaction)
  expectNotDeprecated(startTransactionResult.execute)

  expectType<ReadonlyTransactionBuilder<Database>>(rdb.transaction())
  expectNotDeprecated(rdb.transaction)
  expectType<
    (
      cb: (trx: ReadonlyTransaction<Database>) => Promise<{ moshe: true }>,
    ) => Promise<{ moshe: true }>
  >(rdb.transaction().execute<{ moshe: true }>)
  expectNotDeprecated(rdb.transaction().execute)
  expectType<
    (accessMode: ReadonlyAccessMode) => ReadonlyTransactionBuilder<Database>
  >(rdb.transaction().setAccessMode)
  expectNotDeprecated(rdb.transaction().setAccessMode)
  expectType<
    (
      ...args: Parameters<TransactionBuilder<Database>['setIsolationLevel']>
    ) => ReadonlyTransactionBuilder<Database>
  >(rdb.transaction().setIsolationLevel)
  expectNotDeprecated(rdb.transaction().setIsolationLevel)

  expectType<NotAllowed>(rdb.updateTable)
  expectDeprecated(rdb.updateTable)

  expectType<
    ReadonlyQueryCreator<Database & { cte: Selectable<Database['action']> }>
  >(rdb.with('cte', rdb.selectFrom('action').selectAll()))
  expectType<
    ReadonlyQueryCreator<Database & { cte: Selectable<Database['action']> }>
  >(rdb.with('cte', (qb) => qb.selectFrom('action').selectAll()))
  expectNotDeprecated(rdb.with)
  expectError(rdb.with('cte', db.deleteFrom('action').returningAll()))
  expectError(rdb.with('cte', (qb) => qb.deleteFrom('action').returningAll()))
  expectError(
    rdb.with(
      'cte',
      db
        .insertInto('action')
        .values({ callback_url: 'url', queue_id: '12', type: 'CALL_WEBHOOK' })
        .returningAll(),
    ),
  )
  expectError(
    rdb.with('cte', (qb) =>
      qb
        .insertInto('action')
        .values({ callback_url: 'url', queue_id: '12', type: 'CALL_WEBHOOK' })
        .returningAll(),
    ),
  )
  expectError(
    rdb.with(
      'cte',
      db
        .replaceInto('action')
        .values({ callback_url: 'url', queue_id: '12', type: 'CALL_WEBHOOK' })
        .returningAll(),
    ),
  )
  expectError(
    rdb.with('cte', (qb) =>
      qb
        .replaceInto('action')
        .values({ callback_url: 'url', queue_id: '12', type: 'CALL_WEBHOOK' })
        .returningAll(),
    ),
  )
  expectError(
    rdb.with(
      'cte',
      db.updateTable('action').set('type', 'CALL_WEBHOOK').returningAll(),
    ),
  )
  expectError(
    rdb.with('cte', (qb) =>
      qb.updateTable('action').set('type', 'CALL_WEBHOOK').returningAll(),
    ),
  )

  expectType<typeof rdb>(rdb.withPlugin(null as never))
  expectNotDeprecated(rdb.withPlugin)

  rdb.withRecursive('cte(callback_url, id, queue_id, type)', (qb) =>
    qb.selectFrom('cte').selectAll(),
  )
  expectNotDeprecated(rdb.withRecursive)
  expectError(
    rdb.withRecursive('cte', (qb) => qb.deleteFrom('action').returningAll()),
  )
  expectError(
    rdb.withRecursive('cte', (qb) =>
      qb
        .insertInto('action')
        .values({ callback_url: 'url', queue_id: '12', type: 'CALL_WEBHOOK' })
        .returningAll(),
    ),
  )
  expectError(
    rdb.withRecursive('cte', (qb) =>
      qb
        .replaceInto('action')
        .values({ callback_url: 'url', queue_id: '12', type: 'CALL_WEBHOOK' })
        .returningAll(),
    ),
  )
  expectError(
    rdb.withRecursive('cte', (qb) =>
      qb.updateTable('action').set('type', 'CALL_WEBHOOK').returningAll(),
    ),
  )

  expectType<typeof rdb>(rdb.withSchema('moshe'))
  expectNotDeprecated(rdb.withSchema)

  expectType<typeof rdb>(rdb.withoutPlugins())
  expectNotDeprecated(rdb.withoutPlugins)

  expectType<typeof rdb.$extendTables>(rdb.withTables)
  expectDeprecated(rdb.withTables)
}

async function testReadonlyTransaction(
  tx: Transaction<Database>,
  rtx: ReadonlyTransaction<Database>,
) {
  expectType<
    (keyof ReadonlyKysely<Database> & string) | (keyof typeof tx & string)
  >(keyof(rtx))

  expectType<
    ReadonlyTransaction<
      DatabaseOf<ReturnType<typeof tx.$extendTables<{ moshe: { haim: true } }>>>
    >
  >(rtx.$extendTables<{ moshe: { haim: true } }>())
  expectNotDeprecated(rtx.$extendTables)

  expectType<
    ReadonlyTransaction<
      DatabaseOf<ReturnType<typeof tx.$omitTables<'person_metadata'>>>
    >
  >(rtx.$omitTables<'person_metadata'>())
  expectNotDeprecated(rtx.$omitTables)

  expectType<
    ReadonlyTransaction<
      DatabaseOf<ReturnType<typeof tx.$pickTables<'person_metadata'>>>
    >
  >(rtx.$pickTables<'person_metadata'>())
  expectNotDeprecated(rtx.$pickTables)

  expectType<typeof tx.case>(rtx.case)
  expectNotDeprecated(rtx.case)

  expectType<typeof tx.connection>(rtx.connection)
  expectDeprecated(rtx.connection)

  expectType<NotAllowed>(rtx.deleteFrom)
  expectDeprecated(rtx.deleteFrom)

  expectType<typeof tx.destroy>(rtx.destroy)
  expectDeprecated(rtx.destroy)

  expectType<typeof tx.dynamic>(rtx.dynamic)
  expectNotDeprecated(rtx.dynamic)

  expectType<ReadonlyKysely<Database>['executeQuery']>(rtx.executeQuery)
  expectNotDeprecated(rtx.executeQuery(rtx.selectFrom('action').selectAll()))
  expectDeprecated(rtx.executeQuery)

  expectType<typeof tx.fn>(rtx.fn)
  expectNotDeprecated(rtx.fn)

  expectType<NotAllowed>(rtx.getExecutor)
  expectDeprecated(rtx.getExecutor)

  expectType<NotAllowed>(rtx.insertInto)
  expectDeprecated(rtx.insertInto)

  expectType<typeof tx.introspection>(rtx.introspection)
  expectNotDeprecated(rtx.introspection)

  expectType<typeof tx.isTransaction>(rtx.isTransaction)
  expectNotDeprecated(rtx.isTransaction)

  expectType<NotAllowed>(rtx.mergeInto)
  expectDeprecated(rtx.mergeInto)

  expectType<NotAllowed>(rtx.replaceInto)
  expectDeprecated(rtx.replaceInto)

  expectType<KyselyTypeError<'not allowed with a read-only Kysely instance.'>>(
    rtx.schema,
  )
  expectDeprecated(rtx.schema)

  expectType<typeof tx.selectFrom>(rtx.selectFrom)
  expectNotDeprecated(rtx.selectFrom)

  expectType<typeof tx.selectNoFrom>(rtx.selectNoFrom)
  expectNotDeprecated(rtx.selectNoFrom)

  expectType<typeof tx.startTransaction>(rtx.startTransaction)
  expectDeprecated(rtx.startTransaction)

  expectType<typeof tx.transaction>(rtx.transaction)
  expectDeprecated(rtx.transaction)

  expectType<NotAllowed>(rtx.updateTable)
  expectDeprecated(rtx.updateTable)

  expectType<ReadonlyKysely<Database>['with']>(rtx.with)
  expectNotDeprecated(rtx.with)

  expectType<typeof rtx>(rtx.withPlugin(null as never))
  expectNotDeprecated(rtx.withPlugin)

  expectType<ReadonlyKysely<Database>['withRecursive']>(rtx.withRecursive)
  expectNotDeprecated(rtx.withRecursive)

  expectType<typeof rtx>(rtx.withSchema('rivka'))
  expectNotDeprecated(rtx.withSchema)

  expectType<typeof rtx.$extendTables>(rtx.withTables)
  expectDeprecated(rtx.withTables)

  expectType<typeof rtx>(rtx.withoutPlugins())
  expectNotDeprecated(rtx.withoutPlugins)
}

async function testReadonlyControlledTransaction(
  tx: ControlledTransaction<Database, ['haim', 'moshe']>,
  rtx: ReadonlyControlledTransaction<Database, ['haim', 'moshe']>,
) {
  expectType<
    | (keyof ReadonlyKysely<Database> & string)
    | (keyof ReadonlyTransaction<Database> & string)
    | (keyof typeof tx & string)
  >(keyof(rtx))

  expectType<
    ReadonlyControlledTransaction<
      DatabaseOf<
        ReturnType<typeof tx.$extendTables<{ moshe: { haim: true } }>>
      >,
      SavepointsOf<
        ReturnType<typeof tx.$extendTables<{ moshe: { haim: true } }>>
      >
    >
  >(rtx.$extendTables<{ moshe: { haim: true } }>())
  expectNotDeprecated(rtx.$extendTables)

  expectType<
    ReadonlyControlledTransaction<
      DatabaseOf<ReturnType<typeof tx.$omitTables<'person_metadata'>>>,
      SavepointsOf<ReturnType<typeof tx.$omitTables<'person_metadata'>>>
    >
  >(rtx.$omitTables<'person_metadata'>())
  expectNotDeprecated(rtx.$omitTables)

  expectType<
    ReadonlyControlledTransaction<
      DatabaseOf<ReturnType<typeof tx.$pickTables<'person_metadata'>>>,
      SavepointsOf<ReturnType<typeof tx.$pickTables<'person_metadata'>>>
    >
  >(rtx.$pickTables<'person_metadata'>())
  expectNotDeprecated(rtx.$pickTables)

  expectType<typeof tx.case>(rtx.case)
  expectNotDeprecated(rtx.case)

  expectType<typeof tx.commit>(rtx.commit)
  expectNotDeprecated(rtx.commit)

  expectType<typeof tx.connection>(rtx.connection)
  expectDeprecated(rtx.connection)

  expectType<NotAllowed>(rtx.deleteFrom)
  expectDeprecated(rtx.deleteFrom)

  expectType<typeof tx.destroy>(rtx.destroy)
  expectDeprecated(rtx.destroy)

  expectType<typeof tx.dynamic>(rtx.dynamic)
  expectNotDeprecated(rtx.dynamic)

  expectType<ReadonlyKysely<Database>['executeQuery']>(rtx.executeQuery)
  expectNotDeprecated(rtx.executeQuery(rtx.selectFrom('action').selectAll()))
  expectDeprecated(rtx.executeQuery)

  expectType<typeof tx.fn>(rtx.fn)
  expectNotDeprecated(rtx.fn)

  expectType<NotAllowed>(rtx.getExecutor)
  expectDeprecated(rtx.getExecutor)

  expectType<NotAllowed>(rtx.insertInto)
  expectDeprecated(rtx.insertInto)

  expectType<typeof tx.introspection>(rtx.introspection)
  expectNotDeprecated(rtx.introspection)

  expectType<typeof tx.isCommitted>(rtx.isCommitted)
  expectNotDeprecated(rtx.isCommitted)

  expectType<typeof tx.isRolledBack>(rtx.isRolledBack)
  expectNotDeprecated(rtx.isRolledBack)

  expectType<typeof tx.isTransaction>(rtx.isTransaction)
  expectNotDeprecated(rtx.isTransaction)

  expectType<NotAllowed>(rtx.mergeInto)
  expectDeprecated(rtx.mergeInto)

  expectType<
    ReadonlyControlledTransaction<
      DatabaseOf<
        Awaited<
          ReturnType<ReturnType<typeof tx.releaseSavepoint<'moshe'>>['execute']>
        >
      >,
      SavepointsOf<
        Awaited<
          ReturnType<ReturnType<typeof tx.releaseSavepoint<'moshe'>>['execute']>
        >
      >
    >
  >(await rtx.releaseSavepoint('moshe').execute())
  expectNotDeprecated(rtx.releaseSavepoint)
  expectNotDeprecated(rtx.releaseSavepoint('moshe').execute)

  expectType<NotAllowed>(rtx.replaceInto)
  expectDeprecated(rtx.replaceInto)

  expectType<typeof tx.rollback>(rtx.rollback)
  expectNotDeprecated(rtx.rollback)

  expectType<
    ReadonlyControlledTransaction<
      DatabaseOf<
        Awaited<
          ReturnType<
            ReturnType<typeof tx.rollbackToSavepoint<'haim'>>['execute']
          >
        >
      >,
      SavepointsOf<
        Awaited<
          ReturnType<
            ReturnType<typeof tx.rollbackToSavepoint<'haim'>>['execute']
          >
        >
      >
    >
  >(await rtx.rollbackToSavepoint('haim').execute())
  expectNotDeprecated(rtx.rollbackToSavepoint)
  expectNotDeprecated(rtx.rollbackToSavepoint('haim').execute)

  expectType<
    ReadonlyControlledTransaction<
      DatabaseOf<
        Awaited<ReturnType<ReturnType<typeof tx.savepoint<'rivka'>>['execute']>>
      >,
      SavepointsOf<
        Awaited<ReturnType<ReturnType<typeof tx.savepoint<'rivka'>>['execute']>>
      >
    >
  >(await rtx.savepoint('rivka').execute())
  expectNotDeprecated(rtx.savepoint)
  expectNotDeprecated(rtx.savepoint('rivka').execute)

  expectType<KyselyTypeError<'not allowed with a read-only Kysely instance.'>>(
    rtx.schema,
  )
  expectDeprecated(rtx.schema)

  expectType<typeof tx.selectFrom>(rtx.selectFrom)
  expectNotDeprecated(rtx.selectFrom)

  expectType<typeof tx.selectNoFrom>(rtx.selectNoFrom)
  expectNotDeprecated(rtx.selectNoFrom)

  expectType<typeof tx.startTransaction>(rtx.startTransaction)
  expectDeprecated(rtx.startTransaction)

  expectType<typeof tx.transaction>(rtx.transaction)
  expectDeprecated(rtx.transaction)

  expectType<NotAllowed>(rtx.updateTable)
  expectDeprecated(rtx.updateTable)

  expectType<ReadonlyKysely<Database>['with']>(rtx.with)
  expectNotDeprecated(rtx.with)

  expectType<typeof rtx>(rtx.withPlugin(null as never))
  expectNotDeprecated(rtx.withPlugin)

  expectType<ReadonlyKysely<Database>['withRecursive']>(rtx.withRecursive)
  expectNotDeprecated(rtx.withRecursive)

  expectType<typeof rtx>(rtx.withSchema('rivka'))
  expectNotDeprecated(rtx.withSchema)

  expectType<typeof rtx.$extendTables>(rtx.withTables)
  expectDeprecated(rtx.withTables)

  expectType<typeof rtx>(rtx.withoutPlugins())
  expectNotDeprecated(rtx.withoutPlugins)
}

type DatabaseOf<K> = K extends
  | Kysely<infer DB>
  | Transaction<infer DB>
  | ControlledTransaction<infer DB, any>
  ? DB
  : never

type SavepointsOf<T> = T extends ControlledTransaction<any, infer S> ? S : never

declare function keyof<T>(thing: T): keyof T & string

type NotAllowed = (
  ...args: any[]
) => KyselyTypeError<'not allowed with a read-only Kysely instance.'>
