import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'

export interface RawNode extends OperationNode {
  readonly kind: 'RawNode'
  readonly sqlFragments: ReadonlyArray<string>
  readonly params: ReadonlyArray<OperationNode>
}

export function isRawNode(node: OperationNode): node is RawNode {
  return node.kind === 'RawNode'
}

export function createRawNode(
  sqlFragments: string[],
  params: ReadonlyArray<OperationNode>
): RawNode {
  return freeze({
    kind: 'RawNode',
    sqlFragments: freeze(sqlFragments),
    params: freeze(params),
  })
}
