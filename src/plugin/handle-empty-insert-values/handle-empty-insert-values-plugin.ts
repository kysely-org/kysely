import type { QueryResult } from '../../driver/database-connection.js'
import type {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
} from '../kysely-plugin.js'
import type { UnknownRow } from '../../util/type-utils.js'
import { HandleEmptyInsertValuesTransformer } from './handle-empty-insert-values-transformer.js'
import type { RootOperationNode } from '../../operation-node/root-operation-node.js'

/**
 * A plugin that handles empty `insert into t values ()` queries.
 *
 * An insert with no columns and no values is invalid SQL syntax in many databases
 * and results in a runtime error. This can happen when dynamically building insert
 * queries and passing an empty object or an array of objects that all have no
 * defined columns.
 *
 * The empty insert is replaced with `insert into t select * from t where 1 = 0`,
 * which inserts no rows.
 *
 * ### Examples
 *
 * ```ts
 * import Sqlite from 'better-sqlite3'
 * import { HandleEmptyInsertValuesPlugin, Kysely, SqliteDialect } from 'kysely'
 * import type { Database } from 'type-editor' // imaginary module
 *
 * const db = new Kysely<Database>({
 *   dialect: new SqliteDialect({
 *     database: new Sqlite(':memory:'),
 *   }),
 *   plugins: [
 *     new HandleEmptyInsertValuesPlugin()
 *   ],
 * })
 *
 * const result = await db
 *   .insertInto('person')
 *   .values({})
 *   .execute()
 * ```
 *
 * The generated SQL (SQLite):
 *
 * ```sql
 * insert into "person" select * from "person" where 1 = 0
 * ```
 */
export class HandleEmptyInsertValuesPlugin implements KyselyPlugin {
  readonly #transformer = new HandleEmptyInsertValuesTransformer()

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.#transformer.transformNode(args.node, args.queryId)
  }

  async transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    return args.result
  }
}
