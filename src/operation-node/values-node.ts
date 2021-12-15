import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { PrimitiveValueListNode } from './primitive-value-list-node.js'
import { ValueListNode } from './value-list-node.js'

export type ValuesItemNode = ValueListNode | PrimitiveValueListNode

export interface ValuesNode extends OperationNode {
  readonly kind: 'ValuesNode'
  readonly values: ReadonlyArray<ValuesItemNode>
}

/**
 * @internal
 */
export const ValuesNode = freeze({
  is(node: OperationNode): node is ValuesNode {
    return node.kind === 'ValuesNode'
  },

  create(values: ReadonlyArray<ValuesItemNode>): ValuesNode {
    return freeze({
      kind: 'ValuesNode',
      values: freeze(values),
    })
  },
})
