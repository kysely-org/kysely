import { UnionNode } from '../operation-node/union-node.js'
import { SelectQueryBuilder } from '../query-builder/select-query-builder.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'

export type UnionExpression<DB, O> =
  | SelectQueryBuilder<DB, any, O>
  | RawBuilder<O>

export function parseUnion(union: UnionExpression<any, any>, all: boolean) {
  return UnionNode.create(union.toOperationNode(), all)
}
