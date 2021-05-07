import { ColumnNode } from './column-node'
import { PrimitiveValueListNode } from './primitive-value-list-node'
import { RawNode } from './raw-node'
import { ReferenceNode } from './reference-node'
import { SelectQueryNode } from './select-query-node'
import { ValueListNode } from './value-list-node'
import { ValueNode } from './value-node'

export type ReferenceExpressionNode =
  | ColumnNode
  | ReferenceNode
  | SelectQueryNode
  | RawNode

export type ValueExpressionNode =
  | ValueNode
  | ValueListNode
  | PrimitiveValueListNode
  | ReferenceExpressionNode
