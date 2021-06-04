import { isOperationNodeSource } from '../operation-node/operation-node-source'
import { isRawNode, RawNode } from '../operation-node/raw-node'
import {
  isSelectQueryNode,
  SelectQueryNode,
} from '../operation-node/select-query-node'
import { createValueNode, ValueNode } from '../operation-node/value-node'
import { AnyQueryBuilder } from '../query-builder/type-utils'
import { RawBuilder } from '../raw-builder/raw-builder'
import { isPrimitive, PrimitiveValue } from '../util/object-utils'

export type MutationObject<DB, TB extends keyof DB> = {
  [C in keyof DB[TB]]?: MutationValueExpression<DB[TB][C]>
}

export type MutationValueExpression<T extends PrimitiveValue> =
  | T
  | AnyQueryBuilder
  | RawBuilder<any>

export function parseMutationValueExpression(
  value: MutationValueExpression<PrimitiveValue>
): ValueNode | RawNode | SelectQueryNode {
  if (isPrimitive(value)) {
    return createValueNode(value)
  } else if (isOperationNodeSource(value)) {
    const node = value.toOperationNode()

    if (isRawNode(node) || isSelectQueryNode(node)) {
      return node
    }
  }

  throw new Error(
    `unsupported value for mutation object ${JSON.stringify(value)}`
  )
}
