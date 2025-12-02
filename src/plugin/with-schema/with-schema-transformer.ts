import type { AggregateFunctionNode } from '../../operation-node/aggregate-function-node.js'
import { AliasNode } from '../../operation-node/alias-node.js'
import type { FunctionNode } from '../../operation-node/function-node.js'
import { IdentifierNode } from '../../operation-node/identifier-node.js'
import { JoinNode } from '../../operation-node/join-node.js'
import { ListNode } from '../../operation-node/list-node.js'
import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js'
import type { OperationNode } from '../../operation-node/operation-node.js'
import type { ReferencesNode } from '../../operation-node/references-node.js'
import { SchemableIdentifierNode } from '../../operation-node/schemable-identifier-node.js'
import { TableNode } from '../../operation-node/table-node.js'
import { UsingNode } from '../../operation-node/using-node.js'
import type { WithNode } from '../../operation-node/with-node.js'
import type { RootOperationNode } from '../../query-compiler/query-compiler.js'
import { freeze } from '../../util/object-utils.js'
import type { QueryId } from '../../util/query-id.js'

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
  RefreshMaterializedViewNode: true,
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

const SCHEMALESS_FUNCTIONS: Record<string, true> = {
  json_agg: true,
  to_json: true,
}

export class WithSchemaTransformer extends OperationNodeTransformer {
  readonly #schema: string
  readonly #schemableIds = new Set<string>()
  readonly #ctes = new Set<string>()

  constructor(schema: string) {
    super()
    this.#schema = schema
  }

  protected override transformNodeImpl<T extends OperationNode>(
    node: T,
    queryId: QueryId,
  ): T {
    if (!this.#isRootOperationNode(node)) {
      return super.transformNodeImpl(node, queryId)
    }

    const ctes = this.#collectCTEs(node)

    for (const cte of ctes) {
      this.#ctes.add(cte)
    }

    const tables = this.#collectSchemableIds(node)

    for (const table of tables) {
      this.#schemableIds.add(table)
    }

    const transformed = super.transformNodeImpl(node, queryId)

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
    queryId: QueryId,
  ): SchemableIdentifierNode {
    const transformed = super.transformSchemableIdentifier(node, queryId)

    if (transformed.schema || !this.#schemableIds.has(node.identifier.name)) {
      return transformed
    }

    return {
      ...transformed,
      schema: IdentifierNode.create(this.#schema),
    }
  }

  protected override transformReferences(
    node: ReferencesNode,
    queryId: QueryId,
  ): ReferencesNode {
    const transformed = super.transformReferences(node, queryId)

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

  protected override transformAggregateFunction(
    node: AggregateFunctionNode,
    queryId: QueryId,
  ): AggregateFunctionNode {
    return {
      ...super.transformAggregateFunction({ ...node, aggregated: [] }, queryId),
      aggregated: this.#transformTableArgsWithoutSchemas(
        node,
        queryId,
        'aggregated',
      ),
    }
  }

  protected override transformFunction(
    node: FunctionNode,
    queryId: QueryId,
  ): FunctionNode {
    return {
      ...super.transformFunction({ ...node, arguments: [] }, queryId),
      arguments: this.#transformTableArgsWithoutSchemas(
        node,
        queryId,
        'arguments',
      ),
    }
  }

  #transformTableArgsWithoutSchemas<
    A extends string,
    N extends { func: string } & {
      [K in A]: readonly OperationNode[]
    },
  >(node: N, queryId: QueryId, argsKey: A): readonly OperationNode[] {
    return SCHEMALESS_FUNCTIONS[node.func]
      ? node[argsKey].map((arg) =>
          !TableNode.is(arg) || arg.table.schema
            ? this.transformNode(arg, queryId)
            : {
                ...arg,
                table: this.transformIdentifier(arg.table.identifier, queryId),
              },
        )
      : this.transformNodeList(node[argsKey], queryId)
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
      if (JoinNode.is(node.using)) {
        this.#collectSchemableIdsFromTableExpr(node.using.table, schemableIds)
      } else {
        this.#collectSchemableIdsFromTableExpr(node.using, schemableIds)
      }
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
      return this.#collectSchemableId(node.table, schemableIds)
    }

    if (AliasNode.is(node) && TableNode.is(node.node)) {
      return this.#collectSchemableId(node.node.table, schemableIds)
    }

    if (ListNode.is(node)) {
      for (const table of node.items) {
        this.#collectSchemableIdsFromTableExpr(table, schemableIds)
      }
      return
    }

    if (UsingNode.is(node)) {
      for (const table of node.tables) {
        this.#collectSchemableIdsFromTableExpr(table, schemableIds)
      }
      return
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
