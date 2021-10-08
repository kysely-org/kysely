import { ColumnNode } from '../operation-node/column-node.js'
import { ColumnUpdateNode } from '../operation-node/column-update-node.js'
import {
  MutationObject,
  parseMutationValueExpression,
} from './mutation-parser.js'

export function parseUpdateObject(
  row: MutationObject<any, any>
): ReadonlyArray<ColumnUpdateNode> {
  return Object.entries(row).map(([key, value]) => {
    return ColumnUpdateNode.create(
      ColumnNode.create(key),
      parseMutationValueExpression(value)
    )
  })
}
