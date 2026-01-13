import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'

export type JSONPathLegType = 'Member' | 'ArrayLocation'

export interface JSONPathLegNode extends OperationNode {
  readonly kind: 'JSONPathLegNode'
  readonly type: JSONPathLegType
  readonly value: string | number
}

type JSONPathLegNodeFactory = Readonly<{
  is(node: OperationNode): node is JSONPathLegNode
  create(
    type: JSONPathLegType,
    value: string | number,
  ): Readonly<JSONPathLegNode>
}>

/**
 * @internal
 */
export const JSONPathLegNode: JSONPathLegNodeFactory =
  freeze<JSONPathLegNodeFactory>({
    is(node): node is JSONPathLegNode {
      return node.kind === 'JSONPathLegNode'
    },

    create(type, value) {
      return freeze({
        kind: 'JSONPathLegNode',
        type,
        value,
      })
    },
  })
