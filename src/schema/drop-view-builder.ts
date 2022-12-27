import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { DropViewNode } from '../operation-node/drop-view-node.js'

export class DropViewBuilder implements OperationNodeSource, Compilable {
  readonly #props: DropViewBuilderProps

  constructor(props: DropViewBuilderProps) {
    this.#props = freeze(props)
  }

  materialized(): DropViewBuilder {
    return new DropViewBuilder({
      ...this.#props,
      node: DropViewNode.cloneWith(this.#props.node, {
        materialized: true,
      }),
    })
  }

  ifExists(): DropViewBuilder {
    return new DropViewBuilder({
      ...this.#props,
      node: DropViewNode.cloneWith(this.#props.node, {
        ifExists: true,
      }),
    })
  }

  cascade(): DropViewBuilder {
    return new DropViewBuilder({
      ...this.#props,
      node: DropViewNode.cloneWith(this.#props.node, {
        cascade: true,
      }),
    })
  }

  toOperationNode(): DropViewNode {
    return this.#props.executor.transformQuery(
      this.#props.node,
      this.#props.queryId
    )
  }

  compile(): CompiledQuery {
    return this.#props.executor.compileQuery(
      this.toOperationNode(),
      this.#props.queryId
    )
  }

  async execute(): Promise<void> {
    await this.#props.executor.executeQuery(this.compile(), this.#props.queryId)
  }
}

preventAwait(
  DropViewBuilder,
  "don't await DropViewBuilder instances directly. To execute the query you need to call `execute`"
)

export interface DropViewBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: DropViewNode
}
