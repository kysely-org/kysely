import { freeze } from '../util/object-utils.js'
import { CheckConstraintNode } from './check-constraint-node.js'
import { ColumnNode } from './column-node.js'
import { DefaultValueNode } from './default-value-node.js'
import { GeneratedNode } from './generated-node.js'
import { OperationNode } from './operation-node.js'
import { ReferencesNode } from './references-node.js'

export type ColumnDefinitionNodeProps = Omit<
  Partial<ColumnDefinitionNode>,
  'kind' | 'dataType'
>

export interface ColumnDefinitionNode extends OperationNode {
  readonly kind: 'ColumnDefinitionNode'
  readonly column: ColumnNode
  readonly dataType: OperationNode
  readonly references?: ReferencesNode
  readonly primaryKey?: boolean
  readonly autoIncrement?: boolean
  readonly unique?: boolean
  readonly notNull?: boolean
  readonly defaultTo?: DefaultValueNode
  readonly check?: CheckConstraintNode
  readonly generated?: GeneratedNode
  readonly unsigned?: boolean
  readonly frontModifiers?: ReadonlyArray<OperationNode>
  readonly endModifiers?: ReadonlyArray<OperationNode>
  readonly nullsNotDistinct?: boolean
  readonly identity?: boolean
  readonly ifNotExists?: boolean
}

/**
 * @internal
 */
export const ColumnDefinitionNode = freeze({
  is(node: OperationNode): node is ColumnDefinitionNode {
    return node.kind === 'ColumnDefinitionNode'
  },

  create(column: string, dataType: OperationNode): ColumnDefinitionNode {
    return freeze({
      kind: 'ColumnDefinitionNode',
      column: ColumnNode.create(column),
      dataType,
    })
  },

  cloneWithFrontModifier(
    node: ColumnDefinitionNode,
    modifier: OperationNode,
  ): ColumnDefinitionNode {
    return freeze({
      ...node,
      frontModifiers: node.frontModifiers
        ? freeze([...node.frontModifiers, modifier])
        : [modifier],
    })
  },

  cloneWithEndModifier(
    node: ColumnDefinitionNode,
    modifier: OperationNode,
  ): ColumnDefinitionNode {
    return freeze({
      ...node,
      endModifiers: node.endModifiers
        ? freeze([...node.endModifiers, modifier])
        : [modifier],
    })
  },

  cloneWith(
    node: ColumnDefinitionNode,
    props: ColumnDefinitionNodeProps,
  ): ColumnDefinitionNode {
    return freeze({
      ...node,
      ...props,
    })
  },
})
