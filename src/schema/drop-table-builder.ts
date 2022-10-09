import { DropTableNode } from '../operation-node/drop-table-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'

export class DropTableBuilder implements OperationNodeSource, Compilable {
  readonly #props: DropTableBuilderProps

  constructor(props: DropTableBuilderProps) {
    this.#props = freeze(props)
  }

  ifExists(): DropTableBuilder {
    return new DropTableBuilder({
      ...this.#props,
      dropTableNode: DropTableNode.cloneWith(this.#props.dropTableNode, {
        ifExists: true,
      }),
    })
  }

  cascade(): DropTableBuilder {
    return new DropTableBuilder({
      ...this.#props,
      dropTableNode: DropTableNode.cloneWith(this.#props.dropTableNode, {
        cascade: true,
      }),
    })
  }

  toOperationNode(): DropTableNode {
    return this.#props.executor.transformQuery(
      this.#props.dropTableNode,
      this.#props.queryId
    )
  }

  compile(): CompiledQuery<any> {
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
  DropTableBuilder,
  "don't await DropTableBuilder instances directly. To execute the query you need to call `execute`"
)

export interface DropTableBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly dropTableNode: DropTableNode
}
