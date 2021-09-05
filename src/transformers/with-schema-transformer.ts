import { aliasNode } from '../operation-node/alias-node'
import { CreateIndexNode } from '../operation-node/create-index-node'
import { CreateTableNode } from '../operation-node/create-table-node'
import { DeleteQueryNode } from '../operation-node/delete-query-node'
import { DropIndexNode } from '../operation-node/drop-index-node'
import { DropTableNode } from '../operation-node/drop-table-node'
import { InsertQueryNode } from '../operation-node/insert-query-node'
import { JoinNode } from '../operation-node/join-node'
import { OperationNodeTransformer } from '../operation-node/operation-node-transformer'
import { TableExpressionNode } from '../operation-node/operation-node-utils'
import { SelectQueryNode } from '../operation-node/select-query-node'
import { tableNode, TableNode } from '../operation-node/table-node'
import { UpdateQueryNode } from '../operation-node/update-query-node'
import { CompileEntryPointNode } from '../query-compiler/query-compiler'

export class WithSchemaTransformer extends OperationNodeTransformer {
  #schema: string
  #tables = new Set<string>()

  constructor(schema: string) {
    super()
    this.#schema = schema
  }

  protected override transformSelectQuery(
    node: SelectQueryNode
  ): SelectQueryNode {
    return this.transformEntryPoint(node, (node) =>
      super.transformSelectQuery(node)
    )
  }

  protected override transformInsertQuery(
    node: InsertQueryNode
  ): InsertQueryNode {
    return this.transformEntryPoint(node, (node) =>
      super.transformInsertQuery(node)
    )
  }

  protected override transformUpdateQuery(
    node: UpdateQueryNode
  ): UpdateQueryNode {
    return this.transformEntryPoint(node, (node) =>
      super.transformUpdateQuery(node)
    )
  }

  protected override transformDeleteQuery(
    node: DeleteQueryNode
  ): DeleteQueryNode {
    return this.transformEntryPoint(node, (node) =>
      super.transformDeleteQuery(node)
    )
  }

  protected override transformCreateTable(
    node: CreateTableNode
  ): CreateTableNode {
    return this.transformEntryPoint(node, (node) =>
      super.transformCreateTable(node)
    )
  }

  protected override transformDropTable(node: DropTableNode): DropTableNode {
    return this.transformEntryPoint(node, (node) =>
      super.transformDropTable(node)
    )
  }

  protected override transformCreateIndex(
    node: CreateIndexNode
  ): CreateIndexNode {
    return this.transformEntryPoint(node, (node) =>
      super.transformCreateIndex(node)
    )
  }

  protected override transformDropIndex(node: DropIndexNode): DropIndexNode {
    return this.transformEntryPoint(node, (node) =>
      super.transformDropIndex(node)
    )
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

  private transformEntryPoint<T extends CompileEntryPointNode>(
    node: T,
    transform: (node: T) => T
  ): T {
    const tables = this.collectTables(node)

    for (const table of tables) {
      this.#tables.add(table)
    }

    const transformed = transform(node)

    for (const table of tables) {
      this.#tables.delete(table)
    }

    return transformed
  }

  private collectTables(node: CompileEntryPointNode): Set<string> {
    const tables = new Set<string>()

    if ('from' in node && node.from) {
      this.collectTablesFromTableExpressionNodes(node.from.froms, tables)
    }

    if ('into' in node && node.into) {
      this.collectTablesFromTableExpressionNode(node.into, tables)
    }

    if ('table' in node && node.table) {
      this.collectTablesFromTableExpressionNode(node.table, tables)
    }

    if ('joins' in node && node.joins) {
      this.collectTablesFromJoins(node.joins, tables)
    }

    return tables
  }

  private collectTablesFromTableExpressionNodes(
    nodes: ReadonlyArray<TableExpressionNode>,
    tables: Set<string>
  ): void {
    for (const node of nodes) {
      this.collectTablesFromTableExpressionNode(node, tables)
    }
  }

  private collectTablesFromJoins(
    nodes: ReadonlyArray<JoinNode>,
    tables: Set<string>
  ): void {
    for (const node of nodes) {
      this.collectTablesFromTableExpressionNode(node.table, tables)
    }
  }

  private collectTablesFromTableExpressionNode(
    node: TableExpressionNode,
    tables: Set<string>
  ): void {
    const table = tableNode.is(node)
      ? node
      : aliasNode.is(node) && tableNode.is(node.node)
      ? node.node
      : null

    if (table && !this.#tables.has(table.table.identifier)) {
      tables.add(table.table.identifier)
    }
  }
}
