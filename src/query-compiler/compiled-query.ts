import { RawNode } from '../operation-node/raw-node.js'
import { freeze } from '../util/object-utils.js'
import { RootOperationNode } from './query-compiler.js'

export interface CompiledQuery {
  readonly query: RootOperationNode
  readonly sql: string
  readonly parameters: ReadonlyArray<unknown>
}

export const CompiledQuery = freeze({
  raw(sql: string): CompiledQuery {
    return freeze({
      sql,
      query: RawNode.createWithSql(sql),
      parameters: freeze([]),
    })
  },
})
