import {
  cloneJoinNodeWithOn,
  createJoinNode,
  JoinNode,
  JoinType,
} from '../../operation-node/join-node'
import { AnyColumn, AnyColumnWithTable, AnyQueryBuilder } from '../type-utils'
import {
  TableArg,
  parseFromArg,
  FromArgDatabaseType,
  ExtractAliasesFromFromArg,
} from './from-parser'
import { parseFilterArgs } from './filter-parser'
import { JoinBuilder } from '../join-builder'

export type JoinReferenceArg<DB, TB extends keyof DB, F> =
  | AnyColumn<FromArgDatabaseType<DB, F>, TB | ExtractAliasesFromFromArg<DB, F>>
  | AnyColumnWithTable<
      FromArgDatabaseType<DB, F>,
      TB | ExtractAliasesFromFromArg<DB, F>
    >

export type JoinCallbackArg<DB, TB extends keyof DB, F> = (
  join: JoinBuilder<
    FromArgDatabaseType<DB, F>,
    TB | ExtractAliasesFromFromArg<DB, F>
  >
) => JoinBuilder<any, any>

export function parseJoinArgs(
  query: AnyQueryBuilder,
  joinType: JoinType,
  args: any[]
): JoinNode {
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
  from: TableArg<any, any, any>,
  callback: JoinCallbackArg<any, any, any>
): JoinNode {
  const tableNode = parseFromArg(from)

  const joinBuilder = callback(
    new JoinBuilder(createJoinNode(joinType, tableNode))
  )

  return joinBuilder.toOperationNode()
}

function parseSingleOnJoin(
  joinType: JoinType,
  from: TableArg<any, any, any>,
  lhsColumn: string,
  rhsColumn: string
): JoinNode {
  const tableNode = parseFromArg(from)

  return cloneJoinNodeWithOn(
    createJoinNode(joinType, tableNode),
    'and',
    parseFilterArgs([lhsColumn, '=', rhsColumn])
  )
}
