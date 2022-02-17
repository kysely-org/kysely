import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface RawNode extends OperationNode {
  readonly kind: 'RawNode'
  readonly sqlFragments: ReadonlyArray<string>
  readonly parameters: ReadonlyArray<OperationNode>
}

/**
 * @internal
 */
export const RawNode = freeze({
  is(node: OperationNode): node is RawNode {
    return node.kind === 'RawNode'
  },

  create(
    sqlFragments: ReadonlyArray<string>,
    parameters: ReadonlyArray<OperationNode>
  ): RawNode {
    return freeze({
      kind: 'RawNode',
      sqlFragments: freeze(sqlFragments),
      parameters: freeze(parameters),
    })
  },

  createWithSql(sql: string): RawNode {
    return RawNode.create([sql], [])
  },

  createWithChild(child: OperationNode): RawNode {
    return RawNode.create(['', ''], [child])
  },

  createWithChildren(children: ReadonlyArray<OperationNode>): RawNode {
    return RawNode.create(new Array(children.length + 1).fill(''), children)
  },
})
