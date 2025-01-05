import { DeleteQueryNode } from '../../operation-node/delete-query-node.js'
import { JoinNode } from '../../operation-node/join-node.js'
import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js'
import { SelectQueryNode } from '../../operation-node/select-query-node.js'
import { UpdateQueryNode } from '../../operation-node/update-query-node.js'
import { compare, freeze } from '../../util/object-utils.js'

export class DeduplicateJoinsTransformer extends OperationNodeTransformer {
  protected transformSelectQuery(node: SelectQueryNode): SelectQueryNode {
    return this.#transformQuery(super.transformSelectQuery(node))
  }

  protected transformUpdateQuery(node: UpdateQueryNode): UpdateQueryNode {
    return this.#transformQuery(super.transformUpdateQuery(node))
  }

  protected transformDeleteQuery(node: DeleteQueryNode): DeleteQueryNode {
    return this.#transformQuery(super.transformDeleteQuery(node))
  }

  #transformQuery<
    T extends SelectQueryNode | UpdateQueryNode | DeleteQueryNode,
  >(node: T): T {
    if (!node.joins || node.joins.length === 0) {
      return node
    }

    return freeze({
      ...node,
      joins: this.#deduplicateJoins(node.joins),
    })
  }

  #deduplicateJoins(joins: ReadonlyArray<JoinNode>): ReadonlyArray<JoinNode> {
    const out: JoinNode[] = []

    for (let i = 0; i < joins.length; ++i) {
      let foundDuplicate = false

      for (let j = 0; j < out.length; ++j) {
        if (compare(joins[i], out[j])) {
          foundDuplicate = true
          break
        }
      }

      if (!foundDuplicate) {
        out.push(joins[i])
      }
    }

    return freeze(out)
  }
}
