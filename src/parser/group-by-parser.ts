import { GroupByItemNode } from '../operation-node/group-by-item-node.js'
import { ParseContext } from './parse-context.js'
import {
  parseReferenceExpressionOrList,
  ReferenceExpressionOrList,
} from './reference-parser.js'

export function parseGroupBy(
  ctx: ParseContext,
  orderBy: ReferenceExpressionOrList<any, any>
): GroupByItemNode[] {
  return parseReferenceExpressionOrList(ctx, orderBy).map(
    GroupByItemNode.create
  )
}
