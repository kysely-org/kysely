import { freeze } from '../util/object-utils.js'
import { CheckConstraintNode } from './check-constraint-node.js'
import { ColumnNode } from './column-node.js'
import { DataTypeNode } from './data-type-node.js'
import { OperationNode } from './operation-node.js'
import { RawNode } from './raw-node.js'
import { ReferencesNode } from './references-node.js'
import { ValueNode } from './value-node.js'

export type ColumnDefinitionNodeProps = Omit<
  Partial<ColumnDefinitionNode>,
  'kind'
>
export type ColumnDataTypeNode = DataTypeNode | RawNode

export interface ColumnDefinitionNode extends OperationNode {
  readonly kind: 'ColumnDefinitionNode'
  readonly column: ColumnNode
  readonly dataType: ColumnDataTypeNode
  readonly references?: ReferencesNode
  readonly isPrimaryKey: boolean
  readonly isAutoIncrementing: boolean
  readonly isUnique: boolean
  readonly isNullable: boolean
  readonly defaultTo?: ValueNode | RawNode
  readonly check?: CheckConstraintNode
}

/**
 * @internal
 */
export const ColumnDefinitionNode = freeze({
  is(node: OperationNode): node is ColumnDefinitionNode {
    return node.kind === 'ColumnDefinitionNode'
  },

  create(column: string, dataType: ColumnDataTypeNode): ColumnDefinitionNode {
    return freeze({
      kind: 'ColumnDefinitionNode',
      column: ColumnNode.create(column),
      dataType,
      isPrimaryKey: false,
      isAutoIncrementing: false,
      isUnique: false,
      isNullable: true,
    })
  },

  cloneWith(
    node: ColumnDefinitionNode,
    props: ColumnDefinitionNodeProps
  ): ColumnDefinitionNode {
    return freeze({
      ...node,
      ...props,
    })
  },
})
