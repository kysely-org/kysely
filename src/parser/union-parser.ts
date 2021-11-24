import { QueryNode } from '../operation-node/query-node.js'
import { UnionNode } from '../operation-node/union-node.js'
import { QueryBuilder } from '../query-builder/query-builder.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'

export type UnionExpression<DB, O> = QueryBuilder<DB, any, O> | RawBuilder<O>

export function parseUnion(union: UnionExpression<any, any>, all: boolean) {
  const node = union.toOperationNode()

  if (QueryNode.isMutating(node)) {
    throw new Error(
      "can't combine insert, update or delete queries using union"
    )
  }

  return UnionNode.create(node, all)
}
