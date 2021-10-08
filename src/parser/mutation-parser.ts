import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { ValueNode } from '../operation-node/value-node.js'
import { AnyQueryBuilder, AnyRawBuilder } from '../query-builder/type-utils.js'
import { isPrimitive, PrimitiveValue } from '../util/object-utils.js'

export type MutationObject<DB, TB extends keyof DB> = {
  [C in keyof DB[TB]]?: MutationValueExpression<DB[TB][C]>
}

export type MutationValueExpression<T extends PrimitiveValue> =
  | T
  | AnyQueryBuilder
  | AnyRawBuilder

export function parseMutationValueExpression(
  value: MutationValueExpression<PrimitiveValue>
): ValueNode | RawNode | SelectQueryNode {
  if (isPrimitive(value)) {
    return ValueNode.create(value)
  } else if (isOperationNodeSource(value)) {
    const node = value.toOperationNode()

    if (RawNode.is(node) || SelectQueryNode.is(node)) {
      return node
    }
  }

  throw new Error(
    `unsupported value for mutation object ${JSON.stringify(value)}`
  )
}
