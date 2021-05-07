import { ColumnNode } from './column-node'
import { PrimitiveValueListNode } from './primitive-value-list-node'
import { QueryNode } from './query-node'
import { RawNode } from './raw-node'
import { ReferenceNode } from './reference-node'
import { ValueListNode } from './value-list-node'
import { ValueNode } from './value-node'

export type ReferenceExpressionNode =
  | ColumnNode
  | ReferenceNode
  | QueryNode
  | RawNode

export type ValueExpressionNode =
  | ValueNode
  | ValueListNode
  | PrimitiveValueListNode
  | ReferenceExpressionNode
