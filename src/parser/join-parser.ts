import { JoinNode, JoinType } from '../operation-node/join-node.js'
import { AnyColumn, AnyColumnWithTable } from '../query-builder/type-utils.js'
import {
  TableExpression,
  parseTableExpression,
  ExtractAliasFromTableExpression,
  TableExpressionDatabaseType,
} from './table-parser.js'
import { parseReferenceFilter } from './filter-parser.js'
import { JoinBuilder } from '../query-builder/join-builder.js'
import { ParseContext } from './parse-context.js'

export type JoinReferenceExpression<DB, TB extends keyof DB, F> =
  | AnyColumn<
      TableExpressionDatabaseType<DB, F>,
      TB | ExtractAliasFromTableExpression<DB, F>
    >
  | AnyColumnWithTable<
      TableExpressionDatabaseType<DB, F>,
      TB | ExtractAliasFromTableExpression<DB, F>
    >

export type JoinCallbackExpression<DB, TB extends keyof DB, F> = (
  join: JoinBuilder<
    TableExpressionDatabaseType<DB, F>,
    TB | ExtractAliasFromTableExpression<DB, F>
  >
) => JoinBuilder<any, any>

export function parseJoinArgs(
  ctx: ParseContext,
  joinType: JoinType,
  args: any[]
): JoinNode {
  if (args.length === 2) {
    return parseCallbackJoin(ctx, joinType, args[0], args[1])
  } else if (args.length === 3) {
    return parseSingleOnJoin(ctx, joinType, args[0], args[1], args[2])
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
  const tableNode = parseTableExpression(ctx, from)

  return JoinNode.cloneWithOn(
    JoinNode.create(joinType, tableNode),
    'And',
    parseReferenceFilter(ctx, lhsColumn, '=', rhsColumn)
  )
}
