import { CreateTableNode } from '../operation-node/create-table-node'
import { DropTableNode } from '../operation-node/drop-table-node'
import { QueryNode } from '../operation-node/query-node-utils'
import { CompiledQuery } from './compiled-query'

export type CompileEntryPointNode = QueryNode | CreateTableNode | DropTableNode

export interface QueryCompiler {
  compile(node: CompileEntryPointNode): CompiledQuery
}
