import { createColumnNode } from '../operation-node/column-node'
import {
  ColumnUpdateNode,
  createColumnUpdateNode,
} from '../operation-node/column-update-node'
import { MutationObject, parseMutationValueExpression } from './mutation-parser'

export function parseUpdateSetArgs(
  row: MutationObject<any, any>
): ReadonlyArray<ColumnUpdateNode> {
  return Object.entries(row).map(([key, value]) => {
    return createColumnUpdateNode(
      createColumnNode(key),
      parseMutationValueExpression(value)
    )
  })
}
