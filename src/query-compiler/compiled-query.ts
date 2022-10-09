import { RawNode } from '../operation-node/raw-node.js'
import { freeze } from '../util/object-utils.js'
import { RootOperationNode } from './query-compiler.js'

export interface CompiledQuery<Result> {
  readonly query: RootOperationNode
  readonly sql: string
  readonly parameters: ReadonlyArray<unknown>
  /** Used for storing Result type information */
  __result?: Result
}

export const CompiledQuery = freeze({
  raw(sql: string): CompiledQuery<any> {
    return freeze({
      sql,
      query: RawNode.createWithSql(sql),
      parameters: freeze([]),
    })
  },
})
