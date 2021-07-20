import { freeze } from '../util/object-utils'
import { OperationNode } from './operation-node'

export interface RawNode extends OperationNode {
  readonly kind: 'RawNode'
  readonly sqlFragments: ReadonlyArray<string>
  readonly params: ReadonlyArray<OperationNode>
}

export const rawNode = freeze({
  is(node: OperationNode): node is RawNode {
    return node.kind === 'RawNode'
  },

  create(
    sqlFragments: string[],
    params: ReadonlyArray<OperationNode>
  ): RawNode {
    return freeze({
      kind: 'RawNode',
      sqlFragments: freeze(sqlFragments),
      params: freeze(params),
    })
  },

  createWithSql(sql: string): RawNode {
    return rawNode.create([sql], [])
  },
})
