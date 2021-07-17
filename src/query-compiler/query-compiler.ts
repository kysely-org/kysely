import { CreateTableNode } from '../operation-node/create-table-node'
import { DropTableNode } from '../operation-node/drop-table-node'
import { QueryNode } from '../operation-node/query-node-utils'
import { RawNode } from '../operation-node/raw-node'
import { CompiledQuery } from './compiled-query'

export type CompileEntryPointNode =
  | QueryNode
  | CreateTableNode
  | DropTableNode
  | RawNode

export interface QueryCompiler {
  compileQuery(node: CompileEntryPointNode): CompiledQuery
}
