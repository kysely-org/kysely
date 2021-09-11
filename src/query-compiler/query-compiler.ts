import { CreateIndexNode } from '../operation-node/create-index-node'
import { CreateSchemaNode } from '../operation-node/create-schema-node'
import { CreateTableNode } from '../operation-node/create-table-node'
import { DropIndexNode } from '../operation-node/drop-index-node'
import { DropSchemaNode } from '../operation-node/drop-schema-node'
import { DropTableNode } from '../operation-node/drop-table-node'
import { QueryNode } from '../operation-node/query-node'
import { RawNode } from '../operation-node/raw-node'
import { CompiledQuery } from './compiled-query'

export type CompileEntryPointNode =
  | QueryNode
  | CreateTableNode
  | CreateIndexNode
  | DropTableNode
  | DropIndexNode
  | CreateSchemaNode
  | DropSchemaNode
  | RawNode

export interface QueryCompiler {
  compileQuery(node: CompileEntryPointNode): CompiledQuery
}
