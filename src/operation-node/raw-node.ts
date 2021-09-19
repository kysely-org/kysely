import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface RawNode extends OperationNode {
  readonly kind: 'RawNode'
  readonly sqlFragments: ReadonlyArray<string>
  readonly params: ReadonlyArray<OperationNode>
}

/**
 * @internal
 */
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
