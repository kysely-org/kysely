import { AlterTableNode } from '../operation-node/alter-table-node.js'
import { CreateIndexNode } from '../operation-node/create-index-node.js'
import { CreateSchemaNode } from '../operation-node/create-schema-node.js'
import { CreateTableNode } from '../operation-node/create-table-node.js'
import { DropIndexNode } from '../operation-node/drop-index-node.js'
import { DropSchemaNode } from '../operation-node/drop-schema-node.js'
import { DropTableNode } from '../operation-node/drop-table-node.js'
import { QueryNode } from '../operation-node/query-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import { CompiledQuery } from './compiled-query.js'

export type CompileEntryPointNode =
  | QueryNode
  | CreateTableNode
  | CreateIndexNode
  | AlterTableNode
  | DropTableNode
  | DropIndexNode
  | CreateSchemaNode
  | DropSchemaNode
  | RawNode

export interface QueryCompiler {
  compileQuery(node: CompileEntryPointNode): CompiledQuery
}
