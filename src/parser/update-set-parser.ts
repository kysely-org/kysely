import { columnNode } from '../operation-node/column-node.js'
import {
  ColumnUpdateNode,
  columnUpdateNode,
} from '../operation-node/column-update-node.js'
import {
  MutationObject,
  parseMutationValueExpression,
} from './mutation-parser.js'

export function parseUpdateObject(
  row: MutationObject<any, any>
): ReadonlyArray<ColumnUpdateNode> {
  return Object.entries(row).map(([key, value]) => {
    return columnUpdateNode.create(
      columnNode.create(key),
      parseMutationValueExpression(value)
    )
  })
}
