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
import { CommonTableExpressionNameNode } from './common-table-expression-name-node.js'
import { HavingNode } from './having-node.js'
import { freeze } from '../util/object-utils.js'
import { requireAllProps } from '../util/require-all-props.js'
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
import { CreateViewNode } from './create-view-node.js'
import { DropViewNode } from './drop-view-node.js'
import { GeneratedNode } from './generated-node.js'
import { DefaultValueNode } from './default-value-node.js'
import { OnNode } from './on-node.js'
import { ValuesNode } from './values-node.js'
import { SelectModifierNode } from './select-modifier-node.js'
import { CreateTypeNode } from './create-type-node.js'
import { DropTypeNode } from './drop-type-node.js'
import { ExplainNode } from './explain-node.js'
import { SchemableIdentifierNode } from './schemable-identifier-node.js'
import { DefaultInsertValueNode } from './default-insert-value-node.js'
import { AggregateFunctionNode } from './aggregate-function-node.js'
import { OverNode } from './over-node.js'
import { PartitionByNode } from './partition-by-node.js'
import { PartitionByItemNode } from './partition-by-item-node.js'
import { SetOperationNode } from './set-operation-node.js'
import { BinaryOperationNode } from './binary-operation-node.js'
import { UnaryOperationNode } from './unary-operation-node.js'
import { UsingNode } from './using-node.js'
import { FunctionNode } from './function-node.js'
import { CaseNode } from './case-node.js'
import { WhenNode } from './when-node.js'
import { JSONReferenceNode } from './json-reference-node.js'
import { JSONPathNode } from './json-path-node.js'
import { JSONPathLegNode } from './json-path-leg-node.js'
import { JSONOperatorChainNode } from './json-operator-chain-node.js'
import { TupleNode } from './tuple-node.js'
import { MergeQueryNode } from './merge-query-node.js'
import { MatchedNode } from './matched-node.js'
import { AddIndexNode } from './add-index-node.js'
import { CastNode } from './cast-node.js'
import { FetchNode } from './fetch-node.js'
import { TopNode } from './top-node.js'
import { OutputNode } from './output-node.js'
import { RefreshMaterializedViewNode } from './refresh-materialized-view-node.js'

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
 *       name: snakeCase(node.name),
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
    SchemableIdentifierNode: this.transformSchemableIdentifier.bind(this),
    RawNode: this.transformRaw.bind(this),
    ReferenceNode: this.transformReference.bind(this),
    SelectQueryNode: this.transformSelectQuery.bind(this),
    SelectionNode: this.transformSelection.bind(this),
    TableNode: this.transformTable.bind(this),
    FromNode: this.transformFrom.bind(this),
    SelectAllNode: this.transformSelectAll.bind(this),
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
    CommonTableExpressionNameNode:
      this.transformCommonTableExpressionName.bind(this),
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
    CreateViewNode: this.transformCreateView.bind(this),
    RefreshMaterializedViewNode:
      this.transformRefreshMaterializedView.bind(this),
    DropViewNode: this.transformDropView.bind(this),
    GeneratedNode: this.transformGenerated.bind(this),
    DefaultValueNode: this.transformDefaultValue.bind(this),
    OnNode: this.transformOn.bind(this),
    ValuesNode: this.transformValues.bind(this),
    SelectModifierNode: this.transformSelectModifier.bind(this),
    CreateTypeNode: this.transformCreateType.bind(this),
    DropTypeNode: this.transformDropType.bind(this),
    ExplainNode: this.transformExplain.bind(this),
    DefaultInsertValueNode: this.transformDefaultInsertValue.bind(this),
    AggregateFunctionNode: this.transformAggregateFunction.bind(this),
    OverNode: this.transformOver.bind(this),
    PartitionByNode: this.transformPartitionBy.bind(this),
    PartitionByItemNode: this.transformPartitionByItem.bind(this),
    SetOperationNode: this.transformSetOperation.bind(this),
    BinaryOperationNode: this.transformBinaryOperation.bind(this),
    UnaryOperationNode: this.transformUnaryOperation.bind(this),
    UsingNode: this.transformUsing.bind(this),
    FunctionNode: this.transformFunction.bind(this),
    CaseNode: this.transformCase.bind(this),
    WhenNode: this.transformWhen.bind(this),
    JSONReferenceNode: this.transformJSONReference.bind(this),
    JSONPathNode: this.transformJSONPath.bind(this),
    JSONPathLegNode: this.transformJSONPathLeg.bind(this),
    JSONOperatorChainNode: this.transformJSONOperatorChain.bind(this),
    TupleNode: this.transformTuple.bind(this),
    MergeQueryNode: this.transformMergeQuery.bind(this),
    MatchedNode: this.transformMatched.bind(this),
    AddIndexNode: this.transformAddIndex.bind(this),
    CastNode: this.transformCast.bind(this),
    FetchNode: this.transformFetch.bind(this),
    TopNode: this.transformTop.bind(this),
    OutputNode: this.transformOutput.bind(this),
  })

  transformNode<T extends OperationNode | undefined>(node: T): T {
    if (!node) {
      return node
    }

    this.nodeStack.push(node)
    const out = this.transformNodeImpl(node)
    this.nodeStack.pop()

    return freeze(out) as T
  }

  protected transformNodeImpl<T extends OperationNode>(node: T): T {
    return this.#transformers[node.kind](node)
  }

  protected transformNodeList<
    T extends ReadonlyArray<OperationNode> | undefined,
  >(list: T): T {
    if (!list) {
      return list
    }

    return freeze(list.map((node) => this.transformNode(node))) as T
  }

  protected transformSelectQuery(node: SelectQueryNode): SelectQueryNode {
    return requireAllProps<SelectQueryNode>({
      kind: 'SelectQueryNode',
      from: this.transformNode(node.from),
      selections: this.transformNodeList(node.selections),
      distinctOn: this.transformNodeList(node.distinctOn),
      joins: this.transformNodeList(node.joins),
      groupBy: this.transformNode(node.groupBy),
      orderBy: this.transformNode(node.orderBy),
      where: this.transformNode(node.where),
      frontModifiers: this.transformNodeList(node.frontModifiers),
      endModifiers: this.transformNodeList(node.endModifiers),
      limit: this.transformNode(node.limit),
      offset: this.transformNode(node.offset),
      with: this.transformNode(node.with),
      having: this.transformNode(node.having),
      explain: this.transformNode(node.explain),
      setOperations: this.transformNodeList(node.setOperations),
      fetch: this.transformNode(node.fetch),
      top: this.transformNode(node.top),
    })
  }

  protected transformSelection(node: SelectionNode): SelectionNode {
    return requireAllProps<SelectionNode>({
      kind: 'SelectionNode',
      selection: this.transformNode(node.selection),
    })
  }

  protected transformColumn(node: ColumnNode): ColumnNode {
    return requireAllProps<ColumnNode>({
      kind: 'ColumnNode',
      column: this.transformNode(node.column),
    })
  }

  protected transformAlias(node: AliasNode): AliasNode {
    return requireAllProps<AliasNode>({
      kind: 'AliasNode',
      node: this.transformNode(node.node),
      alias: this.transformNode(node.alias),
    })
  }

  protected transformTable(node: TableNode): TableNode {
    return requireAllProps<TableNode>({
      kind: 'TableNode',
      table: this.transformNode(node.table),
    })
  }

  protected transformFrom(node: FromNode): FromNode {
    return requireAllProps<FromNode>({
      kind: 'FromNode',
      froms: this.transformNodeList(node.froms),
    })
  }

  protected transformReference(node: ReferenceNode): ReferenceNode {
    return requireAllProps<ReferenceNode>({
      kind: 'ReferenceNode',
      column: this.transformNode(node.column),
      table: this.transformNode(node.table),
    })
  }

  protected transformAnd(node: AndNode): AndNode {
    return requireAllProps<AndNode>({
      kind: 'AndNode',
      left: this.transformNode(node.left),
      right: this.transformNode(node.right),
    })
  }

  protected transformOr(node: OrNode): OrNode {
    return requireAllProps<OrNode>({
      kind: 'OrNode',
      left: this.transformNode(node.left),
      right: this.transformNode(node.right),
    })
  }

  protected transformValueList(node: ValueListNode): ValueListNode {
    return requireAllProps<ValueListNode>({
      kind: 'ValueListNode',
      values: this.transformNodeList(node.values),
    })
  }

  protected transformParens(node: ParensNode): ParensNode {
    return requireAllProps<ParensNode>({
      kind: 'ParensNode',
      node: this.transformNode(node.node),
    })
  }

  protected transformJoin(node: JoinNode): JoinNode {
    return requireAllProps<JoinNode>({
      kind: 'JoinNode',
      joinType: node.joinType,
      table: this.transformNode(node.table),
      on: this.transformNode(node.on),
    })
  }

  protected transformRaw(node: RawNode): RawNode {
    return requireAllProps<RawNode>({
      kind: 'RawNode',
      sqlFragments: freeze([...node.sqlFragments]),
      parameters: this.transformNodeList(node.parameters),
    })
  }

  protected transformWhere(node: WhereNode): WhereNode {
    return requireAllProps<WhereNode>({
      kind: 'WhereNode',
      where: this.transformNode(node.where),
    })
  }

  protected transformInsertQuery(node: InsertQueryNode): InsertQueryNode {
    return requireAllProps<InsertQueryNode>({
      kind: 'InsertQueryNode',
      into: this.transformNode(node.into),
      columns: this.transformNodeList(node.columns),
      values: this.transformNode(node.values),
      returning: this.transformNode(node.returning),
      onConflict: this.transformNode(node.onConflict),
      onDuplicateKey: this.transformNode(node.onDuplicateKey),
      endModifiers: this.transformNodeList(node.endModifiers),
      with: this.transformNode(node.with),
      ignore: node.ignore,
      replace: node.replace,
      explain: this.transformNode(node.explain),
      defaultValues: node.defaultValues,
      top: this.transformNode(node.top),
      output: this.transformNode(node.output),
    })
  }

  protected transformValues(node: ValuesNode): ValuesNode {
    return requireAllProps<ValuesNode>({
      kind: 'ValuesNode',
      values: this.transformNodeList(node.values),
    })
  }

  protected transformDeleteQuery(node: DeleteQueryNode): DeleteQueryNode {
    return requireAllProps<DeleteQueryNode>({
      kind: 'DeleteQueryNode',
      from: this.transformNode(node.from),
      using: this.transformNode(node.using),
      joins: this.transformNodeList(node.joins),
      where: this.transformNode(node.where),
      returning: this.transformNode(node.returning),
      endModifiers: this.transformNodeList(node.endModifiers),
      with: this.transformNode(node.with),
      orderBy: this.transformNode(node.orderBy),
      limit: this.transformNode(node.limit),
      explain: this.transformNode(node.explain),
      top: this.transformNode(node.top),
      output: this.transformNode(node.output),
    })
  }

  protected transformReturning(node: ReturningNode): ReturningNode {
    return requireAllProps<ReturningNode>({
      kind: 'ReturningNode',
      selections: this.transformNodeList(node.selections),
    })
  }

  protected transformCreateTable(node: CreateTableNode): CreateTableNode {
    return requireAllProps<CreateTableNode>({
      kind: 'CreateTableNode',
      table: this.transformNode(node.table),
      columns: this.transformNodeList(node.columns),
      constraints: this.transformNodeList(node.constraints),
      temporary: node.temporary,
      ifNotExists: node.ifNotExists,
      onCommit: node.onCommit,
      frontModifiers: this.transformNodeList(node.frontModifiers),
      endModifiers: this.transformNodeList(node.endModifiers),
      selectQuery: this.transformNode(node.selectQuery),
    })
  }

  protected transformColumnDefinition(
    node: ColumnDefinitionNode,
  ): ColumnDefinitionNode {
    return requireAllProps<ColumnDefinitionNode>({
      kind: 'ColumnDefinitionNode',
      column: this.transformNode(node.column),
      dataType: this.transformNode(node.dataType),
      references: this.transformNode(node.references),
      primaryKey: node.primaryKey,
      autoIncrement: node.autoIncrement,
      unique: node.unique,
      notNull: node.notNull,
      unsigned: node.unsigned,
      defaultTo: this.transformNode(node.defaultTo),
      check: this.transformNode(node.check),
      generated: this.transformNode(node.generated),
      frontModifiers: this.transformNodeList(node.frontModifiers),
      endModifiers: this.transformNodeList(node.endModifiers),
      nullsNotDistinct: node.nullsNotDistinct,
      identity: node.identity,
      ifNotExists: node.ifNotExists,
    })
  }

  protected transformAddColumn(node: AddColumnNode): AddColumnNode {
    return requireAllProps<AddColumnNode>({
      kind: 'AddColumnNode',
      column: this.transformNode(node.column),
    })
  }

  protected transformDropTable(node: DropTableNode): DropTableNode {
    return requireAllProps<DropTableNode>({
      kind: 'DropTableNode',
      table: this.transformNode(node.table),
      ifExists: node.ifExists,
      cascade: node.cascade,
    })
  }

  protected transformOrderBy(node: OrderByNode): OrderByNode {
    return requireAllProps<OrderByNode>({
      kind: 'OrderByNode',
      items: this.transformNodeList(node.items),
    })
  }

  protected transformOrderByItem(node: OrderByItemNode): OrderByItemNode {
    return requireAllProps<OrderByItemNode>({
      kind: 'OrderByItemNode',
      orderBy: this.transformNode(node.orderBy),
      direction: this.transformNode(node.direction),
    })
  }

  protected transformGroupBy(node: GroupByNode): GroupByNode {
    return requireAllProps<GroupByNode>({
      kind: 'GroupByNode',
      items: this.transformNodeList(node.items),
    })
  }

  protected transformGroupByItem(node: GroupByItemNode): GroupByItemNode {
    return requireAllProps<GroupByItemNode>({
      kind: 'GroupByItemNode',
      groupBy: this.transformNode(node.groupBy),
    })
  }

  protected transformUpdateQuery(node: UpdateQueryNode): UpdateQueryNode {
    return requireAllProps<UpdateQueryNode>({
      kind: 'UpdateQueryNode',
      table: this.transformNode(node.table),
      from: this.transformNode(node.from),
      joins: this.transformNodeList(node.joins),
      where: this.transformNode(node.where),
      updates: this.transformNodeList(node.updates),
      returning: this.transformNode(node.returning),
      endModifiers: this.transformNodeList(node.endModifiers),
      with: this.transformNode(node.with),
      explain: this.transformNode(node.explain),
      limit: this.transformNode(node.limit),
      top: this.transformNode(node.top),
      output: this.transformNode(node.output),
    })
  }

  protected transformColumnUpdate(node: ColumnUpdateNode): ColumnUpdateNode {
    return requireAllProps<ColumnUpdateNode>({
      kind: 'ColumnUpdateNode',
      column: this.transformNode(node.column),
      value: this.transformNode(node.value),
    })
  }

  protected transformLimit(node: LimitNode): LimitNode {
    return requireAllProps<LimitNode>({
      kind: 'LimitNode',
      limit: this.transformNode(node.limit),
    })
  }

  protected transformOffset(node: OffsetNode): OffsetNode {
    return requireAllProps<OffsetNode>({
      kind: 'OffsetNode',
      offset: this.transformNode(node.offset),
    })
  }

  protected transformOnConflict(node: OnConflictNode): OnConflictNode {
    return requireAllProps<OnConflictNode>({
      kind: 'OnConflictNode',
      columns: this.transformNodeList(node.columns),
      constraint: this.transformNode(node.constraint),
      indexExpression: this.transformNode(node.indexExpression),
      indexWhere: this.transformNode(node.indexWhere),
      updates: this.transformNodeList(node.updates),
      updateWhere: this.transformNode(node.updateWhere),
      doNothing: node.doNothing,
    })
  }

  protected transformOnDuplicateKey(
    node: OnDuplicateKeyNode,
  ): OnDuplicateKeyNode {
    return requireAllProps<OnDuplicateKeyNode>({
      kind: 'OnDuplicateKeyNode',
      updates: this.transformNodeList(node.updates),
    })
  }

  protected transformCreateIndex(node: CreateIndexNode): CreateIndexNode {
    return requireAllProps<CreateIndexNode>({
      kind: 'CreateIndexNode',
      name: this.transformNode(node.name),
      table: this.transformNode(node.table),
      columns: this.transformNodeList(node.columns),
      unique: node.unique,
      using: this.transformNode(node.using),
      ifNotExists: node.ifNotExists,
      where: this.transformNode(node.where),
      nullsNotDistinct: node.nullsNotDistinct,
    })
  }

  protected transformList(node: ListNode): ListNode {
    return requireAllProps<ListNode>({
      kind: 'ListNode',
      items: this.transformNodeList(node.items),
    })
  }

  protected transformDropIndex(node: DropIndexNode): DropIndexNode {
    return requireAllProps<DropIndexNode>({
      kind: 'DropIndexNode',
      name: this.transformNode(node.name),
      table: this.transformNode(node.table),
      ifExists: node.ifExists,
      cascade: node.cascade,
    })
  }

  protected transformPrimaryKeyConstraint(
    node: PrimaryKeyConstraintNode,
  ): PrimaryKeyConstraintNode {
    return requireAllProps<PrimaryKeyConstraintNode>({
      kind: 'PrimaryKeyConstraintNode',
      columns: this.transformNodeList(node.columns),
      name: this.transformNode(node.name),
    })
  }

  protected transformUniqueConstraint(
    node: UniqueConstraintNode,
  ): UniqueConstraintNode {
    return requireAllProps<UniqueConstraintNode>({
      kind: 'UniqueConstraintNode',
      columns: this.transformNodeList(node.columns),
      name: this.transformNode(node.name),
      nullsNotDistinct: node.nullsNotDistinct,
    })
  }

  protected transformForeignKeyConstraint(
    node: ForeignKeyConstraintNode,
  ): ForeignKeyConstraintNode {
    return requireAllProps<ForeignKeyConstraintNode>({
      kind: 'ForeignKeyConstraintNode',
      columns: this.transformNodeList(node.columns),
      references: this.transformNode(node.references),
      name: this.transformNode(node.name),
      onDelete: node.onDelete,
      onUpdate: node.onUpdate,
    })
  }

  protected transformSetOperation(node: SetOperationNode): SetOperationNode {
    return requireAllProps<SetOperationNode>({
      kind: 'SetOperationNode',
      operator: node.operator,
      expression: this.transformNode(node.expression),
      all: node.all,
    })
  }

  protected transformReferences(node: ReferencesNode): ReferencesNode {
    return requireAllProps<ReferencesNode>({
      kind: 'ReferencesNode',
      table: this.transformNode(node.table),
      columns: this.transformNodeList(node.columns),
      onDelete: node.onDelete,
      onUpdate: node.onUpdate,
    })
  }

  protected transformCheckConstraint(
    node: CheckConstraintNode,
  ): CheckConstraintNode {
    return requireAllProps<CheckConstraintNode>({
      kind: 'CheckConstraintNode',
      expression: this.transformNode(node.expression),
      name: this.transformNode(node.name),
    })
  }

  protected transformWith(node: WithNode): WithNode {
    return requireAllProps<WithNode>({
      kind: 'WithNode',
      expressions: this.transformNodeList(node.expressions),
      recursive: node.recursive,
    })
  }

  protected transformCommonTableExpression(
    node: CommonTableExpressionNode,
  ): CommonTableExpressionNode {
    return requireAllProps<CommonTableExpressionNode>({
      kind: 'CommonTableExpressionNode',
      name: this.transformNode(node.name),
      materialized: node.materialized,
      expression: this.transformNode(node.expression),
    })
  }

  protected transformCommonTableExpressionName(
    node: CommonTableExpressionNameNode,
  ): CommonTableExpressionNameNode {
    return requireAllProps<CommonTableExpressionNameNode>({
      kind: 'CommonTableExpressionNameNode',
      table: this.transformNode(node.table),
      columns: this.transformNodeList(node.columns),
    })
  }

  protected transformHaving(node: HavingNode): HavingNode {
    return requireAllProps<HavingNode>({
      kind: 'HavingNode',
      having: this.transformNode(node.having),
    })
  }

  protected transformCreateSchema(node: CreateSchemaNode): CreateSchemaNode {
    return requireAllProps<CreateSchemaNode>({
      kind: 'CreateSchemaNode',
      schema: this.transformNode(node.schema),
      ifNotExists: node.ifNotExists,
    })
  }

  protected transformDropSchema(node: DropSchemaNode): DropSchemaNode {
    return requireAllProps<DropSchemaNode>({
      kind: 'DropSchemaNode',
      schema: this.transformNode(node.schema),
      ifExists: node.ifExists,
      cascade: node.cascade,
    })
  }

  protected transformAlterTable(node: AlterTableNode): AlterTableNode {
    return requireAllProps<AlterTableNode>({
      kind: 'AlterTableNode',
      table: this.transformNode(node.table),
      renameTo: this.transformNode(node.renameTo),
      setSchema: this.transformNode(node.setSchema),
      columnAlterations: this.transformNodeList(node.columnAlterations),
      addConstraint: this.transformNode(node.addConstraint),
      dropConstraint: this.transformNode(node.dropConstraint),
      addIndex: this.transformNode(node.addIndex),
      dropIndex: this.transformNode(node.dropIndex),
    })
  }

  protected transformDropColumn(node: DropColumnNode): DropColumnNode {
    return requireAllProps<DropColumnNode>({
      kind: 'DropColumnNode',
      column: this.transformNode(node.column),
    })
  }

  protected transformRenameColumn(node: RenameColumnNode): RenameColumnNode {
    return requireAllProps<RenameColumnNode>({
      kind: 'RenameColumnNode',
      column: this.transformNode(node.column),
      renameTo: this.transformNode(node.renameTo),
    })
  }

  protected transformAlterColumn(node: AlterColumnNode): AlterColumnNode {
    return requireAllProps<AlterColumnNode>({
      kind: 'AlterColumnNode',
      column: this.transformNode(node.column),
      dataType: this.transformNode(node.dataType),
      dataTypeExpression: this.transformNode(node.dataTypeExpression),
      setDefault: this.transformNode(node.setDefault),
      dropDefault: node.dropDefault,
      setNotNull: node.setNotNull,
      dropNotNull: node.dropNotNull,
    })
  }

  protected transformModifyColumn(node: ModifyColumnNode): ModifyColumnNode {
    return requireAllProps<ModifyColumnNode>({
      kind: 'ModifyColumnNode',
      column: this.transformNode(node.column),
    })
  }

  protected transformAddConstraint(node: AddConstraintNode): AddConstraintNode {
    return requireAllProps<AddConstraintNode>({
      kind: 'AddConstraintNode',
      constraint: this.transformNode(node.constraint),
    })
  }

  protected transformDropConstraint(
    node: DropConstraintNode,
  ): DropConstraintNode {
    return requireAllProps<DropConstraintNode>({
      kind: 'DropConstraintNode',
      constraintName: this.transformNode(node.constraintName),
      ifExists: node.ifExists,
      modifier: node.modifier,
    })
  }

  protected transformCreateView(node: CreateViewNode): CreateViewNode {
    return requireAllProps<CreateViewNode>({
      kind: 'CreateViewNode',
      name: this.transformNode(node.name),
      temporary: node.temporary,
      orReplace: node.orReplace,
      ifNotExists: node.ifNotExists,
      materialized: node.materialized,
      columns: this.transformNodeList(node.columns),
      as: this.transformNode(node.as),
    })
  }

  protected transformRefreshMaterializedView(
    node: RefreshMaterializedViewNode,
  ): RefreshMaterializedViewNode {
    return requireAllProps<RefreshMaterializedViewNode>({
      kind: 'RefreshMaterializedViewNode',
      name: this.transformNode(node.name),
      concurrently: node.concurrently,
      withNoData: node.withNoData,
    })
  }

  protected transformDropView(node: DropViewNode): DropViewNode {
    return requireAllProps<DropViewNode>({
      kind: 'DropViewNode',
      name: this.transformNode(node.name),
      ifExists: node.ifExists,
      materialized: node.materialized,
      cascade: node.cascade,
    })
  }

  protected transformGenerated(node: GeneratedNode): GeneratedNode {
    return requireAllProps<GeneratedNode>({
      kind: 'GeneratedNode',
      byDefault: node.byDefault,
      always: node.always,
      identity: node.identity,
      stored: node.stored,
      expression: this.transformNode(node.expression),
    })
  }

  protected transformDefaultValue(node: DefaultValueNode): DefaultValueNode {
    return requireAllProps<DefaultValueNode>({
      kind: 'DefaultValueNode',
      defaultValue: this.transformNode(node.defaultValue),
    })
  }

  protected transformOn(node: OnNode): OnNode {
    return requireAllProps<OnNode>({
      kind: 'OnNode',
      on: this.transformNode(node.on),
    })
  }

  protected transformSelectModifier(
    node: SelectModifierNode,
  ): SelectModifierNode {
    return requireAllProps<SelectModifierNode>({
      kind: 'SelectModifierNode',
      modifier: node.modifier,
      rawModifier: this.transformNode(node.rawModifier),
      of: this.transformNodeList(node.of),
    })
  }

  protected transformCreateType(node: CreateTypeNode): CreateTypeNode {
    return requireAllProps<CreateTypeNode>({
      kind: 'CreateTypeNode',
      name: this.transformNode(node.name),
      enum: this.transformNode(node.enum),
    })
  }

  protected transformDropType(node: DropTypeNode): DropTypeNode {
    return requireAllProps<DropTypeNode>({
      kind: 'DropTypeNode',
      name: this.transformNode(node.name),
      ifExists: node.ifExists,
    })
  }

  protected transformExplain(node: ExplainNode): ExplainNode {
    return requireAllProps({
      kind: 'ExplainNode',
      format: node.format,
      options: this.transformNode(node.options),
    })
  }

  protected transformSchemableIdentifier(
    node: SchemableIdentifierNode,
  ): SchemableIdentifierNode {
    return requireAllProps<SchemableIdentifierNode>({
      kind: 'SchemableIdentifierNode',
      schema: this.transformNode(node.schema),
      identifier: this.transformNode(node.identifier),
    })
  }

  protected transformAggregateFunction(
    node: AggregateFunctionNode,
  ): AggregateFunctionNode {
    return requireAllProps({
      kind: 'AggregateFunctionNode',
      aggregated: this.transformNodeList(node.aggregated),
      distinct: node.distinct,
      filter: this.transformNode(node.filter),
      func: node.func,
      over: this.transformNode(node.over),
    })
  }

  protected transformOver(node: OverNode): OverNode {
    return requireAllProps({
      kind: 'OverNode',
      orderBy: this.transformNode(node.orderBy),
      partitionBy: this.transformNode(node.partitionBy),
    })
  }

  protected transformPartitionBy(node: PartitionByNode): PartitionByNode {
    return requireAllProps({
      kind: 'PartitionByNode',
      items: this.transformNodeList(node.items),
    })
  }

  protected transformPartitionByItem(
    node: PartitionByItemNode,
  ): PartitionByItemNode {
    return requireAllProps({
      kind: 'PartitionByItemNode',
      partitionBy: this.transformNode(node.partitionBy),
    })
  }

  protected transformBinaryOperation(
    node: BinaryOperationNode,
  ): BinaryOperationNode {
    return requireAllProps<BinaryOperationNode>({
      kind: 'BinaryOperationNode',
      leftOperand: this.transformNode(node.leftOperand),
      operator: this.transformNode(node.operator),
      rightOperand: this.transformNode(node.rightOperand),
    })
  }

  protected transformUnaryOperation(
    node: UnaryOperationNode,
  ): UnaryOperationNode {
    return requireAllProps<UnaryOperationNode>({
      kind: 'UnaryOperationNode',
      operator: this.transformNode(node.operator),
      operand: this.transformNode(node.operand),
    })
  }

  protected transformUsing(node: UsingNode): UsingNode {
    return requireAllProps<UsingNode>({
      kind: 'UsingNode',
      tables: this.transformNodeList(node.tables),
    })
  }

  protected transformFunction(node: FunctionNode): FunctionNode {
    return requireAllProps<FunctionNode>({
      kind: 'FunctionNode',
      func: node.func,
      arguments: this.transformNodeList(node.arguments),
    })
  }

  protected transformCase(node: CaseNode): CaseNode {
    return requireAllProps<CaseNode>({
      kind: 'CaseNode',
      value: this.transformNode(node.value),
      when: this.transformNodeList(node.when),
      else: this.transformNode(node.else),
      isStatement: node.isStatement,
    })
  }

  protected transformWhen(node: WhenNode): WhenNode {
    return requireAllProps<WhenNode>({
      kind: 'WhenNode',
      condition: this.transformNode(node.condition),
      result: this.transformNode(node.result),
    })
  }

  protected transformJSONReference(node: JSONReferenceNode): JSONReferenceNode {
    return requireAllProps<JSONReferenceNode>({
      kind: 'JSONReferenceNode',
      reference: this.transformNode(node.reference),
      traversal: this.transformNode(node.traversal),
    })
  }

  protected transformJSONPath(node: JSONPathNode): JSONPathNode {
    return requireAllProps<JSONPathNode>({
      kind: 'JSONPathNode',
      inOperator: this.transformNode(node.inOperator),
      pathLegs: this.transformNodeList(node.pathLegs),
    })
  }

  protected transformJSONPathLeg(node: JSONPathLegNode): JSONPathLegNode {
    return requireAllProps<JSONPathLegNode>({
      kind: 'JSONPathLegNode',
      type: node.type,
      value: node.value,
    })
  }

  protected transformJSONOperatorChain(
    node: JSONOperatorChainNode,
  ): JSONOperatorChainNode {
    return requireAllProps<JSONOperatorChainNode>({
      kind: 'JSONOperatorChainNode',
      operator: this.transformNode(node.operator),
      values: this.transformNodeList(node.values),
    })
  }

  protected transformTuple(node: TupleNode): TupleNode {
    return requireAllProps<TupleNode>({
      kind: 'TupleNode',
      values: this.transformNodeList(node.values),
    })
  }

  protected transformMergeQuery(node: MergeQueryNode): MergeQueryNode {
    return requireAllProps<MergeQueryNode>({
      kind: 'MergeQueryNode',
      into: this.transformNode(node.into),
      using: this.transformNode(node.using),
      whens: this.transformNodeList(node.whens),
      with: this.transformNode(node.with),
      top: this.transformNode(node.top),
      endModifiers: this.transformNodeList(node.endModifiers),
      output: this.transformNode(node.output),
    })
  }

  protected transformMatched(node: MatchedNode): MatchedNode {
    return requireAllProps<MatchedNode>({
      kind: 'MatchedNode',
      not: node.not,
      bySource: node.bySource,
    })
  }

  protected transformAddIndex(node: AddIndexNode): AddIndexNode {
    return requireAllProps<AddIndexNode>({
      kind: 'AddIndexNode',
      name: this.transformNode(node.name),
      columns: this.transformNodeList(node.columns),
      unique: node.unique,
      using: this.transformNode(node.using),
      ifNotExists: node.ifNotExists,
    })
  }

  protected transformCast(node: CastNode): CastNode {
    return requireAllProps<CastNode>({
      kind: 'CastNode',
      expression: this.transformNode(node.expression),
      dataType: this.transformNode(node.dataType),
    })
  }

  protected transformFetch(node: FetchNode): FetchNode {
    return requireAllProps<FetchNode>({
      kind: 'FetchNode',
      rowCount: this.transformNode(node.rowCount),
      modifier: node.modifier,
    })
  }

  protected transformTop(node: TopNode): TopNode {
    return requireAllProps<TopNode>({
      kind: 'TopNode',
      expression: node.expression,
      modifiers: node.modifiers,
    })
  }

  protected transformOutput(node: OutputNode): OutputNode {
    return requireAllProps<OutputNode>({
      kind: 'OutputNode',
      selections: this.transformNodeList(node.selections),
    })
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
    node: PrimitiveValueListNode,
  ): PrimitiveValueListNode {
    // An Object.freezed leaf node. No need to clone.
    return node
  }

  protected transformOperator(node: OperatorNode): OperatorNode {
    // An Object.freezed leaf node. No need to clone.
    return node
  }

  protected transformDefaultInsertValue(
    node: DefaultInsertValueNode,
  ): DefaultInsertValueNode {
    // An Object.freezed leaf node. No need to clone.
    return node
  }
}
