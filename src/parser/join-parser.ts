import { JoinNode, type JoinType } from '../operation-node/join-node.js'
import type { JoinBuilder } from '../query-builder/join-builder.js'
import type {
  AnyColumn,
  AnyColumnWithTable,
  DrainOuterGeneric,
} from '../util/type-utils.js'
import { parseReferentialBinaryOperation } from './binary-operation-parser.js'
import { createJoinBuilder } from './parse-utils.js'
import {
  type From,
  type FromTables,
  type TableExpression,
  parseTableExpression,
} from './table-parser.js'

export type JoinReferenceExpression<
  DB,
  TB extends keyof DB,
  TE,
> = DrainOuterGeneric<
  AnyJoinColumn<DB, TB, TE> | AnyJoinColumnWithTable<DB, TB, TE>
>

export type JoinCallbackExpression<DB, TB extends keyof DB, TE> = (
  join: JoinBuilder<From<DB, TE>, FromTables<DB, TB, TE>>,
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
  } else if (args.length === 1) {
    return parseOnlessJoin(joinType, args[0])
  } else {
    throw new Error('not implemented')
  }
}

function parseCallbackJoin(
  joinType: JoinType,
  from: TableExpression<any, any>,
  callback: JoinCallbackExpression<any, any, any>,
): JoinNode {
  return callback(createJoinBuilder(joinType, from)).toOperationNode()
}

function parseSingleOnJoin(
  joinType: JoinType,
  from: TableExpression<any, any>,
  lhsColumn: string,
  rhsColumn: string,
): JoinNode {
  return JoinNode.createWithOn(
    joinType,
    parseTableExpression(from),
    parseReferentialBinaryOperation(lhsColumn, '=', rhsColumn),
  )
}

function parseOnlessJoin(
  joinType: JoinType,
  from: TableExpression<any, any>,
): JoinNode {
  return JoinNode.create(joinType, parseTableExpression(from))
}
