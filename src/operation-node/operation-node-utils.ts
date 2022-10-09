import { AggregateFunctionNode } from './aggregate-function-node.js'
import { AliasNode } from './alias-node.js'
import { AndNode } from './and-node.js'
import { ColumnNode } from './column-node.js'
import { FilterNode } from './filter-node.js'
import { OrNode } from './or-node.js'
import { ParensNode } from './parens-node.js'
import { PrimitiveValueListNode } from './primitive-value-list-node.js'
import { RawNode } from './raw-node.js'
import { ReferenceNode } from './reference-node.js'
import { SelectQueryNode } from './select-query-node.js'
import { TableNode } from './table-node.js'
import { ValueListNode } from './value-list-node.js'
import { ValueNode } from './value-node.js'

export type SimpleReferenceExpressionNode = ColumnNode | ReferenceNode

export type ReferenceExpressionNode =
  | SimpleReferenceExpressionNode
  | SelectQueryNode
  | RawNode
  | AggregateFunctionNode

export type ValueExpressionNode =
  | ValueNode
  | ValueListNode
  | PrimitiveValueListNode
  | ReferenceExpressionNode

export type TableExpressionNode = TableNode | AliasNode
export type FilterExpressionNode =
  | FilterNode
  | AndNode
  | OrNode
  | ParensNode
  | RawNode
