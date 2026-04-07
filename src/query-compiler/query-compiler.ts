import type { RootOperationNode } from '../operation-node/root-operation-node.js'
import type { QueryId } from '../util/query-id.js'
import type { CompiledQuery } from './compiled-query.js'

/**
 * a `QueryCompiler` compiles a query expressed as a tree of `OperationNodes` into SQL.
 */
export interface QueryCompiler {
  compileQuery(node: RootOperationNode, queryId: QueryId): CompiledQuery
}
