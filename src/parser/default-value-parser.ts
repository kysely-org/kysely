import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
import { ValueNode } from '../operation-node/value-node.js'
import { AnyRawBuilder } from '../query-builder/type-utils.js'
import { PrimitiveValue } from '../util/object-utils.js'

export type DefaultValueExpression = PrimitiveValue | AnyRawBuilder

export function parseDefaultValueExpression(
  value: DefaultValueExpression
): ValueNode | RawNode {
  return isOperationNodeSource(value)
    ? value.toOperationNode()
    : ValueNode.createImmediate(value)
}
