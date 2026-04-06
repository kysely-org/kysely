import type { AlterTableNode } from './alter-table-node.js'
import type { CreateIndexNode } from './create-index-node.js'
import type { CreateSchemaNode } from './create-schema-node.js'
import type { CreateTableNode } from './create-table-node.js'
import type { CreateTypeNode } from './create-type-node.js'
import type { CreateViewNode } from './create-view-node.js'
import type { DropIndexNode } from './drop-index-node.js'
import type { DropSchemaNode } from './drop-schema-node.js'
import type { DropTableNode } from './drop-table-node.js'
import type { DropTypeNode } from './drop-type-node.js'
import type { DropViewNode } from './drop-view-node.js'
import { isOperationNode } from './operation-node.js'
import type { QueryNode } from './query-node.js'
import type { RawNode } from './raw-node.js'
import type { RefreshMaterializedViewNode } from './refresh-materialized-view-node.js'

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

const ROOT_OPERATION_NODE_KINDS: Readonly<
  Record<RootOperationNode['kind'], true>
> = {
  AlterTableNode: true,
  CreateIndexNode: true,
  CreateSchemaNode: true,
  CreateTableNode: true,
  CreateTypeNode: true,
  CreateViewNode: true,
  DeleteQueryNode: true,
  DropIndexNode: true,
  DropSchemaNode: true,
  DropTableNode: true,
  DropTypeNode: true,
  RefreshMaterializedViewNode: true,
  DropViewNode: true,
  InsertQueryNode: true,
  RawNode: true,
  SelectQueryNode: true,
  UpdateQueryNode: true,
  MergeQueryNode: true,
}

export function isRootOperationNode(
  thing: unknown,
): thing is RootOperationNode {
  return (
    isOperationNode(thing) &&
    ROOT_OPERATION_NODE_KINDS[thing.kind as never] === true
  )
}
