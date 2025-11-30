import type { Expression } from '../expression/expression.js'
import {
  type ColumnDataType,
  DataTypeNode,
  isColumnDataType,
} from '../operation-node/data-type-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import type { OperationNode } from '../operation-node/operation-node.js'

export type DataTypeExpression = ColumnDataType | Expression<any>

export function parseDataTypeExpression(
  dataType: DataTypeExpression,
): OperationNode {
  if (isOperationNodeSource(dataType)) {
    return dataType.toOperationNode()
  }

  if (isColumnDataType(dataType)) {
    return DataTypeNode.create(dataType)
  }

  throw new Error(`invalid column data type ${JSON.stringify(dataType)}`)
}
