import { Expression } from '../expression/expression.js'
import {
  CastDataType,
  isCastDataType,
} from '../operation-node/cast-data-type-node.js'
import { DataTypeNode } from '../operation-node/data-type-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { OperationNode } from '../operation-node/operation-node.js'

export type CastDataTypeExpression = CastDataType | Expression<any>

export function parseCastDataTypeExpression(
  dataType: CastDataTypeExpression,
): OperationNode {
  if (isOperationNodeSource(dataType)) {
    return dataType.toOperationNode()
  }

  if (isCastDataType(dataType)) {
    return DataTypeNode.create(dataType as any)
  }

  throw new Error(`invalid cast data type ${JSON.stringify(dataType)}`)
}
