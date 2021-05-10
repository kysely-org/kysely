import {
  cloneJoinNodeWithOn,
  createJoinNode,
  JoinNode,
  JoinType,
} from '../operation-node/join-node'
import { AnyColumn, AnyColumnWithTable } from '../query-builder/type-utils'
import {
  TableExpression,
  parseTableExpression,
  ExtractAliasFromTableExpression,
  TableExpressionDatabaseType,
} from './table-parser'
import { parseFilterArgs } from './filter-parser'
import { JoinBuilder } from '../query-builder/join-builder'

export type JoinReferenceArg<DB, TB extends keyof DB, F> =
  | AnyColumn<
      TableExpressionDatabaseType<DB, F>,
      TB | ExtractAliasFromTableExpression<DB, F>
    >
  | AnyColumnWithTable<
      TableExpressionDatabaseType<DB, F>,
      TB | ExtractAliasFromTableExpression<DB, F>
    >

export type JoinCallbackArg<DB, TB extends keyof DB, F> = (
  join: JoinBuilder<
    TableExpressionDatabaseType<DB, F>,
    TB | ExtractAliasFromTableExpression<DB, F>
  >
) => JoinBuilder<any, any>

export function parseJoinArgs(joinType: JoinType, args: any[]): JoinNode {
  if (args.length === 2) {
    return parseCallbackJoin(joinType, args[0], args[1])
  } else if (args.length === 3) {
    return parseSingleOnJoin(joinType, args[0], args[1], args[2])
  } else {
    throw new Error('not implemented')
  }
}

function parseCallbackJoin(
  joinType: JoinType,
  from: TableExpression<any, any, any>,
  callback: JoinCallbackArg<any, any, any>
): JoinNode {
  const tableNode = parseTableExpression(from)

  const joinBuilder = callback(
    new JoinBuilder(createJoinNode(joinType, tableNode))
  )

  return joinBuilder.toOperationNode()
}

function parseSingleOnJoin(
  joinType: JoinType,
  from: TableExpression<any, any, any>,
  lhsColumn: string,
  rhsColumn: string
): JoinNode {
  const tableNode = parseTableExpression(from)

  return cloneJoinNodeWithOn(
    createJoinNode(joinType, tableNode),
    'and',
    parseFilterArgs([lhsColumn, '=', rhsColumn])
  )
}
