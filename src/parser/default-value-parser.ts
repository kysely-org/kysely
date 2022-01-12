import { RawNode } from '../operation-node/raw-node.js'
import { ValueNode } from '../operation-node/value-node.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'

export type DefaultValueExpression = unknown | RawBuilder

export function parseDefaultValueExpression(
  value: DefaultValueExpression
): ValueNode | RawNode {
  return value instanceof RawBuilder
    ? value.toOperationNode()
    : ValueNode.createImmediate(value)
}
