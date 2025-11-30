import { freeze } from '../util/object-utils.js'
import type { CheckConstraintNode } from './check-constraint-node.js'
import { ColumnNode } from './column-node.js'
import type { DefaultValueNode } from './default-value-node.js'
import type { GeneratedNode } from './generated-node.js'
import type { OperationNode } from './operation-node.js'
import type { ReferencesNode } from './references-node.js'

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

type ColumnDefinitionNodeFactory = Readonly<{
  is(node: OperationNode): node is ColumnDefinitionNode
  create(
    column: string,
    dataType: OperationNode,
  ): Readonly<ColumnDefinitionNode>
  cloneWithFrontModifier(
    node: ColumnDefinitionNode,
    modifier: OperationNode,
  ): Readonly<ColumnDefinitionNode>
  cloneWithEndModifier(
    node: ColumnDefinitionNode,
    modifier: OperationNode,
  ): Readonly<ColumnDefinitionNode>
  cloneWith(
    node: ColumnDefinitionNode,
    props: ColumnDefinitionNodeProps,
  ): Readonly<ColumnDefinitionNode>
}>

/**
 * @internal
 */
export const ColumnDefinitionNode: ColumnDefinitionNodeFactory =
  freeze<ColumnDefinitionNodeFactory>({
    is(node): node is ColumnDefinitionNode {
      return node.kind === 'ColumnDefinitionNode'
    },

    create(column, dataType) {
      return freeze({
        kind: 'ColumnDefinitionNode',
        column: ColumnNode.create(column),
        dataType,
      })
    },

    cloneWithFrontModifier(node, modifier) {
      return freeze({
        ...node,
        frontModifiers: node.frontModifiers
          ? freeze([...node.frontModifiers, modifier])
          : [modifier],
      })
    },

    cloneWithEndModifier(node, modifier) {
      return freeze({
        ...node,
        endModifiers: node.endModifiers
          ? freeze([...node.endModifiers, modifier])
          : [modifier],
      })
    },

    cloneWith(node, props) {
      return freeze({
        ...node,
        ...props,
      })
    },
  })
