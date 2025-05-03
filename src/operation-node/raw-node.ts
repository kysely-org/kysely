import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface RawNode extends OperationNode {
  readonly kind: 'RawNode'
  readonly sqlFragments: ReadonlyArray<string>
  readonly parameters: ReadonlyArray<OperationNode>
}

type RawNodeFactory = Readonly<{
  is(node: OperationNode): node is RawNode
  create(
    sqlFragments: ReadonlyArray<string>,
    parameters: ReadonlyArray<OperationNode>,
  ): Readonly<RawNode>
  createWithSql(sql: string): Readonly<RawNode>
  createWithChild(child: OperationNode): Readonly<RawNode>
  createWithChildren(children: ReadonlyArray<OperationNode>): Readonly<RawNode>
}>

/**
 * @internal
 */
export const RawNode: RawNodeFactory = freeze<RawNodeFactory>({
  is(node): node is RawNode {
    return node.kind === 'RawNode'
  },

  create(sqlFragments, parameters) {
    return freeze({
      kind: 'RawNode',
      sqlFragments: freeze(sqlFragments),
      parameters: freeze(parameters),
    })
  },

  createWithSql(sql) {
    return RawNode.create([sql], [])
  },

  createWithChild(child) {
    return RawNode.create(['', ''], [child])
  },

  createWithChildren(children) {
    return RawNode.create(new Array(children.length + 1).fill(''), children)
  },
})
