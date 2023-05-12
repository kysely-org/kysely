import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { ColumnNode } from './column-node.js'
import { RawNode } from './raw-node.js'

export type AlterColumnNodeProps = Omit<AlterColumnNode, 'kind' | 'column'>

export interface AlterColumnNode extends OperationNode {
  readonly kind: 'AlterColumnNode'
  readonly column: ColumnNode
  readonly dataType?: OperationNode
  readonly dataTypeExpression?: RawNode
  readonly setDefault?: OperationNode
  readonly dropDefault?: true
  readonly setNotNull?: true
  readonly dropNotNull?: true
}

/**
 * @internal
 */
export const AlterColumnNode = freeze({
  is(node: OperationNode): node is AlterColumnNode {
    return node.kind === 'AlterColumnNode'
  },

  create<T extends keyof AlterColumnNode>(column: string, prop: T, value: Required<AlterColumnNode>[T]): AlterColumnNode {
    return freeze({
      kind: 'AlterColumnNode',
      column: ColumnNode.create(column),
      [prop]: value
    })
  },
})
