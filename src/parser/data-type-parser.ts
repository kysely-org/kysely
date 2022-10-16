import { Expression } from '../expression/expression.js'
import {
  ColumnDataType,
  DataTypeNode,
} from '../operation-node/data-type-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { OperationNode } from '../operation-node/operation-node.js'

export type DataTypeExpression = ColumnDataType | Expression<any>

export function parseDataTypeExpression(
  dataType: DataTypeExpression
): OperationNode {
  return isOperationNodeSource(dataType)
    ? dataType.toOperationNode()
    : DataTypeNode.create(dataType)
}
