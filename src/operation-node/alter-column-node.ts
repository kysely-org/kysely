import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { DataTypeNode } from './data-type-node.js'
import { ValueNode } from './value-node.js'
import { RawNode } from './raw-node.js'

export type AlterColumnNodeParams = Omit<
  Partial<AlterColumnNode>,
  'kind' | 'column'
>

export interface AlterColumnNode extends OperationNode {
  readonly kind: 'AlterColumnNode'
  readonly column: ColumnNode
  readonly dataType?: DataTypeNode
  readonly dataTypeExpression?: RawNode
  readonly setDefault?: ValueNode | RawNode
  readonly dropDefault?: true
  readonly setNotNull?: true
  readonly dropNotNull?: true
}

/**
 * @internal
 */
export const AlterColumnNode = freeze({
  is(node: OperationNode): node is AlterColumnNode {
    return node.kind === 'AlterColumnNode'
  },

  create(column: string): AlterColumnNode {
    return freeze({
      kind: 'AlterColumnNode',
      column: ColumnNode.create(column),
    })
  },

  cloneWith(
    node: AlterColumnNode,
    params: AlterColumnNodeParams
  ): AlterColumnNode {
    return freeze({
      ...node,
      ...params,
    })
  },
})
