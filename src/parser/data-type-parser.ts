import type { Expression } from '../expression/expression.js'
import {
  DataTypeNode,
  isColumnDataType,
} from '../operation-node/data-type-node.js'
import { SchemableIdentifierNode } from '../operation-node/schemable-identifier-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import type { OperationNode } from '../operation-node/operation-node.js'

export type DataTypeExpression = string | Expression<any>

export function parseDataTypeExpression(
  dataType: DataTypeExpression,
): OperationNode {
  if (isOperationNodeSource(dataType)) {
    return dataType.toOperationNode()
  }

  if (isColumnDataType(dataType)) {
    return DataTypeNode.create(dataType)
  }

  return SchemableIdentifierNode.create(dataType)
}
