import { AlterTableNode } from '../operation-node/alter-table-node.js'
import { CreateIndexNode } from '../operation-node/create-index-node.js'
import { CreateSchemaNode } from '../operation-node/create-schema-node.js'
import { CreateTableNode } from '../operation-node/create-table-node.js'
import { CreateTriggerNode } from '../operation-node/create-trigger-node.js'
import { CreateTypeNode } from '../operation-node/create-type-node.js'
import { CreateViewNode } from '../operation-node/create-view-node.js'
import { DropIndexNode } from '../operation-node/drop-index-node.js'
import { DropSchemaNode } from '../operation-node/drop-schema-node.js'
import { DropTableNode } from '../operation-node/drop-table-node.js'
import { DropTriggerNode } from '../operation-node/drop-trigger-node.js'
import { DropTypeNode } from '../operation-node/drop-type-node.js'
import { DropViewNode } from '../operation-node/drop-view-node.js'
import { QueryNode } from '../operation-node/query-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import { CompiledQuery } from './compiled-query.js'

export type RootOperationNode =
  | QueryNode
  | CreateTableNode
  | CreateIndexNode
  | CreateSchemaNode
  | CreateViewNode
  | DropTableNode
  | DropIndexNode
  | DropSchemaNode
  | DropViewNode
  | AlterTableNode
  | RawNode
  | CreateTypeNode
  | DropTypeNode
  | CreateTriggerNode
  | DropTriggerNode

/**
 * a `QueryCompiler` compiles a query expressed as a tree of `OperationNodes` into SQL.
 */
export interface QueryCompiler {
  compileQuery(node: RootOperationNode): CompiledQuery
}
