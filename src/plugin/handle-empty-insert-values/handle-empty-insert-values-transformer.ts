import { BinaryOperationNode } from '../../operation-node/binary-operation-node.js'
import { InsertQueryNode } from '../../operation-node/insert-query-node.js'
import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js'
import { OperatorNode } from '../../operation-node/operator-node.js'
import { SelectionNode } from '../../operation-node/selection-node.js'
import { SelectQueryNode } from '../../operation-node/select-query-node.js'
import type { TableNode } from '../../operation-node/table-node.js'
import { ValuesNode } from '../../operation-node/values-node.js'
import { ValueNode } from '../../operation-node/value-node.js'
import { WhereNode } from '../../operation-node/where-node.js'
import { freeze } from '../../util/object-utils.js'
import type { QueryId } from '../../util/query-id.js'

type EmptyInsertValuesNode = InsertQueryNode & {
  into: TableNode
  columns: Readonly<[]>
  values: ValuesNode
}

let _eq: OperatorNode
let _contradiction: BinaryOperationNode
let _where: WhereNode
let _selectAll: ReadonlyArray<ReturnType<typeof SelectionNode.createSelectAll>>

function replaceWithSelectFrom(node: EmptyInsertValuesNode): InsertQueryNode {
  const eq = (_eq ||= OperatorNode.create('='))
  const contradiction = (_contradiction ||= BinaryOperationNode.create(
    ValueNode.createImmediate(1),
    eq,
    ValueNode.createImmediate(0),
  ))
  const where = (_where ||= WhereNode.create(contradiction))
  const selectAll = (_selectAll ||= freeze([SelectionNode.createSelectAll()]))

  const selectNode = freeze({
    ...SelectQueryNode.cloneWithSelections(
      SelectQueryNode.createFrom([node.into]),
      selectAll,
    ),
    where,
  })

  return InsertQueryNode.cloneWith(node, {
    columns: undefined,
    values: selectNode,
  })
}

export class HandleEmptyInsertValuesTransformer extends OperationNodeTransformer {
  protected override transformInsertQuery(
    node: InsertQueryNode,
    queryId?: QueryId,
  ): InsertQueryNode {
    if (this.#isEmptyInsertValuesNode(node)) {
      return replaceWithSelectFrom(node)
    }

    return super.transformInsertQuery(node, queryId)
  }

  #isEmptyInsertValuesNode(
    node: InsertQueryNode,
  ): node is EmptyInsertValuesNode {
    return node.columns?.length === 0 && node.values !== undefined && ValuesNode.is(node.values)
  }
}
