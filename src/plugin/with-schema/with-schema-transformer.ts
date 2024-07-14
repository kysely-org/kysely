import { AliasNode } from '../../operation-node/alias-node.js'
import { IdentifierNode } from '../../operation-node/identifier-node.js'
import { ListNode } from '../../operation-node/list-node.js'
import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js'
import { OperationNode } from '../../operation-node/operation-node.js'
import { ReferencesNode } from '../../operation-node/references-node.js'
import { SchemableIdentifierNode } from '../../operation-node/schemable-identifier-node.js'
import { TableNode } from '../../operation-node/table-node.js'
import { WithNode } from '../../operation-node/with-node.js'
import { RootOperationNode } from '../../query-compiler/query-compiler.js'
import { freeze } from '../../util/object-utils.js'

// This object exist only so that we get a type error when a new RootOperationNode
// is added. If you get a type error here, make sure to add the new root node and
// handle it correctly in the transformer.
//
// DO NOT REFACTOR THIS EVEN IF IT SEEMS USELESS TO YOU!
const ROOT_OPERATION_NODES: Record<RootOperationNode['kind'], true> = freeze({
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
  DropViewNode: true,
  InsertQueryNode: true,
  RawNode: true,
  SelectQueryNode: true,
  UpdateQueryNode: true,
  MergeQueryNode: true,
})

export class WithSchemaTransformer extends OperationNodeTransformer {
  readonly #schema: string
  readonly #schemableIds = new Set<string>()
  readonly #ctes = new Set<string>()

  constructor(schema: string) {
    super()
    this.#schema = schema
  }

  protected override transformNodeImpl<T extends OperationNode>(node: T): T {
    if (!this.#isRootOperationNode(node)) {
      return super.transformNodeImpl(node)
    }

    const ctes = this.#collectCTEs(node)

    for (const cte of ctes) {
      this.#ctes.add(cte)
    }

    const tables = this.#collectSchemableIds(node)

    for (const table of tables) {
      this.#schemableIds.add(table)
    }

    const transformed = super.transformNodeImpl(node)

    for (const table of tables) {
      this.#schemableIds.delete(table)
    }

    for (const cte of ctes) {
      this.#ctes.delete(cte)
    }

    return transformed
  }

  protected override transformSchemableIdentifier(
    node: SchemableIdentifierNode,
  ): SchemableIdentifierNode {
    const transformed = super.transformSchemableIdentifier(node)

    if (transformed.schema || !this.#schemableIds.has(node.identifier.name)) {
      return transformed
    }

    return {
      ...transformed,
      schema: IdentifierNode.create(this.#schema),
    }
  }

  protected transformReferences(node: ReferencesNode): ReferencesNode {
    const transformed = super.transformReferences(node)

    if (transformed.table.table.schema) {
      return transformed
    }

    return {
      ...transformed,
      table: TableNode.createWithSchema(
        this.#schema,
        transformed.table.table.identifier.name,
      ),
    }
  }

  #isRootOperationNode(node: OperationNode): node is RootOperationNode {
    return node.kind in ROOT_OPERATION_NODES
  }

  #collectSchemableIds(node: RootOperationNode): Set<string> {
    const schemableIds = new Set<string>()

    if ('name' in node && node.name && SchemableIdentifierNode.is(node.name)) {
      this.#collectSchemableId(node.name, schemableIds)
    }

    if ('from' in node && node.from) {
      for (const from of node.from.froms) {
        this.#collectSchemableIdsFromTableExpr(from, schemableIds)
      }
    }

    if ('into' in node && node.into) {
      this.#collectSchemableIdsFromTableExpr(node.into, schemableIds)
    }

    if ('table' in node && node.table) {
      this.#collectSchemableIdsFromTableExpr(node.table, schemableIds)
    }

    if ('joins' in node && node.joins) {
      for (const join of node.joins) {
        this.#collectSchemableIdsFromTableExpr(join.table, schemableIds)
      }
    }

    if ('using' in node && node.using) {
      this.#collectSchemableIdsFromTableExpr(node.using, schemableIds)
    }

    return schemableIds
  }

  #collectCTEs(node: RootOperationNode): Set<string> {
    const ctes = new Set<string>()

    if ('with' in node && node.with) {
      this.#collectCTEIds(node.with, ctes)
    }

    return ctes
  }

  #collectSchemableIdsFromTableExpr(
    node: OperationNode,
    schemableIds: Set<string>,
  ): void {
    if (TableNode.is(node)) {
      this.#collectSchemableId(node.table, schemableIds)
    } else if (AliasNode.is(node) && TableNode.is(node.node)) {
      this.#collectSchemableId(node.node.table, schemableIds)
    } else if (ListNode.is(node)) {
      for (const table of node.items) {
        this.#collectSchemableIdsFromTableExpr(table, schemableIds)
      }
    }
  }

  #collectSchemableId(
    node: SchemableIdentifierNode,
    schemableIds: Set<string>,
  ): void {
    const id = node.identifier.name

    if (!this.#schemableIds.has(id) && !this.#ctes.has(id)) {
      schemableIds.add(id)
    }
  }

  #collectCTEIds(node: WithNode, ctes: Set<string>): void {
    for (const expr of node.expressions) {
      const cteId = expr.name.table.table.identifier.name

      if (!this.#ctes.has(cteId)) {
        ctes.add(cteId)
      }
    }
  }
}
