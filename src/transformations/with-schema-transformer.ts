import { aliasNode } from '../operation-node/alias-node'
import { DeleteQueryNode } from '../operation-node/delete-query-node'
import { InsertQueryNode } from '../operation-node/insert-query-node'
import { JoinNode } from '../operation-node/join-node'
import { OperationNodeTransformer } from '../operation-node/operation-node-transformer'
import { TableExpressionNode } from '../operation-node/operation-node-utils'
import { QueryNode } from '../operation-node/query-node'
import { SelectQueryNode } from '../operation-node/select-query-node'
import { tableNode, TableNode } from '../operation-node/table-node'
import { UpdateQueryNode } from '../operation-node/update-query-node'

export class WithSchemaTransformer extends OperationNodeTransformer {
  #schema: string
  #tables = new Set<string>()

  constructor(schema: string) {
    super()
    this.#schema = schema
  }

  transformSelectQuery(node: SelectQueryNode): SelectQueryNode {
    const tables = this.collectTables(node)

    for (const table of tables) {
      this.#tables.add(table)
    }

    const transformed = super.transformSelectQuery(node)

    for (const table of tables) {
      this.#tables.delete(table)
    }

    return transformed
  }

  transformInsertQuery(node: InsertQueryNode): InsertQueryNode {
    const tables = this.collectTables(node)

    for (const table of tables) {
      this.#tables.add(table)
    }

    const transformed = super.transformInsertQuery(node)

    for (const table of tables) {
      this.#tables.delete(table)
    }

    return transformed
  }

  transformUpdateQuery(node: UpdateQueryNode): UpdateQueryNode {
    const tables = this.collectTables(node)

    for (const table of tables) {
      this.#tables.add(table)
    }

    const transformed = super.transformUpdateQuery(node)

    for (const table of tables) {
      this.#tables.delete(table)
    }

    return transformed
  }

  transformDeleteQuery(node: DeleteQueryNode): DeleteQueryNode {
    const tables = this.collectTables(node)

    for (const table of tables) {
      this.#tables.add(table)
    }

    const transformed = super.transformDeleteQuery(node)

    for (const table of tables) {
      this.#tables.delete(table)
    }

    return transformed
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

  private collectTables(node: QueryNode): Set<string> {
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
