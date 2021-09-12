import { AliasNode } from './alias-node'
import { ColumnNode } from './column-node'
import { IdentifierNode } from './identifier-node'
import { OperationNode, OperationNodeKind } from './operation-node'
import { ReferenceNode } from './reference-node'
import { SelectAllNode } from './select-all-node'
import { SelectionNode } from './selection-node'
import { TableNode } from './table-node'
import { AndNode } from './and-node'
import { JoinNode } from './join-node'
import { OrNode } from './or-node'
import { ParensNode } from './parens-node'
import { PrimitiveValueListNode } from './primitive-value-list-node'
import { RawNode } from './raw-node'
import { SelectQueryNode } from './select-query-node'
import { ValueListNode } from './value-list-node'
import { ValueNode } from './value-node'
import { FilterNode } from './filter-node'
import { OperatorNode } from './operator-node'
import { FromNode } from './from-node'
import { WhereNode } from './where-node'
import { InsertQueryNode } from './insert-query-node'
import { DeleteQueryNode } from './delete-query-node'
import { ReturningNode } from './returning-node'
import { CreateTableNode } from './create-table-node'
import { ColumnDefinitionNode } from './column-definition-node'
import { DropTableNode } from './drop-table-node'
import { DataTypeNode } from './data-type-node'
import { OrderByNode } from './order-by-node'
import { OrderByItemNode } from './order-by-item-node'
import { GroupByNode } from './group-by-node'
import { GroupByItemNode } from './group-by-item-node'
import { UpdateQueryNode } from './update-query-node'
import { ColumnUpdateNode } from './column-update-node'
import { LimitNode } from './limit-node'
import { OffsetNode } from './offset-node'
import { OnConflictNode } from './on-conflict-node'
import { CreateIndexNode } from './create-index-node'
import { ListNode } from './list-node'
import { DropIndexNode } from './drop-index-node'
import { TablePrimaryConstraintNode } from './table-primary-constraint-node'
import { TableUniqueConstraintNode } from './table-unique-constraint-node'
import { ReferencesNode } from './references-node'
import { CheckConstraintNode } from './check-constraint-node'
import { WithNode } from './with-node'
import { CommonTableExpressionNode } from './common-table-expression-node'
import { HavingNode } from './having-node'
import { freeze } from '../util/object-utils'
import { CreateSchemaNode } from './create-schema-node'
import { DropSchemaNode } from './drop-schema-node'

/**
 * Transforms an operation node tree into another one.
 *
 * Kysely queries are expressed internally by a tree of objects (operation nodes).
 * `OperationNodeTransformer` takes such a tree as its input and returns a
 * transformed deep copy of it. By default the `OperationNodeTransformer`
 * does nothing. You need to override one or more methods to make it do
 * something.
 *
 * There's a method for each node type. For example if you'd like to convert
 * each identifier (table name, column name, alias etc.) from camelCase to
 * snake_case, you'd do something like this:
 *
 * ```ts
 * class CamelCaseTransformer extends OperationNodeTransformer {
 *   transformIdentifier(node: IdentifierNode): IdentifierNode {
 *     node = super.transformIdentifier(node),
 *
 *     return {
 *       ...node,
 *       identifier: snakeCase(node.identifier),
 *     }
 *   }
 * }
 *
 * const transformer = new WithSchemaTransformer('some_schema')
 * const tree = transformer.transformNode(tree)
 * ```
 */
export class OperationNodeTransformer {
  protected nodeStack: OperationNode[] = []

  #transformers: Record<OperationNodeKind, Function> = {
    AliasNode: this.transformAlias.bind(this),
    ColumnNode: this.transformColumn.bind(this),
    IdentifierNode: this.transformIdentifier.bind(this),
    RawNode: this.transformRaw.bind(this),
    ReferenceNode: this.transformReference.bind(this),
    SelectQueryNode: this.transformSelectQuery.bind(this),
    SelectionNode: this.transformSelection.bind(this),
    TableNode: this.transformTable.bind(this),
    FromNode: this.transformFrom.bind(this),
    SelectAllNode: this.transformSelectAll.bind(this),
    FilterNode: this.transformFilter.bind(this),
    AndNode: this.transformAnd.bind(this),
    OrNode: this.transformOr.bind(this),
    ValueNode: this.transformValue.bind(this),
    ValueListNode: this.transformValueList.bind(this),
    PrimitiveValueListNode: this.transformPrimitiveValueList.bind(this),
    ParensNode: this.transformParens.bind(this),
    JoinNode: this.transformJoin.bind(this),
    OperatorNode: this.transformOperator.bind(this),
    WhereNode: this.transformWhere.bind(this),
    InsertQueryNode: this.transformInsertQuery.bind(this),
    DeleteQueryNode: this.transformDeleteQuery.bind(this),
    ReturningNode: this.transformReturning.bind(this),
    CreateTableNode: this.transformCreateTable.bind(this),
    ColumnDefinitionNode: this.transformColumnDefinition.bind(this),
    DropTableNode: this.transformDropTable.bind(this),
    DataTypeNode: this.transformDataType.bind(this),
    OrderByNode: this.transformOrderBy.bind(this),
    OrderByItemNode: this.transformOrderByItem.bind(this),
    GroupByNode: this.transformGroupBy.bind(this),
    GroupByItemNode: this.transformGroupByItem.bind(this),
    UpdateQueryNode: this.transformUpdateQuery.bind(this),
    ColumnUpdateNode: this.transformColumnUpdate.bind(this),
    LimitNode: this.transformLimit.bind(this),
    OffsetNode: this.transformOffset.bind(this),
    OnConflictNode: this.transformOnConflict.bind(this),
    CreateIndexNode: this.transformCreateIndex.bind(this),
    DropIndexNode: this.transformDropIndex.bind(this),
    ListNode: this.transformList.bind(this),
    TablePrimaryConstraintNode: this.transformTablePrimaryConstraint.bind(this),
    TableUniqueConstraintNode: this.transformTableUniqueConstraint.bind(this),
    ReferencesNode: this.transformReferences.bind(this),
    CheckConstraintNode: this.transformCheckConstraint.bind(this),
    WithNode: this.transformWith.bind(this),
    CommonTableExpressionNode: this.transformCommonTableExpression.bind(this),
    HavingNode: this.transformHaving.bind(this),
    CreateSchemaNode: this.transformCreateSchema.bind(this),
    DropSchemaNode: this.transformDropSchema.bind(this),
  }

  readonly transformNode = <T extends OperationNode | undefined>(
    node: OperationNode | undefined
  ): T => {
    if (!node) {
      return undefined as unknown as any
    }

    this.nodeStack.push(node)
    const out = this.#transformers[node.kind](node)
    this.nodeStack.pop()

    return freeze(out)
  }

  protected transformNodeList<T extends OperationNode>(
    list: readonly T[] | undefined
  ): readonly T[] {
    if (!list) {
      return list as unknown as T[]
    }

    return freeze(list.map(this.transformNode) as T[])
  }

  protected transformSelectQuery(node: SelectQueryNode): SelectQueryNode {
    return {
      kind: 'SelectQueryNode',
      from: this.transformNode(node.from),
      selections: this.transformNodeList(node.selections),
      distinctOnSelections: this.transformNodeList(node.distinctOnSelections),
      joins: this.transformNodeList(node.joins),
      groupBy: this.transformNode(node.groupBy),
      orderBy: this.transformNode(node.orderBy),
      where: this.transformNode(node.where),
      modifier: node.modifier,
      limit: this.transformNode(node.limit),
      offset: this.transformNode(node.offset),
      with: this.transformNode(node.with),
      having: this.transformNode(node.having),
    }
  }

  protected transformSelection(node: SelectionNode): SelectionNode {
    return {
      kind: 'SelectionNode',
      selection: this.transformNode(node.selection),
    }
  }

  protected transformColumn(node: ColumnNode): ColumnNode {
    return {
      kind: 'ColumnNode',
      column: this.transformNode(node.column),
    }
  }

  protected transformAlias(node: AliasNode): AliasNode {
    return {
      kind: 'AliasNode',
      node: this.transformNode(node.node),
      alias: this.transformNode(node.alias),
    }
  }

  protected transformTable(node: TableNode): TableNode {
    return {
      kind: 'TableNode',
      schema: this.transformNode(node.schema),
      table: this.transformNode(node.table),
    }
  }

  protected transformFrom(node: FromNode): FromNode {
    return {
      kind: 'FromNode',
      froms: this.transformNodeList(node.froms),
    }
  }

  protected transformReference(node: ReferenceNode): ReferenceNode {
    return {
      kind: 'ReferenceNode',
      table: this.transformNode(node.table),
      column: this.transformNode(node.column),
    }
  }

  protected transformFilter(node: FilterNode): FilterNode {
    return {
      kind: 'FilterNode',
      left: this.transformNode(node.left),
      op: this.transformNode(node.op),
      right: this.transformNode(node.right),
    }
  }

  protected transformAnd(node: AndNode): AndNode {
    return {
      kind: 'AndNode',
      left: this.transformNode(node.left),
      right: this.transformNode(node.right),
    }
  }

  protected transformOr(node: OrNode): OrNode {
    return {
      kind: 'OrNode',
      left: this.transformNode(node.left),
      right: this.transformNode(node.right),
    }
  }

  protected transformValueList(node: ValueListNode): ValueListNode {
    return {
      kind: 'ValueListNode',
      values: this.transformNodeList(node.values),
    }
  }

  protected transformParens(node: ParensNode): ParensNode {
    return {
      kind: 'ParensNode',
      node: this.transformNode(node.node),
    }
  }

  protected transformJoin(node: JoinNode): JoinNode {
    return {
      kind: 'JoinNode',
      joinType: node.joinType,
      table: this.transformNode(node.table),
      on: this.transformNode(node.on),
    }
  }

  protected transformRaw(node: RawNode): RawNode {
    return {
      kind: 'RawNode',
      sqlFragments: freeze([...node.sqlFragments]),
      params: this.transformNodeList(node.params),
    }
  }

  protected transformWhere(node: WhereNode): WhereNode {
    return {
      kind: 'WhereNode',
      where: this.transformNode(node.where),
    }
  }

  protected transformInsertQuery(node: InsertQueryNode): InsertQueryNode {
    return {
      kind: 'InsertQueryNode',
      into: this.transformNode(node.into),
      columns: this.transformNodeList(node.columns),
      values: this.transformNodeList(node.values),
      returning: this.transformNode(node.returning),
      onConflict: this.transformNode(node.onConflict),
      with: this.transformNode(node.with),
    }
  }

  protected transformDeleteQuery(node: DeleteQueryNode): DeleteQueryNode {
    return {
      kind: 'DeleteQueryNode',
      from: this.transformNode(node.from),
      joins: this.transformNodeList(node.joins),
      where: this.transformNode(node.where),
      returning: this.transformNode(node.returning),
      with: this.transformNode(node.with),
    }
  }

  protected transformReturning(node: ReturningNode): ReturningNode {
    return {
      kind: 'ReturningNode',
      selections: this.transformNodeList(node.selections),
    }
  }

  protected transformCreateTable(node: CreateTableNode): CreateTableNode {
    return {
      kind: 'CreateTableNode',
      table: this.transformNode(node.table),
      columns: this.transformNodeList(node.columns),
      modifier: node.modifier,
      primaryKeyConstraint: this.transformNode(node.primaryKeyConstraint),
      uniqueConstraints: this.transformNodeList(node.uniqueConstraints),
      checkConstraints: this.transformNodeList(node.checkConstraints),
    }
  }

  protected transformColumnDefinition(
    node: ColumnDefinitionNode
  ): ColumnDefinitionNode {
    return {
      kind: 'ColumnDefinitionNode',
      column: this.transformNode(node.column),
      dataType: this.transformNode(node.dataType),
      references: this.transformNode(node.references),
      isPrimaryKey: node.isPrimaryKey,
      isAutoIncrementing: node.isAutoIncrementing,
      isUnique: node.isUnique,
      isNullable: node.isNullable,
      defaultTo: this.transformNode(node.defaultTo),
      check: this.transformNode(node.check),
    }
  }

  protected transformDropTable(node: DropTableNode): DropTableNode {
    return {
      kind: 'DropTableNode',
      table: this.transformNode(node.table),
      modifier: node.modifier,
    }
  }

  protected transformOrderBy(node: OrderByNode): OrderByNode {
    return {
      kind: 'OrderByNode',
      items: this.transformNodeList(node.items),
    }
  }

  protected transformOrderByItem(node: OrderByItemNode): OrderByItemNode {
    return {
      kind: 'OrderByItemNode',
      orderBy: this.transformNode(node.orderBy),
      direction: node.direction,
    }
  }

  protected transformGroupBy(node: GroupByNode): GroupByNode {
    return {
      kind: 'GroupByNode',
      items: this.transformNodeList(node.items),
    }
  }

  protected transformGroupByItem(node: GroupByItemNode): GroupByItemNode {
    return {
      kind: 'GroupByItemNode',
      groupBy: this.transformNode(node.groupBy),
    }
  }

  protected transformUpdateQuery(node: UpdateQueryNode): UpdateQueryNode {
    return {
      kind: 'UpdateQueryNode',
      table: this.transformNode(node.table),
      joins: this.transformNodeList(node.joins),
      where: this.transformNode(node.where),
      updates: this.transformNodeList(node.updates),
      returning: this.transformNode(node.returning),
      with: this.transformNode(node.with),
    }
  }

  protected transformColumnUpdate(node: ColumnUpdateNode): ColumnUpdateNode {
    return {
      kind: 'ColumnUpdateNode',
      column: this.transformNode(node.column),
      value: this.transformNode(node.value),
    }
  }

  protected transformLimit(node: LimitNode): LimitNode {
    return {
      kind: 'LimitNode',
      limit: this.transformNode(node.limit),
    }
  }

  protected transformOffset(node: OffsetNode): OffsetNode {
    return {
      kind: 'OffsetNode',
      offset: this.transformNode(node.offset),
    }
  }

  protected transformOnConflict(node: OnConflictNode): OnConflictNode {
    return {
      kind: 'OnConflictNode',
      columns: this.transformNodeList(node.columns),
      updates: this.transformNodeList(node.updates),
      doNothing: node.doNothing,
    }
  }

  protected transformCreateIndex(node: CreateIndexNode): CreateIndexNode {
    return {
      kind: 'CreateIndexNode',
      name: this.transformNode(node.name),
      on: this.transformNode(node.on),
      expression: this.transformNode(node.expression),
      unique: node.unique,
      using: this.transformNode(node.using),
    }
  }

  protected transformList(node: ListNode): ListNode {
    return {
      kind: 'ListNode',
      items: this.transformNodeList(node.items),
    }
  }

  protected transformDropIndex(node: DropIndexNode): DropIndexNode {
    return {
      kind: 'DropIndexNode',
      name: this.transformNode(node.name),
      modifier: node.modifier,
    }
  }

  protected transformTablePrimaryConstraint(
    node: TablePrimaryConstraintNode
  ): TablePrimaryConstraintNode {
    return {
      kind: 'TablePrimaryConstraintNode',
      columns: this.transformNodeList(node.columns),
    }
  }

  protected transformTableUniqueConstraint(
    node: TableUniqueConstraintNode
  ): TableUniqueConstraintNode {
    return {
      kind: 'TableUniqueConstraintNode',
      columns: this.transformNodeList(node.columns),
    }
  }

  protected transformReferences(node: ReferencesNode): ReferencesNode {
    return {
      kind: 'ReferencesNode',
      table: this.transformNode(node.table),
      column: this.transformNode(node.column),
      onDelete: node.onDelete,
    }
  }

  protected transformCheckConstraint(
    node: CheckConstraintNode
  ): CheckConstraintNode {
    return {
      kind: 'CheckConstraintNode',
      expression: this.transformNode(node.expression),
    }
  }

  protected transformWith(node: WithNode): WithNode {
    return {
      kind: 'WithNode',
      expressions: this.transformNodeList(node.expressions),
    }
  }

  protected transformCommonTableExpression(
    node: CommonTableExpressionNode
  ): CommonTableExpressionNode {
    return {
      kind: 'CommonTableExpressionNode',
      name: this.transformNode(node.name),
      expression: this.transformNode(node.expression),
    }
  }

  protected transformHaving(node: HavingNode): HavingNode {
    return {
      kind: 'HavingNode',
      having: this.transformNode(node.having),
    }
  }

  protected transformCreateSchema(node: CreateSchemaNode): CreateSchemaNode {
    return {
      kind: 'CreateSchemaNode',
      schema: this.transformNode(node.schema),
    }
  }

  protected transformDropSchema(node: DropSchemaNode): DropSchemaNode {
    return {
      kind: 'DropSchemaNode',
      schema: this.transformNode(node.schema),
      modifier: node.modifier,
    }
  }

  protected transformDataType(node: DataTypeNode): DataTypeNode {
    // An Object.freezed leaf node. No need to clone.
    return node
  }

  protected transformSelectAll(node: SelectAllNode): SelectAllNode {
    // An Object.freezed leaf node. No need to clone.
    return node
  }

  protected transformIdentifier(node: IdentifierNode): IdentifierNode {
    // An Object.freezed leaf node. No need to clone.
    return node
  }

  protected transformValue(node: ValueNode): ValueNode {
    // An Object.freezed leaf node. No need to clone.
    return node
  }

  protected transformPrimitiveValueList(
    node: PrimitiveValueListNode
  ): PrimitiveValueListNode {
    // An Object.freezed leaf node. No need to clone.
    return node
  }

  protected transformOperator(node: OperatorNode): OperatorNode {
    // An Object.freezed leaf node. No need to clone.
    return node
  }
}
