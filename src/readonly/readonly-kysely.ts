import type { IsolationLevel } from '../driver/driver.js'
import type {
  Command,
  ConnectionBuilder,
  ControlledTransaction,
  ControlledTransactionBuilder,
  Kysely,
  Transaction,
  TransactionBuilder,
} from '../kysely.js'
import type {
  ReleaseSavepoint,
  RollbackToSavepoint,
} from '../parser/savepoint-parser.js'
import type { KyselyPlugin } from '../plugin/kysely-plugin.js'
import type { SelectQueryBuilder } from '../query-builder/select-query-builder.js'
import type { AbortableOperationOptions } from '../util/abort.js'
import type { KyselyTypeError } from '../util/type-error.js'
import type { DrainOuterGeneric } from '../util/type-utils.js'
import type { ReadonlyCompiledQuery } from './readonly-compiled-query.js'
import type { ReadonlyQueryResult } from './readonly-database-connection.js'
import type { ReadonlyAccessMode } from './readonly-driver.js'
import type { ReadonlyQueryCreator } from './readonly-query-creator.js'

/**
 * A helper type that allows you to expose a type-level read-only {@link Kysely} version
 * to your service's consumers.
 *
 * ### Examples
 *
 * ```ts
 * import * as Sqlite from 'better-sqlite3'
 * import { type Generated, Kysely, SqliteDialect } from 'kysely'
 * import type { ReadonlyKysely } from 'kysely/readonly'
 *
 * interface Database {
 *   person: {
 *     id: Generated<number>
 *     first_name: string
 *     last_name: string | null
 *   }
 * }
 *
 * function getDB(): ReadonlyKysely<Database> {
 *   return new Kysely({
 *     dialect: new SqliteDialect({
 *       database: new Sqlite(':memory:'),
 *     })
 *   }) as never
 * }
 *
 * const db = getDB()
 *
 * db.selectFrom('person') // works!
 * db.deleteFrom('person') // typescript compiler error!
 * ```
 */
export interface ReadonlyKysely<DB>
  extends
    ReadonlyQueryCreator<DB>,
    Pick<
      Kysely<DB>,
      'case' | 'destroy' | 'dynamic' | 'fn' | 'introspection' | 'isTransaction'
    > {
  /**
   * Similar to {@link Kysely.connection} but read-only.
   */
  connection(): ReadonlyConnectionBuilder<DB>

  /**
   * Similar to {@link Kysely.executeQuery} but read-only.
   */
  executeQuery<R>(
    query: ReadonlyCompiledQuery<R> | SelectQueryBuilder<DB, any, R>,
    options?: AbortableOperationOptions,
  ): Promise<ReadonlyQueryResult<R>>

  /**
   * @deprecated not allowed with a read-only Kysely instance.
   */
  executeQuery(
    ...args: any[]
  ): KyselyTypeError<'not allowed with a read-only Kysely instance.'>

  /**
   * @deprecated not allowed with a read-only Kysely instance.
   */
  getExecutor(
    ...args: any[]
  ): KyselyTypeError<'not allowed with a read-only Kysely instance.'>

  /**
   * @deprecated not allowed with a read-only Kysely instance.
   */
  get schema(): KyselyTypeError<'not allowed with a read-only Kysely instance.'>

  /**
   * Similar to {@link Kysely.transaction} but read-only.
   */
  transaction(): ReadonlyTransactionBuilder<DB>

  /**
   * Similar to {@link Kysely.startTransaction} but read-only.
   */
  startTransaction(): ReadonlyControlledTransactionBuilder<DB>

  /**
   * Similar to {@link Kysely.withoutPlugins} but read-only.
   */
  withoutPlugins(): ReadonlyKysely<DB>

  /**
   * Similar to {@link Kysely.withPlugin} but read-only.
   */
  withPlugin(plugin: KyselyPlugin): ReadonlyKysely<DB>

  /**
   * Similar to {@link Kysely.withSchema} but read-only.
   */
  withSchema(schema: string): ReadonlyKysely<DB>

  /**
   * Similar to {@link Kysely.withTables} but read-only.
   *
   * @deprecated use {@link $extendTables} instead.
   */
  withTables<T extends Record<string, Record<string, any>>>(): ReadonlyKysely<
    DrainOuterGeneric<DB & T>
  >

  /**
   * Similar to {@link Kysely.$extendTables} but read-only.
   */
  $extendTables<
    T extends Record<string, Record<string, any>>,
  >(): ReadonlyKysely<DrainOuterGeneric<DB & T>>

  /**
   * Similar to {@link Kysely.$omitTables} but read-only.
   */
  $omitTables<T extends keyof DB>(): ReadonlyKysely<
    DB extends object ? Omit<DB, T> : DB
  >

  /**
   * Similar to {@link Kysely.$pickTables} but read-only.
   */
  $pickTables<T extends keyof DB>(): ReadonlyKysely<
    DB extends object ? Pick<DB, T> : DB
  >
}

/**
 * Similar to {@link ConnectionBuilder} but read-only.
 */
export interface ReadonlyConnectionBuilder<DB> extends Omit<
  ConnectionBuilder<DB>,
  'execute'
> {
  /**
   * Similar to {@link ConnectionBuilder.execute} but read-only.
   */
  execute<T>(
    callback: (
      db: ReadonlyKysely<DB>,
      options?: AbortableOperationOptions,
    ) => Promise<T>,
    options?: AbortableOperationOptions,
  ): Promise<T>
}

/**
 * Similar to {@link TransactionBuilder} but read-only.
 */
export interface ReadonlyTransactionBuilder<DB> {
  /**
   * Similar to {@link TransactionBuilder.execute} but read-only.
   */
  execute<T>(
    callback: (
      trx: ReadonlyTransaction<DB>,
      options?: AbortableOperationOptions,
    ) => Promise<T>,
    options?: AbortableOperationOptions,
  ): Promise<T>

  /**
   * Similar to {@link TransactionBuilder.setAccessMode} but read-only.
   */
  setAccessMode(accessMode: ReadonlyAccessMode): ReadonlyTransactionBuilder<DB>

  /**
   * Similar to {@link TransactionBuilder.setIsolationLevel} but read-only.
   */
  setIsolationLevel(
    isolationLevel: IsolationLevel,
  ): ReadonlyTransactionBuilder<DB>
}

/**
 * Similar to {@link Transaction} but read-only.
 */
export interface ReadonlyTransaction<DB>
  extends
    Pick<
      ReadonlyKysely<DB>,
      | 'case'
      | 'deleteFrom'
      | 'dynamic'
      | 'executeQuery'
      | 'fn'
      | 'getExecutor'
      | 'insertInto'
      | 'introspection'
      | 'mergeInto'
      | 'replaceInto'
      | 'schema'
      | 'selectFrom'
      | 'selectNoFrom'
      | 'updateTable'
      | 'with'
      | 'withRecursive'
    >,
    Pick<
      Transaction<DB>,
      | 'connection'
      | 'destroy'
      | 'isTransaction'
      | 'startTransaction'
      | 'transaction'
    > {
  /**
   * Similar to {@link Transaction.withoutPlugins} but read-only.
   */
  withoutPlugins(): ReadonlyTransaction<DB>

  /**
   * Similar to {@link Transaction.withPlugin} but read-only.
   */
  withPlugin(plugin: KyselyPlugin): ReadonlyTransaction<DB>

  /**
   * Similar to {@link Transaction.withSchema} but read-only.
   */
  withSchema(schema: string): ReadonlyTransaction<DB>

  /**
   * Similar to {@link Transaction.withTables} but read-only.
   *
   * @deprecated use {@link $extendTables} instead.
   */
  withTables<
    T extends Record<string, Record<string, any>>,
  >(): ReadonlyTransaction<DrainOuterGeneric<DB & T>>

  /**
   * Similar to {@link Transaction.$extendTables} but read-only.
   */
  $extendTables<
    T extends Record<string, Record<string, any>>,
  >(): ReadonlyTransaction<DrainOuterGeneric<DB & T>>

  /**
   * Similar to {@link Transaction.$omitTables} but read-only.
   */
  $omitTables<T extends keyof DB>(): ReadonlyTransaction<
    DB extends object ? Omit<DB, T> : DB
  >

  /**
   * Similar to {@link Transaction.$pickTables} but read-only.
   */
  $pickTables<T extends keyof DB>(): ReadonlyTransaction<
    DB extends object ? Pick<DB, T> : DB
  >
}

/**
 * Similar to {@link ControlledTransactionBuilder} but read-only.
 */
export interface ReadonlyControlledTransactionBuilder<DB> {
  /**
   * Similar to {@link ControlledTransactionBuilder.execute} but read-only.
   */
  execute(
    options?: AbortableOperationOptions,
  ): Promise<ReadonlyControlledTransaction<DB>>

  /**
   * Similar to {@link ControlledTransactionBuilder.setAccessMode} but read-only.
   */
  setAccessMode(
    accessMode: ReadonlyAccessMode,
  ): ReadonlyControlledTransactionBuilder<DB>

  /**
   * Similar to {@link ControlledTransactionBuilder.setIsolationLevel} but read-only.
   */
  setIsolationLevel(
    isolationLevel: IsolationLevel,
  ): ReadonlyControlledTransactionBuilder<DB>
}

/**
 * Similar to {@link ControlledTransaction} but read-only.
 */
export interface ReadonlyControlledTransaction<DB, S extends string[] = []>
  extends
    ReadonlyTransaction<DB>,
    Pick<
      ControlledTransaction<DB, S>,
      'commit' | 'isCommitted' | 'isRolledBack' | 'rollback'
    > {
  /**
   * Similar to {@link ControlledTransaction.releaseSavepoint} but read-only.
   */
  releaseSavepoint<SN extends S[number]>(
    savepointName: SN,
  ): ReleaseSavepoint<S, SN> extends string[]
    ? Command<ReadonlyControlledTransaction<DB, ReleaseSavepoint<S, SN>>>
    : never

  /**
   * Similar to {@link ControlledTransaction.rollbackToSavepoint} but read-only.
   */
  rollbackToSavepoint<SN extends S[number]>(
    savepointName: SN,
  ): RollbackToSavepoint<S, SN> extends string[]
    ? Command<ReadonlyControlledTransaction<DB, RollbackToSavepoint<S, SN>>>
    : never

  /**
   * Similar to {@link ControlledTransaction.savepoint} but read-only.
   */
  savepoint<SN extends string>(
    savepointName: SN extends S ? never : SN,
  ): Command<ReadonlyControlledTransaction<DB, [...S, SN]>>

  /**
   * Similar to {@link ControlledTransaction.withoutPlugins} but read-only.
   */
  withoutPlugins(): ReadonlyControlledTransaction<DB, S>

  /**
   * Similar to {@link ControlledTransaction.withPlugin} but read-only.
   */
  withPlugin(plugin: KyselyPlugin): ReadonlyControlledTransaction<DB, S>

  /**
   * Similar to {@link ControlledTransaction.withSchema} but read-only.
   */
  withSchema(schema: string): ReadonlyControlledTransaction<DB, S>

  /**
   * Similar to {@link ControlledTransaction.withTables} but read-only.
   *
   * @deprecated use {@link $extendTables} instead.
   */
  withTables<
    T extends Record<string, Record<string, any>>,
  >(): ReadonlyControlledTransaction<DrainOuterGeneric<DB & T>, S>

  /**
   * Similar to {@link ControlledTransaction.$extendTables} but read-only.
   */
  $extendTables<
    T extends Record<string, Record<string, any>>,
  >(): ReadonlyControlledTransaction<DrainOuterGeneric<DB & T>, S>

  /**
   * Similar to {@link ControlledTransaction.$omitTables} but read-only.
   */
  $omitTables<T extends keyof DB>(): ReadonlyControlledTransaction<
    DB extends object ? Omit<DB, T> : DB,
    S
  >

  /**
   * Similar to {@link ControlledTransaction.$pickTables} but read-only.
   */
  $pickTables<T extends keyof DB>(): ReadonlyControlledTransaction<
    DB extends object ? Pick<DB, T> : DB,
    S
  >
}
