export type OperationNodeKind =
  | 'IdentifierNode'
  | 'QueryNode'
  | 'RawNode'
  | 'SelectNode'
  | 'SelectionNode'
  | 'ReferenceNode'
  | 'ColumnNode'
  | 'TableNode'
  | 'AliasNode'
  | 'FromNode'
  | 'FromItemNode'
  | 'SelectAllNode'
  | 'FilterNode'
  | 'AndNode'
  | 'OrNode'
  | 'ParensNode'
  | 'ValueNode'
  | 'ValueListNode'
  | 'PrimitiveValueListNode'
  | 'JoinNode'
  | 'OperatorNode'
  | 'WhereNode'

export interface OperationNode {
  readonly kind: OperationNodeKind
}
