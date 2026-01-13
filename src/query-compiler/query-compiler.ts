import type { AlterTableNode } from '../operation-node/alter-table-node.js'
import type { CreateIndexNode } from '../operation-node/create-index-node.js'
import type { CreateSchemaNode } from '../operation-node/create-schema-node.js'
import type { CreateTableNode } from '../operation-node/create-table-node.js'
import type { CreateTypeNode } from '../operation-node/create-type-node.js'
import type { CreateViewNode } from '../operation-node/create-view-node.js'
import type { DropIndexNode } from '../operation-node/drop-index-node.js'
import type { DropSchemaNode } from '../operation-node/drop-schema-node.js'
import type { DropTableNode } from '../operation-node/drop-table-node.js'
import type { DropTypeNode } from '../operation-node/drop-type-node.js'
import type { DropViewNode } from '../operation-node/drop-view-node.js'
import type { MergeQueryNode } from '../operation-node/merge-query-node.js'
import type { QueryNode } from '../operation-node/query-node.js'
import type { RawNode } from '../operation-node/raw-node.js'
import type { RefreshMaterializedViewNode } from '../operation-node/refresh-materialized-view-node.js'
import type { QueryId } from '../util/query-id.js'
import type { CompiledQuery } from './compiled-query.js'

export type RootOperationNode =
  | QueryNode
  | CreateTableNode
  | CreateIndexNode
  | CreateSchemaNode
  | CreateViewNode
  | RefreshMaterializedViewNode
  | DropTableNode
  | DropIndexNode
  | DropSchemaNode
  | DropViewNode
  | AlterTableNode
  | RawNode
  | CreateTypeNode
  | DropTypeNode
  | MergeQueryNode

/**
 * a `QueryCompiler` compiles a query expressed as a tree of `OperationNodes` into SQL.
 */
export interface QueryCompiler {
  compileQuery(node: RootOperationNode, queryId: QueryId): CompiledQuery
}
