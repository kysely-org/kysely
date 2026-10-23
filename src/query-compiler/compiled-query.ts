import { RawNode } from '../operation-node/raw-node.js'
import {
  isRootOperationNode,
  type RootOperationNode,
} from '../operation-node/root-operation-node.js'
import { freeze, isObject, isString } from '../util/object-utils.js'
import { createQueryId, type QueryId } from '../util/query-id.js'

/**
 * A SQL query compiled for a specific dialect, together with its parameters
 * and operation node tree.
 *
 * The output type `O` describes a result row. It doesn't validate or convert
 * values returned by the database driver.
 *
 * See {@link Kysely.executeQuery} for execution and {@link CompiledQuery.raw}
 * for constructing a query from an existing SQL string.
 */
export interface CompiledQuery<O = unknown> {
  /**
   * The operation node tree used to compile the query, after query plugins have run.
   */
  readonly query: RootOperationNode

  /**
   * Identifies the query when passing data between plugin hooks.
   */
  readonly queryId: QueryId

  /**
   * The SQL string, with placeholders in the target dialect's syntax.
   */
  readonly sql: string

  /**
   * The parameter values in the order expected by the placeholders in {@link sql}.
   */
  readonly parameters: ReadonlyArray<unknown>
}

export function isCompiledQuery<R>(thing: unknown): thing is CompiledQuery<R> {
  return (
    isObject(thing) &&
    Object.hasOwn(thing, 'parameters') &&
    Object.hasOwn(thing, 'query') &&
    Object.hasOwn(thing, 'queryId') &&
    Object.hasOwn(thing, 'sql') &&
    isString(thing.sql) &&
    Array.isArray(thing.parameters) &&
    isRootOperationNode(thing.query)
  )
}

type CompiledQueryFactory = Readonly<{
  /**
   * Creates a compiled query from an existing SQL string and parameter values.
   *
   * The SQL is used as provided. This method doesn't escape SQL, generate
   * placeholders, or check that the parameters match the placeholders.
   * Use the target dialect's placeholder syntax, such as `$1` for PostgreSQL
   * or `?` for MySQL and SQLite. For SQL built from interpolated values,
   * prefer the {@link sql} template tag.
   *
   * ### Examples
   *
   * Execute a parameterized PostgreSQL query:
   *
   * ```ts
   * import { CompiledQuery } from 'kysely'
   *
   * const result = await db.executeQuery<{ first_name: string }>(
   *   CompiledQuery.raw(
   *     'select "first_name" from "person" where "id" = $1',
   *     [123],
   *   ),
   * )
   *
   * const firstName: string | undefined = result.rows[0]?.first_name
   * ```
   */
  raw(sql: string, parameters?: unknown[]): Readonly<CompiledQuery>
}>

export const CompiledQuery: CompiledQueryFactory = freeze<CompiledQueryFactory>(
  {
    raw(sql, parameters = []) {
      return freeze({
        sql,
        query: RawNode.createWithSql(sql),
        parameters: freeze(parameters),
        queryId: createQueryId(),
      })
    },
  },
)
