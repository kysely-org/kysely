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

export const CompiledQuery = freeze({
  raw(sql: string, parameters: unknown[] = []): CompiledQuery {
    return freeze({
      sql,
      query: RawNode.createWithSql(sql),
      parameters: freeze(parameters),
      queryId: createQueryId(),
    })
  },
})
