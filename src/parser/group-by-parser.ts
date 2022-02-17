import { GroupByItemNode } from '../operation-node/group-by-item-node.js'
import {
  parseReferenceExpressionOrList,
  ReferenceExpressionOrList,
} from './reference-parser.js'

export function parseGroupBy(
  orderBy: ReferenceExpressionOrList<any, any>
): GroupByItemNode[] {
  return parseReferenceExpressionOrList(orderBy).map(GroupByItemNode.create)
}
