/**
 * @experimental
 */

import type { QueryResult } from './driver/database-connection.js'
import type { IsolationLevel } from './driver/driver.js'
import type { Expression } from './expression/expression.js'
import type {
  Command,
  ConnectionBuilder,
  ControlledTransaction,
  Kysely,
  Transaction,
  TransactionBuilder,
} from './kysely.js'
import type { SelectQueryNode } from './operation-node/select-query-node.js'
import type {
  ReleaseSavepoint,
  RollbackToSavepoint,
} from './parser/savepoint-parser.js'
import type {
  ExtractRowFromCommonTableExpression,
  ExtractRowFromCommonTableExpressionName,
  ExtractTableFromCommonTableExpressionName,
} from './parser/with-parser.js'
import type { KyselyPlugin } from './plugin/kysely-plugin.js'
import type { CTEBuilderCallback } from './query-builder/cte-builder.js'
import type { SelectQueryBuilder } from './query-builder/select-query-builder.js'
import type { CompiledQuery } from './query-compiler/compiled-query.js'
import type { QueryCreator } from './query-creator.js'
import type { KyselyTypeError } from './util/type-error.js'
import type { DrainOuterGeneric } from './util/type-utils.js'

/**
 * Similar to {@link QueryCreator} but read-only.
 */
export interface ReadonlyQueryCreator<DB> extends Pick<
  QueryCreator<DB>,
  'selectFrom' | 'selectNoFrom'
> {
  /**
   * @deprecated not allowed with a read-only Kysely instance.
   */
  deleteFrom(
    ...args: any[]
  ): KyselyTypeError<'not allowed with a read-only Kysely instance.'>

  /**
   * @deprecated not allowed with a read-only Kysely instance.
   */
  insertInto(
    ...args: any[]
  ): KyselyTypeError<'not allowed with a read-only Kysely instance.'>

  /**
   * @deprecated not allowed with a read-only Kysely instance.
   */
  mergeInto(
    ...args: any[]
  ): KyselyTypeError<'not allowed with a read-only Kysely instance.'>

  /**
   * @deprecated not allowed with a read-only Kysely instance.
   */
  replaceInto(
    ...args: any[]
  ): KyselyTypeError<'not allowed with a read-only Kysely instance.'>

  /**
   * @deprecated not allowed with a read-only Kysely instance.
   */
  updateTable(
    ...args: any[]
  ): KyselyTypeError<'not allowed with a read-only Kysely instance.'>

  /**
   * Similar to {@link QueryCreator.with} but read-only.
   */
  with<N extends string, E extends ReadonlyCommonTableExpression<DB, N>>(
    nameOrBuilder: N | CTEBuilderCallback<N>,
    expression: E,
  ): ReadonlyQueryCreatorWithCommonTableExpression<DB, N, E>

  /**
   * Similar to {@link QueryCreator.withRecursive} but read-only.
   */
  withRecursive<
    N extends string,
    E extends ReadonlyRecursiveCommonTableExpression<DB, N>,
  >(
    nameOrBuilder: N | CTEBuilderCallback<N>,
    expression: E,
  ): ReadonlyQueryCreatorWithCommonTableExpression<DB, N, E>
}

/**
 * Similar to {@link CommonTableExpression} but read-only.
 */
export type ReadonlyCommonTableExpression<DB, CN> =
  | ReadonlyCommonTableExpressionOutput<CN>
  | ReadonlyCommonTableExpressionFactory<DB, CN>

/**
 * Similar to {@link CommonTableExpressionFactory} but read-only.
 */
export type ReadonlyCommonTableExpressionFactory<DB, CN> = (
  creator: ReadonlyQueryCreator<DB>,
) => ReadonlyCommonTableExpressionOutput<CN>

/**
 * Similar to {@link RecursiveCommonTableExpression} but read-only.
 */
export type ReadonlyRecursiveCommonTableExpression<DB, CN extends string> = (
  creator: ReadonlyQueryCreator<
    // Recursive CTE can select from itself.
    DrainOuterGeneric<
      DB & {
        [K in ExtractTableFromCommonTableExpressionName<CN>]: ExtractRowFromCommonTableExpressionName<CN>
      }
    >
  >,
) => ReadonlyCommonTableExpressionOutput<CN>

export type ReadonlyCommonTableExpressionOutput<N> = Expression<
  ExtractRowFromCommonTableExpressionName<N>
>

export type ReadonlyQueryCreatorWithCommonTableExpression<
  DB,
  CN extends string,
  CTE,
> = ReadonlyQueryCreator<
  DrainOuterGeneric<
    DB & {
      [K in ExtractTableFromCommonTableExpressionName<CN>]: ExtractRowFromCommonTableExpression<CTE>
    }
  >
>

/**
 * A helper type that allows you to expose a type-level read-only {@link Kysely} version
 * to your service's consumers.
 *
 * ### Examples
 *
 * ```ts
 * import * as Sqlite from 'better-sqlite3'
 * import {
 *   type Generated,
 *   Kysely,
 *   type ReadonlyKysely,
 *   SqliteDialect
 * } from 'kysely'
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
    query:
      | (CompiledQuery<R> & { readonly query: SelectQueryNode })
      | SelectQueryBuilder<DB, any, R>,
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
  $omitTables<T extends keyof DB>(): ReadonlyKysely<Omit<DB, T>>

  /**
   * Similar to {@link Kysely.$pickTables} but read-only.
   */
  $pickTables<T extends keyof DB>(): ReadonlyKysely<Pick<DB, T>>
}

/**
 * Similar to {@link QueryResult} but for read-only queries.
 */
export interface ReadonlyQueryResult<R> extends Pick<QueryResult<R>, 'rows'> {
  /**
   * @deprecated read-only queries do not affect any rows.
   */
  readonly numAffectedRows?: KyselyTypeError<'read-only queries do not affect any rows.'>

  /**
   * @deprecated read-only queries do not change any rows.
   */
  readonly numChangedRows?: KyselyTypeError<'read-only queries do not change any rows.'>

  /**
   * @deprecated read-only queries do not insert anything.
   */
  readonly insertId?: KyselyTypeError<'read-only queries do not insert anything.'>
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
  execute<T>(callback: (db: ReadonlyKysely<DB>) => Promise<T>): Promise<T>
}

/**
 * Similar to {@link TransactionBuilder} but read-only.
 */
export interface ReadonlyTransactionBuilder<DB> {
  /**
   * Similar to {@link TransactionBuilder.execute} but read-only.
   */
  execute<T>(callback: (trx: ReadonlyTransaction<DB>) => Promise<T>): Promise<T>

  /**
   * Similar to {@link TransactionBuilder.setAccessMode} but read-only.
   */
  setAccessMode(accessMode: 'read only'): ReadonlyTransactionBuilder<DB>

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
    Omit<
      ReadonlyKysely<DB>,
      'connection' | 'destroy' | 'isTransaction' | 'transaction'
    >,
    Pick<
      Transaction<DB>,
      'connection' | 'destroy' | 'isTransaction' | 'transaction'
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
  withSchemaPlugin(schema: string): ReadonlyTransaction<DB>

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
  $omitTables<T extends keyof DB>(): ReadonlyTransaction<Omit<DB, T>>

  /**
   * Similar to {@link Transaction.$pickTables} but read-only.
   */
  $pickTables<T extends keyof DB>(): ReadonlyTransaction<Pick<DB, T>>
}

/**
 * Similar to {@link ControlledTransactionBuilder} but read-only.
 */
export interface ReadonlyControlledTransactionBuilder<DB> {
  /**
   * Similar to {@link ControlledTransactionBuilder.execute} but read-only.
   */
  execute(): Promise<ReadonlyControlledTransaction<DB>>

  /**
   * Similar to {@link ControlledTransactionBuilder.setAccessMode} but read-only.
   */
  setAccessMode(
    accessMode: 'read only',
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
}
