import { JoinNode, JoinType } from '../operation-node/join-node.js'
import { AnyColumn, AnyColumnWithTable } from '../util/type-utils.js'
import {
  TableExpression,
  parseTableExpression,
  From,
  FromTables,
} from './table-parser.js'
import { parseReferentialFilter } from './binary-operation-parser.js'
import { JoinBuilder } from '../query-builder/join-builder.js'
import { createJoinBuilder } from './parse-utils.js'

export type JoinReferenceExpression<DB, TB extends keyof DB, TE> =
  | AnyJoinColumn<DB, TB, TE>
  | AnyJoinColumnWithTable<DB, TB, TE>

export type JoinCallbackExpression<DB, TB extends keyof DB, TE> = (
  join: JoinBuilder<From<DB, TE>, FromTables<DB, TB, TE>>
) => JoinBuilder<any, any>

type AnyJoinColumn<DB, TB extends keyof DB, TE> = AnyColumn<
  From<DB, TE>,
  FromTables<DB, TB, TE>
>

type AnyJoinColumnWithTable<DB, TB extends keyof DB, TE> = AnyColumnWithTable<
  From<DB, TE>,
  FromTables<DB, TB, TE>
>

export function parseJoin(joinType: JoinType, args: any[]): JoinNode {
  if (args.length === 3) {
    return parseSingleOnJoin(joinType, args[0], args[1], args[2])
  } else if (args.length === 2) {
    return parseCallbackJoin(joinType, args[0], args[1])
  } else {
    throw new Error('not implemented')
  }
}

function parseCallbackJoin(
  joinType: JoinType,
  from: TableExpression<any, any>,
  callback: JoinCallbackExpression<any, any, any>
): JoinNode {
  const joinBuilder = callback(createJoinBuilder(joinType, from))
  return joinBuilder.toOperationNode()
}

function parseSingleOnJoin(
  joinType: JoinType,
  from: TableExpression<any, any>,
  lhsColumn: string,
  rhsColumn: string
): JoinNode {
  return JoinNode.createWithOn(
    joinType,
    parseTableExpression(from),
    parseReferentialFilter(lhsColumn, '=', rhsColumn)
  )
}
