import { RawNode } from '../operation-node/raw-node.js'
import { freeze } from '../util/object-utils.js'
import { createQueryId, QueryId } from '../util/query-id.js'
import { RootOperationNode } from './query-compiler.js'

export interface CompiledQuery<O = unknown> {
  readonly query: RootOperationNode
  readonly queryId: QueryId
  readonly sql: string
  readonly parameters: ReadonlyArray<unknown>
}

type CompiledQueryFactory = Readonly<{
  raw(sql: string, parameters?: unknown[]): Readonly<CompiledQuery>
}>

export const CompiledQuery: CompiledQueryFactory = freeze<CompiledQueryFactory>(
  {
    raw(sql, parameters = []) {
      return freeze({
        sql,
        query: RawNode.createWithSql(sql),
        parameters: freeze(parameters),
        queryId: createQueryId(),
      })
    },
  },
)
