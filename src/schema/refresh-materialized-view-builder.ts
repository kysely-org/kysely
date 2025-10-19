import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import {
  ExecuteQueryOptions,
  QueryExecutor,
} from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { RefreshMaterializedViewNode } from '../operation-node/refresh-materialized-view-node.js'

export class RefreshMaterializedViewBuilder
  implements OperationNodeSource, Compilable
{
  readonly #props: RefreshMaterializedViewBuilderProps

  constructor(props: RefreshMaterializedViewBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Adds the "concurrently" modifier.
   *
   * Use this to refresh the view without locking out concurrent selects on the materialized view.
   *
   * WARNING!
   * This cannot be used with the "with no data" modifier.
   */
  concurrently(): RefreshMaterializedViewBuilder {
    return new RefreshMaterializedViewBuilder({
      ...this.#props,
      node: RefreshMaterializedViewNode.cloneWith(this.#props.node, {
        concurrently: true,
        withNoData: false,
      }),
    })
  }

  /**
   * Adds the "with data" modifier.
   *
   * If specified (or defaults) the backing query is executed to provide the new data, and the materialized view is left in a scannable state
   */
  withData(): RefreshMaterializedViewBuilder {
    return new RefreshMaterializedViewBuilder({
      ...this.#props,
      node: RefreshMaterializedViewNode.cloneWith(this.#props.node, {
        withNoData: false,
      }),
    })
  }

  /**
   * Adds the "with no data" modifier.
   *
   * If specified, no new data is generated and the materialized view is left in an unscannable state.
   *
   * WARNING!
   * This cannot be used with the "concurrently" modifier.
   */
  withNoData(): RefreshMaterializedViewBuilder {
    return new RefreshMaterializedViewBuilder({
      ...this.#props,
      node: RefreshMaterializedViewNode.cloneWith(this.#props.node, {
        withNoData: true,
        concurrently: false,
      }),
    })
  }

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  toOperationNode(): RefreshMaterializedViewNode {
    return this.#props.executor.transformQuery(
      this.#props.node,
      this.#props.queryId,
    )
  }

  compile(): CompiledQuery {
    return this.#props.executor.compileQuery(
      this.toOperationNode(),
      this.#props.queryId,
    )
  }

  async execute(options?: ExecuteQueryOptions): Promise<void> {
    await this.#props.executor.executeQuery(this.compile(), options)
  }
}

export interface RefreshMaterializedViewBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: RefreshMaterializedViewNode
}
