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
} from './from-method'
import { parseFilterArgs } from './filter-method'

export type JoinReferenceArg<DB, TB extends keyof DB, F> =
  | AnyColumn<FromArgDatabaseType<DB, F>, TB | ExtractAliasesFromFromArg<DB, F>>
  | AnyColumnWithTable<
      FromArgDatabaseType<DB, F>,
      TB | ExtractAliasesFromFromArg<DB, F>
    >

export function parseJoinArgs(
  query: AnyQueryBuilder,
  joinType: JoinType,
  args: any[]
): JoinNode {
  if (args.length === 3) {
    return parseSingleOnJoin(query, joinType, args[0], args[1], args[2])
  } else {
    throw new Error('not implemented')
  }
}

function parseSingleOnJoin(
  query: AnyQueryBuilder,
  joinType: JoinType,
  from: TableArg<any, any, any>,
  lhsColumn: string,
  rhsColumn: string
): JoinNode {
  const tableNode = parseFromArg(query, from)

  return cloneJoinNodeWithOn(
    createJoinNode(joinType, tableNode),
    'and',
    parseFilterArgs(query, [lhsColumn, '=', rhsColumn])
  )
}
