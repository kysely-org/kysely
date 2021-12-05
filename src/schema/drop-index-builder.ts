import { DropIndexNode } from '../operation-node/drop-index-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { parseTable } from '../parser/table-parser.js'
import { freeze } from '../util/object-utils.js'

export class DropIndexBuilder implements OperationNodeSource, Compilable {
  readonly #props: DropIndexBuilderProps

  constructor(props: DropIndexBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Specifies the table the index was created for. This is not needed
   * in all dialects.
   */
  on(table: string): DropIndexBuilder {
    return new DropIndexBuilder({
      ...this.#props,
      dropIndexNode: DropIndexNode.cloneWith(this.#props.dropIndexNode, {
        table: parseTable(table),
      }),
    })
  }

  ifExists(): DropIndexBuilder {
    return new DropIndexBuilder({
      ...this.#props,
      dropIndexNode: DropIndexNode.cloneWith(this.#props.dropIndexNode, {
        ifExists: true,
      }),
    })
  }

  toOperationNode(): DropIndexNode {
    return this.#props.executor.transformQuery(
      this.#props.dropIndexNode,
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
  DropIndexBuilder,
  "don't await DropIndexBuilder instances directly. To execute the query you need to call `execute`"
)

export interface DropIndexBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly dropIndexNode: DropIndexNode
}
