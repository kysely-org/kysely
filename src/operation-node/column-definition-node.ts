import { freeze } from '../util/object-utils.js'
import { CheckConstraintNode } from './check-constraint-node.js'
import { ColumnNode } from './column-node.js'
import { DataTypeNode } from './data-type-node.js'
import { DefaultValueNode } from './default-to-node.js'
import { GeneratedAlwaysAsNode } from './generated-always-as-node.js'
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
  readonly primaryKey: boolean
  readonly autoIncrement: boolean
  readonly unique: boolean
  readonly nullable: boolean
  readonly defaultTo?: DefaultValueNode
  readonly check?: CheckConstraintNode
  readonly generatedAlwaysAs?: GeneratedAlwaysAsNode
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
      primaryKey: false,
      autoIncrement: false,
      unique: false,
      nullable: true,
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
