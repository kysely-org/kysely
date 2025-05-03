import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { PrimitiveValueListNode } from './primitive-value-list-node.js'
import { ValueListNode } from './value-list-node.js'

export type ValuesItemNode = ValueListNode | PrimitiveValueListNode

export interface ValuesNode extends OperationNode {
  readonly kind: 'ValuesNode'
  readonly values: ReadonlyArray<ValuesItemNode>
}

type ValuesNodeFactory = Readonly<{
  is(node: OperationNode): node is ValuesNode
  create(values: ReadonlyArray<ValuesItemNode>): Readonly<ValuesNode>
}>

/**
 * @internal
 */
export const ValuesNode: ValuesNodeFactory = freeze<ValuesNodeFactory>({
  is(node): node is ValuesNode {
    return node.kind === 'ValuesNode'
  },

  create(values) {
    return freeze({
      kind: 'ValuesNode',
      values: freeze(values),
    })
  },
})
