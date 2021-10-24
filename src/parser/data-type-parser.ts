import {
  ColumnDataType,
  DataTypeNode,
} from '../operation-node/data-type-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
import { AnyRawBuilder } from '../query-builder/type-utils.js'

export type DataTypeExpression = ColumnDataType | AnyRawBuilder

export function parseDataTypeExpression(
  dataType: DataTypeExpression
): DataTypeNode | RawNode {
  return isOperationNodeSource(dataType)
    ? dataType.toOperationNode()
    : DataTypeNode.create(dataType)
}
