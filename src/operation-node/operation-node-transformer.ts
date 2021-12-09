import { AliasNode } from './alias-node.js'
import { ColumnNode } from './column-node.js'
import { IdentifierNode } from './identifier-node.js'
import { OperationNode, OperationNodeKind } from './operation-node.js'
import { ReferenceNode } from './reference-node.js'
import { SelectAllNode } from './select-all-node.js'
import { SelectionNode } from './selection-node.js'
import { TableNode } from './table-node.js'
import { AndNode } from './and-node.js'
import { JoinNode } from './join-node.js'
import { OrNode } from './or-node.js'
import { ParensNode } from './parens-node.js'
import { PrimitiveValueListNode } from './primitive-value-list-node.js'
import { RawNode } from './raw-node.js'
import { SelectQueryNode } from './select-query-node.js'
import { ValueListNode } from './value-list-node.js'
import { ValueNode } from './value-node.js'
import { FilterNode } from './filter-node.js'
import { OperatorNode } from './operator-node.js'
import { FromNode } from './from-node.js'
import { WhereNode } from './where-node.js'
import { InsertQueryNode } from './insert-query-node.js'
import { DeleteQueryNode } from './delete-query-node.js'
import { ReturningNode } from './returning-node.js'
import { CreateTableNode } from './create-table-node.js'
import { AddColumnNode } from './add-column-node.js'
import { DropTableNode } from './drop-table-node.js'
import { DataTypeNode } from './data-type-node.js'
import { OrderByNode } from './order-by-node.js'
import { OrderByItemNode } from './order-by-item-node.js'
import { GroupByNode } from './group-by-node.js'
import { GroupByItemNode } from './group-by-item-node.js'
import { UpdateQueryNode } from './update-query-node.js'
import { ColumnUpdateNode } from './column-update-node.js'
import { LimitNode } from './limit-node.js'
import { OffsetNode } from './offset-node.js'
import { OnConflictNode } from './on-conflict-node.js'
import { CreateIndexNode } from './create-index-node.js'
import { ListNode } from './list-node.js'
import { DropIndexNode } from './drop-index-node.js'
import { PrimaryKeyConstraintNode } from './primary-constraint-node.js'
import { UniqueConstraintNode } from './unique-constraint-node.js'
import { ReferencesNode } from './references-node.js'
import { CheckConstraintNode } from './check-constraint-node.js'
import { WithNode } from './with-node.js'
import { CommonTableExpressionNode } from './common-table-expression-node.js'
import { HavingNode } from './having-node.js'
import { freeze } from '../util/object-utils.js'
import { CreateSchemaNode } from './create-schema-node.js'
import { DropSchemaNode } from './drop-schema-node.js'
import { AlterTableNode } from './alter-table-node.js'
import { DropColumnNode } from './drop-column-node.js'
import { RenameColumnNode } from './rename-column-node.js'
import { AlterColumnNode } from './alter-column-node.js'
import { AddConstraintNode } from './add-constraint-node.js'
import { DropConstraintNode } from './drop-constraint-node.js'
import { ForeignKeyConstraintNode } from './foreign-key-constraint-node.js'
import { ColumnDefinitionNode } from './column-definition-node.js'
import { ModifyColumnNode } from './modify-column-node.js'
import { OnDuplicateKeyNode } from './on-duplicate-key-node.js'
import { UnionNode } from './union-node.js'
import { CreateViewNode } from './create-view-node.js'
import { DropViewNode } from './drop-view-node.js'
import { GeneratedAlwaysAsNode } from './generated-always-as-node.js'
import { DefaultValueNode } from './default-value-node.js'
import { OnNode } from './on-node.js'

/**
 * Transforms an operation node tree into another one.
 *
 * Kysely queries are expressed internally as a tree of objects (operation nodes).
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
 * const transformer = new CamelCaseTransformer()
 * const tree = transformer.transformNode(tree)
 * ```
 */
export class OperationNodeTransformer {
  protected readonly nodeStack: OperationNode[] = []

  readonly #transformers: Record<OperationNodeKind, Function> = freeze({
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
    AddColumnNode: this.transformAddColumn.bind(this),
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
    OnDuplicateKeyNode: this.transformOnDuplicateKey.bind(this),
    CreateIndexNode: this.transformCreateIndex.bind(this),
    DropIndexNode: this.transformDropIndex.bind(this),
    ListNode: this.transformList.bind(this),
    PrimaryKeyConstraintNode: this.transformPrimaryKeyConstraint.bind(this),
    UniqueConstraintNode: this.transformUniqueConstraint.bind(this),
    ReferencesNode: this.transformReferences.bind(this),
    CheckConstraintNode: this.transformCheckConstraint.bind(this),
    WithNode: this.transformWith.bind(this),
    CommonTableExpressionNode: this.transformCommonTableExpression.bind(this),
    HavingNode: this.transformHaving.bind(this),
    CreateSchemaNode: this.transformCreateSchema.bind(this),
    DropSchemaNode: this.transformDropSchema.bind(this),
    AlterTableNode: this.transformAlterTable.bind(this),
    DropColumnNode: this.transformDropColumn.bind(this),
    RenameColumnNode: this.transformRenameColumn.bind(this),
    AlterColumnNode: this.transformAlterColumn.bind(this),
    ModifyColumnNode: this.transformModifyColumn.bind(this),
    AddConstraintNode: this.transformAddConstraint.bind(this),
    DropConstraintNode: this.transformDropConstraint.bind(this),
    ForeignKeyConstraintNode: this.transformForeignKeyConstraint.bind(this),
    UnionNode: this.transformUnion.bind(this),
    CreateViewNode: this.transformCreateView.bind(this),
    DropViewNode: this.transformDropView.bind(this),
    GeneratedAlwaysAsNode: this.transformGeneratedAlwaysAs.bind(this),
    DefaultValueNode: this.transformDefaultValue.bind(this),
    OnNode: this.transformOn.bind(this),
  })

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
      distinct: node.distinct,
      joins: this.transformNodeList(node.joins),
      groupBy: this.transformNode(node.groupBy),
      orderBy: this.transformNode(node.orderBy),
      where: this.transformNode(node.where),
      modifiers: node.modifiers,
      limit: this.transformNode(node.limit),
      offset: this.transformNode(node.offset),
      with: this.transformNode(node.with),
      having: this.transformNode(node.having),
      union: this.transformNodeList(node.union),
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
      onDuplicateKey: this.transformNode(node.onDuplicateKey),
      with: this.transformNode(node.with),
      ignore: node.ignore,
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
      constraints: this.transformNodeList(node.constraints),
      ifNotExists: node.ifNotExists,
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
      primaryKey: node.primaryKey,
      autoIncrement: node.autoIncrement,
      unique: node.unique,
      nullable: node.nullable,
      defaultTo: this.transformNode(node.defaultTo),
      check: this.transformNode(node.check),
      generatedAlwaysAs: this.transformNode(node.generatedAlwaysAs),
    }
  }

  protected transformAddColumn(node: AddColumnNode): AddColumnNode {
    return {
      kind: 'AddColumnNode',
      column: this.transformNode(node.column),
    }
  }

  protected transformDropTable(node: DropTableNode): DropTableNode {
    return {
      kind: 'DropTableNode',
      table: this.transformNode(node.table),
      ifExists: node.ifExists,
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
      direction: this.transformNode(node.direction),
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
      constraint: this.transformNode(node.constraint),
      updates: this.transformNodeList(node.updates),
      doNothing: node.doNothing,
    }
  }

  protected transformOnDuplicateKey(
    node: OnDuplicateKeyNode
  ): OnDuplicateKeyNode {
    return {
      kind: 'OnDuplicateKeyNode',
      updates: this.transformNodeList(node.updates),
    }
  }

  protected transformCreateIndex(node: CreateIndexNode): CreateIndexNode {
    return {
      kind: 'CreateIndexNode',
      name: this.transformNode(node.name),
      table: this.transformNode(node.table),
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
      table: this.transformNode(node.table),
      ifExists: node.ifExists,
    }
  }

  protected transformPrimaryKeyConstraint(
    node: PrimaryKeyConstraintNode
  ): PrimaryKeyConstraintNode {
    return {
      kind: 'PrimaryKeyConstraintNode',
      columns: this.transformNodeList(node.columns),
      name: this.transformNode(node.name),
    }
  }

  protected transformUniqueConstraint(
    node: UniqueConstraintNode
  ): UniqueConstraintNode {
    return {
      kind: 'UniqueConstraintNode',
      columns: this.transformNodeList(node.columns),
      name: this.transformNode(node.name),
    }
  }

  protected transformForeignKeyConstraint(
    node: ForeignKeyConstraintNode
  ): ForeignKeyConstraintNode {
    return {
      kind: 'ForeignKeyConstraintNode',
      columns: this.transformNodeList(node.columns),
      references: this.transformNode(node.references),
      name: this.transformNode(node.name),
      onDelete: node.onDelete,
      onUpdate: node.onUpdate,
    }
  }

  protected transformUnion(node: UnionNode): UnionNode {
    return {
      kind: 'UnionNode',
      union: this.transformNode(node.union),
      all: node.all,
    }
  }

  protected transformReferences(node: ReferencesNode): ReferencesNode {
    return {
      kind: 'ReferencesNode',
      table: this.transformNode(node.table),
      columns: this.transformNodeList(node.columns),
      onDelete: node.onDelete,
      onUpdate: node.onUpdate,
    }
  }

  protected transformCheckConstraint(
    node: CheckConstraintNode
  ): CheckConstraintNode {
    return {
      kind: 'CheckConstraintNode',
      expression: this.transformNode(node.expression),
      name: this.transformNode(node.name),
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
      ifExists: node.ifExists,
    }
  }

  protected transformAlterTable(node: AlterTableNode): AlterTableNode {
    return {
      kind: 'AlterTableNode',
      table: this.transformNode(node.table),
      renameTo: this.transformNode(node.renameTo),
      setSchema: this.transformNode(node.setSchema),
      renameColumn: this.transformNode(node.renameColumn),
      addColumn: this.transformNode(node.addColumn),
      dropColumn: this.transformNode(node.dropColumn),
      alterColumn: this.transformNode(node.alterColumn),
      modifyColumn: this.transformNode(node.modifyColumn),
      addConstraint: this.transformNode(node.addConstraint),
      dropConstraint: this.transformNode(node.dropConstraint),
    }
  }

  protected transformDropColumn(node: DropColumnNode): DropColumnNode {
    return {
      kind: 'DropColumnNode',
      column: this.transformNode(node.column),
    }
  }

  protected transformRenameColumn(node: RenameColumnNode): RenameColumnNode {
    return {
      kind: 'RenameColumnNode',
      column: this.transformNode(node.column),
      renameTo: this.transformNode(node.renameTo),
    }
  }

  protected transformAlterColumn(node: AlterColumnNode): AlterColumnNode {
    return {
      kind: 'AlterColumnNode',
      column: this.transformNode(node.column),
      dataType: this.transformNode(node.dataType),
      dataTypeExpression: this.transformNode(node.dataTypeExpression),
      setDefault: this.transformNode(node.setDefault),
      dropDefault: node.dropDefault,
      setNotNull: node.setNotNull,
      dropNotNull: node.dropNotNull,
    }
  }

  protected transformModifyColumn(node: ModifyColumnNode): ModifyColumnNode {
    return {
      kind: 'ModifyColumnNode',
      column: this.transformNode(node.column),
    }
  }

  protected transformAddConstraint(node: AddConstraintNode): AddConstraintNode {
    return {
      kind: 'AddConstraintNode',
      constraint: this.transformNode(node.constraint),
    }
  }

  protected transformDropConstraint(
    node: DropConstraintNode
  ): DropConstraintNode {
    return {
      kind: 'DropConstraintNode',
      constraintName: this.transformNode(node.constraintName),
    }
  }

  protected transformCreateView(node: CreateViewNode): CreateViewNode {
    return {
      kind: 'CreateViewNode',
      name: this.transformNode(node.name),
      orReplace: node.orReplace,
      ifNotExists: node.ifNotExists,
      materialized: node.materialized,
      columns: this.transformNodeList(node.columns),
      as: this.transformNode(node.as),
    }
  }

  protected transformDropView(node: DropViewNode): DropViewNode {
    return {
      kind: 'DropViewNode',
      name: this.transformNode(node.name),
      ifExists: node.ifExists,
      materialized: node.materialized,
    }
  }

  protected transformGeneratedAlwaysAs(
    node: GeneratedAlwaysAsNode
  ): GeneratedAlwaysAsNode {
    return {
      kind: 'GeneratedAlwaysAsNode',
      expression: this.transformNode(node.expression),
      stored: node.stored,
    }
  }

  protected transformDefaultValue(node: DefaultValueNode): DefaultValueNode {
    return {
      kind: 'DefaultValueNode',
      defaultValue: this.transformNode(node.defaultValue),
    }
  }

  protected transformOn(node: OnNode): OnNode {
    return {
      kind: 'OnNode',
      on: this.transformNode(node.on),
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
