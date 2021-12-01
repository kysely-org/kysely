import { JoinNode, JoinType } from '../operation-node/join-node.js'
import { AnyColumn, AnyColumnWithTable } from '../util/type-utils.js'
import {
  TableExpression,
  parseTableExpression,
  ExtractAliasFromTableExpression,
  TableExpressionDatabase,
} from './table-parser.js'
import { parseReferenceFilter } from './filter-parser.js'
import { JoinBuilder } from '../query-builder/join-builder.js'
import { ParseContext } from './parse-context.js'

export type JoinReferenceExpression<DB, TB extends keyof DB, TE> =
  | AnyJoinColumn<DB, TB, TE>
  | AnyJoinColumnWithTable<DB, TB, TE>

export type JoinCallbackExpression<DB, TB extends keyof DB, TE> = (
  join: JoinBuilder<
    TableExpressionDatabase<DB, TE>,
    TB | ExtractAliasFromTableExpression<DB, TE>
  >
) => JoinBuilder<any, any>

type AnyJoinColumn<DB, TB extends keyof DB, TE> = AnyColumn<
  TableExpressionDatabase<DB, TE>,
  TB | ExtractAliasFromTableExpression<DB, TE>
>

type AnyJoinColumnWithTable<DB, TB extends keyof DB, TE> = AnyColumnWithTable<
  TableExpressionDatabase<DB, TE>,
  TB | ExtractAliasFromTableExpression<DB, TE>
>

export function parseJoin(
  ctx: ParseContext,
  joinType: JoinType,
  args: any[]
): JoinNode {
  if (args.length === 3) {
    return parseSingleOnJoin(ctx, joinType, args[0], args[1], args[2])
  } else if (args.length === 2) {
    return parseCallbackJoin(ctx, joinType, args[0], args[1])
  } else {
    throw new Error('not implemented')
  }
}

function parseCallbackJoin(
  ctx: ParseContext,
  joinType: JoinType,
  from: TableExpression<any, any>,
  callback: JoinCallbackExpression<any, any, any>
): JoinNode {
  const joinBuilder = callback(ctx.createJoinBuilder(joinType, from))
  return joinBuilder.toOperationNode()
}

function parseSingleOnJoin(
  ctx: ParseContext,
  joinType: JoinType,
  from: TableExpression<any, any>,
  lhsColumn: string,
  rhsColumn: string
): JoinNode {
  return JoinNode.createWithOn(
    joinType,
    parseTableExpression(ctx, from),
    parseReferenceFilter(ctx, lhsColumn, '=', rhsColumn)
  )
}
