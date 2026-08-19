import { JoinNode, type JoinType } from '../operation-node/join-node.js'
import type { JoinBuilder } from '../query-builder/join-builder.js'
import type {
  AnyColumn,
  AnyColumnWithTable,
  DrainOuterGeneric,
} from '../util/type-utils.js'
import type { KyselyTypeError } from '../util/type-error.js'
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

/**
 * Validates a join reference in check position instead of in `K`'s constraint.
 *
 * As a constraint, `JoinReferenceExpression` is reached through the constraint
 * of the deferred conditionals behind it, which fans
 * `ExtractAliasFromTableExpression` out over every member of
 * `TableExpression<DB, TB>` - once per join, per distinct `TB`. Behind a
 * non-distributive conditional the same type is evaluated once per call, with
 * `TE` and `K` already fixed, so the inferred result is identical.
 */
export type ValidateJoinReference<DB, TB extends keyof DB, TE, K> = [
  K,
] extends [JoinReferenceExpression<DB, TB, TE>]
  ? unknown
  : KyselyTypeError<`This is not a valid join reference for the joined tables: ${K & string}`>

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
