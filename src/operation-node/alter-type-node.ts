import { OperationNode } from './operation-node.js'
import { freeze } from '../util/object-utils.js'
import { SchemableIdentifierNode } from './schemable-identifier-node.js'
import { IdentifierNode } from './identifier-node.js'
import { AddValueNode } from './add-value-node.js'
import { ValueNode } from './value-node.js'

export type AlterTypeNodeProps = Omit<AlterTypeNode, 'kind' | 'name'>

export interface AlterTypeNode extends OperationNode {
  readonly kind: 'AlterTypeNode'
  readonly name: SchemableIdentifierNode
  renameTo?: IdentifierNode
  ownerTo?: IdentifierNode
  setSchema?: IdentifierNode
  addValue?: AddValueNode
  renameValueOldName?: ValueNode
  renameValueNewName?: ValueNode
}

/**
 * @internal
 */
export const AlterTypeNode = freeze({
  is(node: OperationNode): node is AlterTypeNode {
    return node.kind === 'AlterTypeNode'
  },
  create(name: SchemableIdentifierNode): AlterTypeNode {
    return freeze({
      kind: 'AlterTypeNode',
      name,
    })
  },
  cloneWithAlterTypeProps(
    node: AlterTypeNode,
    props: AlterTypeNodeProps,
  ): AlterTypeNode {
    return freeze({
      ...node,
      ...props,
    })
  },
})
