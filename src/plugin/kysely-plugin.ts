import { QueryResult } from '../driver/database-connection.js'
import { RootOperationNode } from '../query-compiler/query-compiler.js'
import { QueryId } from '../util/query-id.js'

export interface KyselyPlugin {
  /**
   * This is called for each query before it is executed. You can modify the query by
   * transforming its {@link OperationNode} tree provided in {@link PluginTransformQueryArgs.node | args.node}
   * and returning the transformed tree. You'd usually  want to use an {@link OperationNodeTransformer}
   * for this.
   *
   * If you need to pass some query-related data between this method and `transformResult` you
   * can use a `WeakMap` with {@link PluginTransformQueryArgs.queryId | args.queryId} as the key:
   *
   * ```ts
   * const plugin = {
   *   data: new WeakMap<QueryId, SomeData>(),
   *
   *   transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
   *     this.data.set(args.queryId, something)
   *     return args.node
   *   },
   *
   *   transformResult(args: PluginTransformResultArgs): QueryResult<AnyRow> {
   *     const data = this.data.get(args.queryId)
   *     return data.result
   *   }
   * }
   * ```
   */
  transformQuery(args: PluginTransformQueryArgs): RootOperationNode

  /**
   * This method is called for each query after it has been executed. The result
   * of the query can be accessed through {@link PluginTransformResultArgs.result | args.result}.
   * You can modify the result and return the modifier result.
   */
  transformResult(args: PluginTransformResultArgs): Promise<QueryResult<AnyRow>>
}

export interface PluginTransformQueryArgs {
  readonly queryId: QueryId
  readonly node: RootOperationNode
}

export type AnyRow = Record<string, unknown>

export interface PluginTransformResultArgs {
  readonly queryId: QueryId
  readonly result: QueryResult<AnyRow>
}
