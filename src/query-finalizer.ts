import type { QueryResult } from './driver/database-connection.js'
import type { OperationNodeSource } from './operation-node/operation-node-source.js'
import type { OperationNode } from './operation-node/operation-node.js'
import type { RootOperationNode } from './operation-node/root-operation-node.js'
import type { CompiledQuery } from './query-compiler/compiled-query.js'
import type { QueryExecutor } from './query-executor/query-executor.js'
import type { AbortableOperationOptions } from './util/abort.js'
import type { Compilable } from './util/compilable.js'
import { freeze } from './util/object-utils.js'
import type { QueryId } from './util/query-id.js'

export class QueryFinalizer<N extends RootOperationNode, O = unknown>
  implements OperationNodeSource, Compilable
{
  readonly #props: QueryFinalizerProps<N>

  constructor(props: QueryFinalizerProps<N>) {
    this.#props = freeze(props)
  }

  toOperationNode(): N {
    return this.#props.executor.transformQuery(
      this.#props.node,
      this.#props.queryId,
    )
  }

  /**
   * Compiles the query.
   */
  compile(): CompiledQuery<O> {
    return this.#props.executor.compileQuery(
      this.toOperationNode(),
      this.#props.queryId,
    )
  }

  /**
   * Executes the query.
   */
  async execute(options?: AbortableOperationOptions): Promise<QueryResult<O>> {
    return await this.#props.executor.executeQuery<O>(this.compile(), options)
  }
}

export interface QueryFinalizerProps<N extends OperationNode> {
  readonly executor: QueryExecutor
  readonly node: N
  readonly queryId: QueryId
}
