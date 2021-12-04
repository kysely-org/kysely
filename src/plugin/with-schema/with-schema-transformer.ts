import { AliasNode } from '../../operation-node/alias-node.js'
import { AlterTableNode } from '../../operation-node/alter-table-node.js'
import { CreateIndexNode } from '../../operation-node/create-index-node.js'
import { CreateTableNode } from '../../operation-node/create-table-node.js'
import { CreateViewNode } from '../../operation-node/create-view-node.js'
import { DeleteQueryNode } from '../../operation-node/delete-query-node.js'
import { DropIndexNode } from '../../operation-node/drop-index-node.js'
import { DropTableNode } from '../../operation-node/drop-table-node.js'
import { DropViewNode } from '../../operation-node/drop-view-node.js'
import { InsertQueryNode } from '../../operation-node/insert-query-node.js'
import { JoinNode } from '../../operation-node/join-node.js'
import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js'
import { TableExpressionNode } from '../../operation-node/operation-node-utils.js'
import { SelectQueryNode } from '../../operation-node/select-query-node.js'
import { TableNode } from '../../operation-node/table-node.js'
import { UpdateQueryNode } from '../../operation-node/update-query-node.js'
import { RootOperationNode } from '../../query-compiler/query-compiler.js'

export class WithSchemaTransformer extends OperationNodeTransformer {
  readonly #schema: string
  readonly #tables = new Set<string>()

  constructor(schema: string) {
    super()
    this.#schema = schema
  }

  protected override transformSelectQuery(
    node: SelectQueryNode
  ): SelectQueryNode {
    return this.#transformRoot(node, (node) => super.transformSelectQuery(node))
  }

  protected override transformInsertQuery(
    node: InsertQueryNode
  ): InsertQueryNode {
    return this.#transformRoot(node, (node) => super.transformInsertQuery(node))
  }

  protected override transformUpdateQuery(
    node: UpdateQueryNode
  ): UpdateQueryNode {
    return this.#transformRoot(node, (node) => super.transformUpdateQuery(node))
  }

  protected override transformDeleteQuery(
    node: DeleteQueryNode
  ): DeleteQueryNode {
    return this.#transformRoot(node, (node) => super.transformDeleteQuery(node))
  }

  protected override transformCreateTable(
    node: CreateTableNode
  ): CreateTableNode {
    return this.#transformRoot(node, (node) => super.transformCreateTable(node))
  }

  protected override transformDropTable(node: DropTableNode): DropTableNode {
    return this.#transformRoot(node, (node) => super.transformDropTable(node))
  }

  protected override transformCreateIndex(
    node: CreateIndexNode
  ): CreateIndexNode {
    return this.#transformRoot(node, (node) => super.transformCreateIndex(node))
  }

  protected override transformDropIndex(node: DropIndexNode): DropIndexNode {
    return this.#transformRoot(node, (node) => super.transformDropIndex(node))
  }

  protected override transformCreateView(node: CreateViewNode): CreateViewNode {
    return this.#transformRoot(node, (node) => super.transformCreateView(node))
  }

  protected override transformDropView(node: DropViewNode): DropViewNode {
    return this.#transformRoot(node, (node) => super.transformDropView(node))
  }

  protected override transformAlterTable(node: AlterTableNode): AlterTableNode {
    return this.#transformRoot(node, (node) => super.transformAlterTable(node))
  }

  protected override transformTable(node: TableNode): TableNode {
    const transformed = super.transformTable(node)

    if (transformed.schema || !this.#tables.has(node.table.identifier)) {
      return transformed
    }

    return {
      ...transformed,
      schema: {
        kind: 'IdentifierNode',
        identifier: this.#schema,
      },
    }
  }

  #transformRoot<T extends RootOperationNode>(
    node: T,
    transform: (node: T) => T
  ): T {
    const tables = this.#collectTables(node)

    for (const table of tables) {
      this.#tables.add(table)
    }

    const transformed = transform(node)

    for (const table of tables) {
      this.#tables.delete(table)
    }

    return transformed
  }

  #collectTables(node: RootOperationNode): Set<string> {
    const tables = new Set<string>()

    if ('from' in node && node.from) {
      this.#collectTablesFromTableExpressionNodes(node.from.froms, tables)
    }

    if ('into' in node && node.into) {
      this.#collectTablesFromTableExpressionNode(node.into, tables)
    }

    if ('table' in node && node.table) {
      this.#collectTablesFromTableExpressionNode(node.table, tables)
    }

    if ('joins' in node && node.joins) {
      this.#collectTablesFromJoins(node.joins, tables)
    }

    return tables
  }

  #collectTablesFromTableExpressionNodes(
    nodes: ReadonlyArray<TableExpressionNode>,
    tables: Set<string>
  ): void {
    for (const node of nodes) {
      this.#collectTablesFromTableExpressionNode(node, tables)
    }
  }

  #collectTablesFromJoins(
    nodes: ReadonlyArray<JoinNode>,
    tables: Set<string>
  ): void {
    for (const node of nodes) {
      this.#collectTablesFromTableExpressionNode(node.table, tables)
    }
  }

  #collectTablesFromTableExpressionNode(
    node: TableExpressionNode,
    tables: Set<string>
  ): void {
    const table = TableNode.is(node)
      ? node
      : AliasNode.is(node) && TableNode.is(node.node)
      ? node.node
      : null

    if (table && !this.#tables.has(table.table.identifier)) {
      tables.add(table.table.identifier)
    }
  }
}
