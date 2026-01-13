import type { Expression } from '../expression/expression.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import type { OperationNode } from '../operation-node/operation-node.js'
import { ValueNode } from '../operation-node/value-node.js'

export type DefaultValueExpression = unknown | Expression<unknown>

export function parseDefaultValueExpression(
  value: DefaultValueExpression,
): OperationNode {
  return isOperationNodeSource(value)
    ? value.toOperationNode()
    : ValueNode.createImmediate(value)
}
