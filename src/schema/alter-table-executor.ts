import { AlterTableNode } from '../operation-node/alter-table-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { Compilable } from '../util/compilable.js'
import { freeze } from '../util/object-utils.js'
import { QueryId } from '../util/query-id.js'

export class AlterTableExecutor implements OperationNodeSource, Compilable {
  readonly #props: AlterTableExecutorProps

  constructor(props: AlterTableExecutorProps) {
    this.#props = freeze(props)
  }

  toOperationNode(): AlterTableNode {
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

  async execute(): Promise<void> {
    await this.#props.executor.executeQuery(this.compile())
  }
}

export interface AlterTableExecutorProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: AlterTableNode
}
