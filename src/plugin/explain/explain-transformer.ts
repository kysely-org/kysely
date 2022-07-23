import { DeleteQueryNode } from '../../operation-node/delete-query-node.js'
import { ExplainNode } from '../../operation-node/explain-node.js'
import { InsertQueryNode } from '../../operation-node/insert-query-node.js'
import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js'
import { SelectQueryNode } from '../../operation-node/select-query-node.js'
import { UpdateQueryNode } from '../../operation-node/update-query-node.js'
import { freeze } from '../../util/object-utils.js'
import { ExplainPluginOptions } from './explain-plugin.js'

export class ExplainTransformer extends OperationNodeTransformer {
  readonly #opt: ExplainPluginOptions

  constructor(opt: ExplainPluginOptions) {
    super()

    this.#opt = opt
  }

  protected transformSelectQuery(node: SelectQueryNode): SelectQueryNode {
    return this.#transformQuery(node)
  }

  protected transformInsertQuery(node: InsertQueryNode): InsertQueryNode {
    return this.#transformQuery(node)
  }

  protected transformUpdateQuery(node: UpdateQueryNode): UpdateQueryNode {
    return this.#transformQuery(node)
  }

  protected transformDeleteQuery(node: DeleteQueryNode): DeleteQueryNode {
    return this.#transformQuery(node)
  }

  #transformQuery<
    T extends
      | SelectQueryNode
      | InsertQueryNode
      | UpdateQueryNode
      | DeleteQueryNode
  >(node: T): T {
    if (this.#opt.enabled === false || node.explain) {
      return node
    }

    return freeze({
      ...node,
      explain: ExplainNode.create(this.#opt.format, this.#opt.raw),
    })
  }
}
