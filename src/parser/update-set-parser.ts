import { columnNode } from '../operation-node/column-node'
import {
  ColumnUpdateNode,
  columnUpdateNode,
} from '../operation-node/column-update-node'
import { MutationObject, parseMutationValueExpression } from './mutation-parser'

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
