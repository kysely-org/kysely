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
import { PrimaryKeyConstraintNode } from './primary-key-constraint-node.js'
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
import { OrActionNode } from './or-action-node.js'
import { CollateNode } from './collate-node.js'
import { QueryId } from '../util/query-id.js'
import { RenameConstraintNode } from './rename-constraint-node.js'
import { AddIndexTableNode } from './add-index-table-node.js'

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
 * import { type IdentifierNode, OperationNodeTransformer } from 'kysely'
 * import snakeCase from 'lodash/snakeCase'
 *
 * class CamelCaseTransformer extends OperationNodeTransformer {
 *   override transformIdentifier(node: IdentifierNode): IdentifierNode {
 *     node = super.transformIdentifier(node)
 *
 *     return {
 *       ...node,
 *       name: snakeCase(node.name),
 *     }
 *   }
 * }
 *
 * const transformer = new CamelCaseTransformer()
 *
 * const query = db.selectFrom('person').select(['first_name', 'last_name'])
 *
 * const tree = transformer.transformNode(query.toOperationNode())
 * ```
 */
export class OperationNodeTransformer {
  protected readonly nodeStack: OperationNode[] = []

  readonly #transformers: Record<
    OperationNodeKind,
    // TODO: make `queryId` required in v0.29 ?
    (node: any, queryId?: QueryId) => any
  > = freeze({
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
    RenameConstraintNode: this.transformRenameConstraint.bind(this),
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
    OrActionNode: this.transformOrAction.bind(this),
    CollateNode: this.transformCollate.bind(this),
    AddIndexTableNode: this.transformAddIndexTable.bind(this),
  })

  transformNode<T extends OperationNode | undefined>(
    node: T,
    queryId?: QueryId,
  ): T {
    if (!node) {
      return node
    }

    this.nodeStack.push(node)
    const out = this.transformNodeImpl(node, queryId)
    this.nodeStack.pop()

    return freeze(out) as T
  }

  protected transformNodeImpl<T extends OperationNode>(
    node: T,
    queryId?: QueryId,
  ): T {
    return this.#transformers[node.kind](node, queryId)
  }

  protected transformNodeList<
    T extends ReadonlyArray<OperationNode> | undefined,
  >(list: T, queryId?: QueryId): T {
    if (!list) {
      return list
    }

    return freeze(list.map((node) => this.transformNode(node, queryId))) as T
  }

  protected transformSelectQuery(
    node: SelectQueryNode,
    queryId?: QueryId,
  ): SelectQueryNode {
    return requireAllProps<SelectQueryNode>({
      kind: 'SelectQueryNode',
      from: this.transformNode(node.from, queryId),
      selections: this.transformNodeList(node.selections, queryId),
      distinctOn: this.transformNodeList(node.distinctOn, queryId),
      joins: this.transformNodeList(node.joins, queryId),
      groupBy: this.transformNode(node.groupBy, queryId),
      orderBy: this.transformNode(node.orderBy, queryId),
      where: this.transformNode(node.where, queryId),
      frontModifiers: this.transformNodeList(node.frontModifiers, queryId),
      endModifiers: this.transformNodeList(node.endModifiers, queryId),
      limit: this.transformNode(node.limit, queryId),
      offset: this.transformNode(node.offset, queryId),
      with: this.transformNode(node.with, queryId),
      having: this.transformNode(node.having, queryId),
      explain: this.transformNode(node.explain, queryId),
      setOperations: this.transformNodeList(node.setOperations, queryId),
      fetch: this.transformNode(node.fetch, queryId),
      top: this.transformNode(node.top, queryId),
    })
  }

  protected transformSelection(
    node: SelectionNode,
    queryId?: QueryId,
  ): SelectionNode {
    return requireAllProps<SelectionNode>({
      kind: 'SelectionNode',
      selection: this.transformNode(node.selection, queryId),
    })
  }

  protected transformColumn(node: ColumnNode, queryId?: QueryId): ColumnNode {
    return requireAllProps<ColumnNode>({
      kind: 'ColumnNode',
      column: this.transformNode(node.column, queryId),
    })
  }

  protected transformAlias(node: AliasNode, queryId?: QueryId): AliasNode {
    return requireAllProps<AliasNode>({
      kind: 'AliasNode',
      node: this.transformNode(node.node, queryId),
      alias: this.transformNode(node.alias, queryId),
    })
  }

  protected transformTable(node: TableNode, queryId?: QueryId): TableNode {
    return requireAllProps<TableNode>({
      kind: 'TableNode',
      table: this.transformNode(node.table, queryId),
    })
  }

  protected transformFrom(node: FromNode, queryId?: QueryId): FromNode {
    return requireAllProps<FromNode>({
      kind: 'FromNode',
      froms: this.transformNodeList(node.froms, queryId),
    })
  }

  protected transformReference(
    node: ReferenceNode,
    queryId?: QueryId,
  ): ReferenceNode {
    return requireAllProps<ReferenceNode>({
      kind: 'ReferenceNode',
      column: this.transformNode(node.column, queryId),
      table: this.transformNode(node.table, queryId),
    })
  }

  protected transformAnd(node: AndNode, queryId?: QueryId): AndNode {
    return requireAllProps<AndNode>({
      kind: 'AndNode',
      left: this.transformNode(node.left, queryId),
      right: this.transformNode(node.right, queryId),
    })
  }

  protected transformOr(node: OrNode, queryId?: QueryId): OrNode {
    return requireAllProps<OrNode>({
      kind: 'OrNode',
      left: this.transformNode(node.left, queryId),
      right: this.transformNode(node.right, queryId),
    })
  }

  protected transformValueList(
    node: ValueListNode,
    queryId?: QueryId,
  ): ValueListNode {
    return requireAllProps<ValueListNode>({
      kind: 'ValueListNode',
      values: this.transformNodeList(node.values, queryId),
    })
  }

  protected transformParens(node: ParensNode, queryId?: QueryId): ParensNode {
    return requireAllProps<ParensNode>({
      kind: 'ParensNode',
      node: this.transformNode(node.node, queryId),
    })
  }

  protected transformJoin(node: JoinNode, queryId?: QueryId): JoinNode {
    return requireAllProps<JoinNode>({
      kind: 'JoinNode',
      joinType: node.joinType,
      table: this.transformNode(node.table, queryId),
      on: this.transformNode(node.on, queryId),
    })
  }

  protected transformRaw(node: RawNode, queryId?: QueryId): RawNode {
    return requireAllProps<RawNode>({
      kind: 'RawNode',
      sqlFragments: freeze([...node.sqlFragments]),
      parameters: this.transformNodeList(node.parameters, queryId),
    })
  }

  protected transformWhere(node: WhereNode, queryId?: QueryId): WhereNode {
    return requireAllProps<WhereNode>({
      kind: 'WhereNode',
      where: this.transformNode(node.where, queryId),
    })
  }

  protected transformInsertQuery(
    node: InsertQueryNode,
    queryId?: QueryId,
  ): InsertQueryNode {
    return requireAllProps<InsertQueryNode>({
      kind: 'InsertQueryNode',
      into: this.transformNode(node.into, queryId),
      columns: this.transformNodeList(node.columns, queryId),
      values: this.transformNode(node.values, queryId),
      returning: this.transformNode(node.returning, queryId),
      onConflict: this.transformNode(node.onConflict, queryId),
      onDuplicateKey: this.transformNode(node.onDuplicateKey, queryId),
      endModifiers: this.transformNodeList(node.endModifiers, queryId),
      with: this.transformNode(node.with, queryId),
      ignore: node.ignore,
      orAction: this.transformNode(node.orAction, queryId),
      replace: node.replace,
      explain: this.transformNode(node.explain, queryId),
      defaultValues: node.defaultValues,
      top: this.transformNode(node.top, queryId),
      output: this.transformNode(node.output, queryId),
    })
  }

  protected transformValues(node: ValuesNode, queryId?: QueryId): ValuesNode {
    return requireAllProps<ValuesNode>({
      kind: 'ValuesNode',
      values: this.transformNodeList(node.values, queryId),
    })
  }

  protected transformDeleteQuery(
    node: DeleteQueryNode,
    queryId?: QueryId,
  ): DeleteQueryNode {
    return requireAllProps<DeleteQueryNode>({
      kind: 'DeleteQueryNode',
      from: this.transformNode(node.from, queryId),
      using: this.transformNode(node.using, queryId),
      joins: this.transformNodeList(node.joins, queryId),
      where: this.transformNode(node.where, queryId),
      returning: this.transformNode(node.returning, queryId),
      endModifiers: this.transformNodeList(node.endModifiers, queryId),
      with: this.transformNode(node.with, queryId),
      orderBy: this.transformNode(node.orderBy, queryId),
      limit: this.transformNode(node.limit, queryId),
      explain: this.transformNode(node.explain, queryId),
      top: this.transformNode(node.top, queryId),
      output: this.transformNode(node.output, queryId),
    })
  }

  protected transformReturning(
    node: ReturningNode,
    queryId?: QueryId,
  ): ReturningNode {
    return requireAllProps<ReturningNode>({
      kind: 'ReturningNode',
      selections: this.transformNodeList(node.selections, queryId),
    })
  }

  protected transformCreateTable(
    node: CreateTableNode,
    queryId?: QueryId,
  ): CreateTableNode {
    return requireAllProps<CreateTableNode>({
      kind: 'CreateTableNode',
      table: this.transformNode(node.table, queryId),
      columns: this.transformNodeList(node.columns, queryId),
      constraints: this.transformNodeList(node.constraints, queryId),
      temporary: node.temporary,
      ifNotExists: node.ifNotExists,
      onCommit: node.onCommit,
      frontModifiers: this.transformNodeList(node.frontModifiers, queryId),
      endModifiers: this.transformNodeList(node.endModifiers, queryId),
      selectQuery: this.transformNode(node.selectQuery, queryId),
      addIndexTable: this.transformNodeList(node.addIndexTable),
    })
  }

  protected transformColumnDefinition(
    node: ColumnDefinitionNode,
    queryId?: QueryId,
  ): ColumnDefinitionNode {
    return requireAllProps<ColumnDefinitionNode>({
      kind: 'ColumnDefinitionNode',
      column: this.transformNode(node.column, queryId),
      dataType: this.transformNode(node.dataType, queryId),
      references: this.transformNode(node.references, queryId),
      primaryKey: node.primaryKey,
      autoIncrement: node.autoIncrement,
      unique: node.unique,
      notNull: node.notNull,
      unsigned: node.unsigned,
      defaultTo: this.transformNode(node.defaultTo, queryId),
      check: this.transformNode(node.check, queryId),
      generated: this.transformNode(node.generated, queryId),
      frontModifiers: this.transformNodeList(node.frontModifiers, queryId),
      endModifiers: this.transformNodeList(node.endModifiers, queryId),
      nullsNotDistinct: node.nullsNotDistinct,
      identity: node.identity,
      ifNotExists: node.ifNotExists,
    })
  }

  protected transformAddColumn(
    node: AddColumnNode,
    queryId?: QueryId,
  ): AddColumnNode {
    return requireAllProps<AddColumnNode>({
      kind: 'AddColumnNode',
      column: this.transformNode(node.column, queryId),
    })
  }

  protected transformDropTable(
    node: DropTableNode,
    queryId?: QueryId,
  ): DropTableNode {
    return requireAllProps<DropTableNode>({
      kind: 'DropTableNode',
      table: this.transformNode(node.table, queryId),
      ifExists: node.ifExists,
      cascade: node.cascade,
      temporary: node.temporary,
    })
  }

  protected transformOrderBy(
    node: OrderByNode,
    queryId?: QueryId,
  ): OrderByNode {
    return requireAllProps<OrderByNode>({
      kind: 'OrderByNode',
      items: this.transformNodeList(node.items, queryId),
    })
  }

  protected transformOrderByItem(
    node: OrderByItemNode,
    queryId?: QueryId,
  ): OrderByItemNode {
    return requireAllProps<OrderByItemNode>({
      kind: 'OrderByItemNode',
      orderBy: this.transformNode(node.orderBy, queryId),
      direction: this.transformNode(node.direction, queryId),
      collation: this.transformNode(node.collation, queryId),
      nulls: node.nulls,
    })
  }

  protected transformGroupBy(
    node: GroupByNode,
    queryId?: QueryId,
  ): GroupByNode {
    return requireAllProps<GroupByNode>({
      kind: 'GroupByNode',
      items: this.transformNodeList(node.items, queryId),
    })
  }

  protected transformGroupByItem(
    node: GroupByItemNode,
    queryId?: QueryId,
  ): GroupByItemNode {
    return requireAllProps<GroupByItemNode>({
      kind: 'GroupByItemNode',
      groupBy: this.transformNode(node.groupBy, queryId),
    })
  }

  protected transformUpdateQuery(
    node: UpdateQueryNode,
    queryId?: QueryId,
  ): UpdateQueryNode {
    return requireAllProps<UpdateQueryNode>({
      kind: 'UpdateQueryNode',
      table: this.transformNode(node.table, queryId),
      from: this.transformNode(node.from, queryId),
      joins: this.transformNodeList(node.joins, queryId),
      where: this.transformNode(node.where, queryId),
      updates: this.transformNodeList(node.updates, queryId),
      returning: this.transformNode(node.returning, queryId),
      endModifiers: this.transformNodeList(node.endModifiers, queryId),
      with: this.transformNode(node.with, queryId),
      explain: this.transformNode(node.explain, queryId),
      limit: this.transformNode(node.limit, queryId),
      top: this.transformNode(node.top, queryId),
      output: this.transformNode(node.output, queryId),
      orderBy: this.transformNode(node.orderBy, queryId),
    })
  }

  protected transformColumnUpdate(
    node: ColumnUpdateNode,
    queryId?: QueryId,
  ): ColumnUpdateNode {
    return requireAllProps<ColumnUpdateNode>({
      kind: 'ColumnUpdateNode',
      column: this.transformNode(node.column, queryId),
      value: this.transformNode(node.value, queryId),
    })
  }

  protected transformLimit(node: LimitNode, queryId?: QueryId): LimitNode {
    return requireAllProps<LimitNode>({
      kind: 'LimitNode',
      limit: this.transformNode(node.limit, queryId),
    })
  }

  protected transformOffset(node: OffsetNode, queryId?: QueryId): OffsetNode {
    return requireAllProps<OffsetNode>({
      kind: 'OffsetNode',
      offset: this.transformNode(node.offset, queryId),
    })
  }

  protected transformOnConflict(
    node: OnConflictNode,
    queryId?: QueryId,
  ): OnConflictNode {
    return requireAllProps<OnConflictNode>({
      kind: 'OnConflictNode',
      columns: this.transformNodeList(node.columns, queryId),
      constraint: this.transformNode(node.constraint, queryId),
      indexExpression: this.transformNode(node.indexExpression, queryId),
      indexWhere: this.transformNode(node.indexWhere, queryId),
      updates: this.transformNodeList(node.updates, queryId),
      updateWhere: this.transformNode(node.updateWhere, queryId),
      doNothing: node.doNothing,
    })
  }

  protected transformOnDuplicateKey(
    node: OnDuplicateKeyNode,
    queryId?: QueryId,
  ): OnDuplicateKeyNode {
    return requireAllProps<OnDuplicateKeyNode>({
      kind: 'OnDuplicateKeyNode',
      updates: this.transformNodeList(node.updates, queryId),
    })
  }

  protected transformCreateIndex(
    node: CreateIndexNode,
    queryId?: QueryId,
  ): CreateIndexNode {
    return requireAllProps<CreateIndexNode>({
      kind: 'CreateIndexNode',
      name: this.transformNode(node.name, queryId),
      table: this.transformNode(node.table, queryId),
      columns: this.transformNodeList(node.columns, queryId),
      unique: node.unique,
      using: this.transformNode(node.using, queryId),
      ifNotExists: node.ifNotExists,
      where: this.transformNode(node.where, queryId),
      nullsNotDistinct: node.nullsNotDistinct,
    })
  }

  protected transformList(node: ListNode, queryId?: QueryId): ListNode {
    return requireAllProps<ListNode>({
      kind: 'ListNode',
      items: this.transformNodeList(node.items, queryId),
    })
  }

  protected transformDropIndex(
    node: DropIndexNode,
    queryId?: QueryId,
  ): DropIndexNode {
    return requireAllProps<DropIndexNode>({
      kind: 'DropIndexNode',
      name: this.transformNode(node.name, queryId),
      table: this.transformNode(node.table, queryId),
      ifExists: node.ifExists,
      cascade: node.cascade,
    })
  }

  protected transformPrimaryKeyConstraint(
    node: PrimaryKeyConstraintNode,
    queryId?: QueryId,
  ): PrimaryKeyConstraintNode {
    return requireAllProps<PrimaryKeyConstraintNode>({
      kind: 'PrimaryKeyConstraintNode',
      columns: this.transformNodeList(node.columns, queryId),
      name: this.transformNode(node.name, queryId),
      deferrable: node.deferrable,
      initiallyDeferred: node.initiallyDeferred,
    })
  }

  protected transformUniqueConstraint(
    node: UniqueConstraintNode,
    queryId?: QueryId,
  ): UniqueConstraintNode {
    return requireAllProps<UniqueConstraintNode>({
      kind: 'UniqueConstraintNode',
      columns: this.transformNodeList(node.columns, queryId),
      name: this.transformNode(node.name, queryId),
      nullsNotDistinct: node.nullsNotDistinct,
      deferrable: node.deferrable,
      initiallyDeferred: node.initiallyDeferred,
    })
  }

  protected transformAddIndexTable(node: AddIndexTableNode): AddIndexTableNode {
    return requireAllProps<AddIndexTableNode>({
      kind: 'AddIndexTableNode',
      columns: this.transformNodeList(node.columns),
      name: this.transformNode(node.name),
    })
  }

  protected transformForeignKeyConstraint(
    node: ForeignKeyConstraintNode,
    queryId?: QueryId,
  ): ForeignKeyConstraintNode {
    return requireAllProps<ForeignKeyConstraintNode>({
      kind: 'ForeignKeyConstraintNode',
      columns: this.transformNodeList(node.columns, queryId),
      references: this.transformNode(node.references, queryId),
      name: this.transformNode(node.name, queryId),
      onDelete: node.onDelete,
      onUpdate: node.onUpdate,
      deferrable: node.deferrable,
      initiallyDeferred: node.initiallyDeferred,
    })
  }

  protected transformSetOperation(
    node: SetOperationNode,
    queryId?: QueryId,
  ): SetOperationNode {
    return requireAllProps<SetOperationNode>({
      kind: 'SetOperationNode',
      operator: node.operator,
      expression: this.transformNode(node.expression, queryId),
      all: node.all,
    })
  }

  protected transformReferences(
    node: ReferencesNode,
    queryId?: QueryId,
  ): ReferencesNode {
    return requireAllProps<ReferencesNode>({
      kind: 'ReferencesNode',
      table: this.transformNode(node.table, queryId),
      columns: this.transformNodeList(node.columns, queryId),
      onDelete: node.onDelete,
      onUpdate: node.onUpdate,
    })
  }

  protected transformCheckConstraint(
    node: CheckConstraintNode,
    queryId?: QueryId,
  ): CheckConstraintNode {
    return requireAllProps<CheckConstraintNode>({
      kind: 'CheckConstraintNode',
      expression: this.transformNode(node.expression, queryId),
      name: this.transformNode(node.name, queryId),
    })
  }

  protected transformWith(node: WithNode, queryId?: QueryId): WithNode {
    return requireAllProps<WithNode>({
      kind: 'WithNode',
      expressions: this.transformNodeList(node.expressions, queryId),
      recursive: node.recursive,
    })
  }

  protected transformCommonTableExpression(
    node: CommonTableExpressionNode,
    queryId?: QueryId,
  ): CommonTableExpressionNode {
    return requireAllProps<CommonTableExpressionNode>({
      kind: 'CommonTableExpressionNode',
      name: this.transformNode(node.name, queryId),
      materialized: node.materialized,
      expression: this.transformNode(node.expression, queryId),
    })
  }

  protected transformCommonTableExpressionName(
    node: CommonTableExpressionNameNode,
    queryId?: QueryId,
  ): CommonTableExpressionNameNode {
    return requireAllProps<CommonTableExpressionNameNode>({
      kind: 'CommonTableExpressionNameNode',
      table: this.transformNode(node.table, queryId),
      columns: this.transformNodeList(node.columns, queryId),
    })
  }

  protected transformHaving(node: HavingNode, queryId?: QueryId): HavingNode {
    return requireAllProps<HavingNode>({
      kind: 'HavingNode',
      having: this.transformNode(node.having, queryId),
    })
  }

  protected transformCreateSchema(
    node: CreateSchemaNode,
    queryId?: QueryId,
  ): CreateSchemaNode {
    return requireAllProps<CreateSchemaNode>({
      kind: 'CreateSchemaNode',
      schema: this.transformNode(node.schema, queryId),
      ifNotExists: node.ifNotExists,
    })
  }

  protected transformDropSchema(
    node: DropSchemaNode,
    queryId?: QueryId,
  ): DropSchemaNode {
    return requireAllProps<DropSchemaNode>({
      kind: 'DropSchemaNode',
      schema: this.transformNode(node.schema, queryId),
      ifExists: node.ifExists,
      cascade: node.cascade,
    })
  }

  protected transformAlterTable(
    node: AlterTableNode,
    queryId?: QueryId,
  ): AlterTableNode {
    return requireAllProps<AlterTableNode>({
      kind: 'AlterTableNode',
      table: this.transformNode(node.table, queryId),
      renameTo: this.transformNode(node.renameTo, queryId),
      setSchema: this.transformNode(node.setSchema, queryId),
      columnAlterations: this.transformNodeList(
        node.columnAlterations,
        queryId,
      ),
      addConstraint: this.transformNode(node.addConstraint, queryId),
      dropConstraint: this.transformNode(node.dropConstraint, queryId),
      renameConstraint: this.transformNode(node.renameConstraint, queryId),
      addIndex: this.transformNode(node.addIndex, queryId),
      dropIndex: this.transformNode(node.dropIndex, queryId),
    })
  }

  protected transformDropColumn(
    node: DropColumnNode,
    queryId?: QueryId,
  ): DropColumnNode {
    return requireAllProps<DropColumnNode>({
      kind: 'DropColumnNode',
      column: this.transformNode(node.column, queryId),
    })
  }

  protected transformRenameColumn(
    node: RenameColumnNode,
    queryId?: QueryId,
  ): RenameColumnNode {
    return requireAllProps<RenameColumnNode>({
      kind: 'RenameColumnNode',
      column: this.transformNode(node.column, queryId),
      renameTo: this.transformNode(node.renameTo, queryId),
    })
  }

  protected transformAlterColumn(
    node: AlterColumnNode,
    queryId?: QueryId,
  ): AlterColumnNode {
    return requireAllProps<AlterColumnNode>({
      kind: 'AlterColumnNode',
      column: this.transformNode(node.column, queryId),
      dataType: this.transformNode(node.dataType, queryId),
      dataTypeExpression: this.transformNode(node.dataTypeExpression, queryId),
      setDefault: this.transformNode(node.setDefault, queryId),
      dropDefault: node.dropDefault,
      setNotNull: node.setNotNull,
      dropNotNull: node.dropNotNull,
    })
  }

  protected transformModifyColumn(
    node: ModifyColumnNode,
    queryId?: QueryId,
  ): ModifyColumnNode {
    return requireAllProps<ModifyColumnNode>({
      kind: 'ModifyColumnNode',
      column: this.transformNode(node.column, queryId),
    })
  }

  protected transformAddConstraint(
    node: AddConstraintNode,
    queryId?: QueryId,
  ): AddConstraintNode {
    return requireAllProps<AddConstraintNode>({
      kind: 'AddConstraintNode',
      constraint: this.transformNode(node.constraint, queryId),
    })
  }

  protected transformDropConstraint(
    node: DropConstraintNode,
    queryId?: QueryId,
  ): DropConstraintNode {
    return requireAllProps<DropConstraintNode>({
      kind: 'DropConstraintNode',
      constraintName: this.transformNode(node.constraintName, queryId),
      ifExists: node.ifExists,
      modifier: node.modifier,
    })
  }

  protected transformRenameConstraint(
    node: RenameConstraintNode,
    queryId?: QueryId,
  ): RenameConstraintNode {
    return requireAllProps<RenameConstraintNode>({
      kind: 'RenameConstraintNode',
      oldName: this.transformNode(node.oldName, queryId),
      newName: this.transformNode(node.newName, queryId),
    })
  }

  protected transformCreateView(
    node: CreateViewNode,
    queryId?: QueryId,
  ): CreateViewNode {
    return requireAllProps<CreateViewNode>({
      kind: 'CreateViewNode',
      name: this.transformNode(node.name, queryId),
      temporary: node.temporary,
      orReplace: node.orReplace,
      ifNotExists: node.ifNotExists,
      materialized: node.materialized,
      columns: this.transformNodeList(node.columns, queryId),
      as: this.transformNode(node.as, queryId),
    })
  }

  protected transformRefreshMaterializedView(
    node: RefreshMaterializedViewNode,
    queryId?: QueryId,
  ): RefreshMaterializedViewNode {
    return requireAllProps<RefreshMaterializedViewNode>({
      kind: 'RefreshMaterializedViewNode',
      name: this.transformNode(node.name, queryId),
      concurrently: node.concurrently,
      withNoData: node.withNoData,
    })
  }

  protected transformDropView(
    node: DropViewNode,
    queryId?: QueryId,
  ): DropViewNode {
    return requireAllProps<DropViewNode>({
      kind: 'DropViewNode',
      name: this.transformNode(node.name, queryId),
      ifExists: node.ifExists,
      materialized: node.materialized,
      cascade: node.cascade,
    })
  }

  protected transformGenerated(
    node: GeneratedNode,
    queryId?: QueryId,
  ): GeneratedNode {
    return requireAllProps<GeneratedNode>({
      kind: 'GeneratedNode',
      byDefault: node.byDefault,
      always: node.always,
      identity: node.identity,
      stored: node.stored,
      expression: this.transformNode(node.expression, queryId),
    })
  }

  protected transformDefaultValue(
    node: DefaultValueNode,
    queryId?: QueryId,
  ): DefaultValueNode {
    return requireAllProps<DefaultValueNode>({
      kind: 'DefaultValueNode',
      defaultValue: this.transformNode(node.defaultValue, queryId),
    })
  }

  protected transformOn(node: OnNode, queryId?: QueryId): OnNode {
    return requireAllProps<OnNode>({
      kind: 'OnNode',
      on: this.transformNode(node.on, queryId),
    })
  }

  protected transformSelectModifier(
    node: SelectModifierNode,
    queryId?: QueryId,
  ): SelectModifierNode {
    return requireAllProps<SelectModifierNode>({
      kind: 'SelectModifierNode',
      modifier: node.modifier,
      rawModifier: this.transformNode(node.rawModifier, queryId),
      of: this.transformNodeList(node.of, queryId),
    })
  }

  protected transformCreateType(
    node: CreateTypeNode,
    queryId?: QueryId,
  ): CreateTypeNode {
    return requireAllProps<CreateTypeNode>({
      kind: 'CreateTypeNode',
      name: this.transformNode(node.name, queryId),
      enum: this.transformNode(node.enum, queryId),
    })
  }

  protected transformDropType(
    node: DropTypeNode,
    queryId?: QueryId,
  ): DropTypeNode {
    return requireAllProps<DropTypeNode>({
      kind: 'DropTypeNode',
      name: this.transformNode(node.name, queryId),
      additionalNames: this.transformNodeList(node.additionalNames, queryId),
      cascade: node.cascade,
      ifExists: node.ifExists,
    })
  }

  protected transformExplain(
    node: ExplainNode,
    queryId?: QueryId,
  ): ExplainNode {
    return requireAllProps({
      kind: 'ExplainNode',
      format: node.format,
      options: this.transformNode(node.options, queryId),
    })
  }

  protected transformSchemableIdentifier(
    node: SchemableIdentifierNode,
    queryId?: QueryId,
  ): SchemableIdentifierNode {
    return requireAllProps<SchemableIdentifierNode>({
      kind: 'SchemableIdentifierNode',
      schema: this.transformNode(node.schema, queryId),
      identifier: this.transformNode(node.identifier, queryId),
    })
  }

  protected transformAggregateFunction(
    node: AggregateFunctionNode,
    queryId?: QueryId,
  ): AggregateFunctionNode {
    return requireAllProps({
      kind: 'AggregateFunctionNode',
      func: node.func,
      aggregated: this.transformNodeList(node.aggregated, queryId),
      distinct: node.distinct,
      orderBy: this.transformNode(node.orderBy, queryId),
      withinGroup: this.transformNode(node.withinGroup, queryId),
      filter: this.transformNode(node.filter, queryId),
      over: this.transformNode(node.over, queryId),
    })
  }

  protected transformOver(node: OverNode, queryId?: QueryId): OverNode {
    return requireAllProps({
      kind: 'OverNode',
      orderBy: this.transformNode(node.orderBy, queryId),
      partitionBy: this.transformNode(node.partitionBy, queryId),
    })
  }

  protected transformPartitionBy(
    node: PartitionByNode,
    queryId?: QueryId,
  ): PartitionByNode {
    return requireAllProps({
      kind: 'PartitionByNode',
      items: this.transformNodeList(node.items, queryId),
    })
  }

  protected transformPartitionByItem(
    node: PartitionByItemNode,
    queryId?: QueryId,
  ): PartitionByItemNode {
    return requireAllProps({
      kind: 'PartitionByItemNode',
      partitionBy: this.transformNode(node.partitionBy, queryId),
    })
  }

  protected transformBinaryOperation(
    node: BinaryOperationNode,
    queryId?: QueryId,
  ): BinaryOperationNode {
    return requireAllProps<BinaryOperationNode>({
      kind: 'BinaryOperationNode',
      leftOperand: this.transformNode(node.leftOperand, queryId),
      operator: this.transformNode(node.operator, queryId),
      rightOperand: this.transformNode(node.rightOperand, queryId),
    })
  }

  protected transformUnaryOperation(
    node: UnaryOperationNode,
    queryId?: QueryId,
  ): UnaryOperationNode {
    return requireAllProps<UnaryOperationNode>({
      kind: 'UnaryOperationNode',
      operator: this.transformNode(node.operator, queryId),
      operand: this.transformNode(node.operand, queryId),
    })
  }

  protected transformUsing(node: UsingNode, queryId?: QueryId): UsingNode {
    return requireAllProps<UsingNode>({
      kind: 'UsingNode',
      tables: this.transformNodeList(node.tables, queryId),
    })
  }

  protected transformFunction(
    node: FunctionNode,
    queryId?: QueryId,
  ): FunctionNode {
    return requireAllProps<FunctionNode>({
      kind: 'FunctionNode',
      func: node.func,
      arguments: this.transformNodeList(node.arguments, queryId),
    })
  }

  protected transformCase(node: CaseNode, queryId?: QueryId): CaseNode {
    return requireAllProps<CaseNode>({
      kind: 'CaseNode',
      value: this.transformNode(node.value, queryId),
      when: this.transformNodeList(node.when, queryId),
      else: this.transformNode(node.else, queryId),
      isStatement: node.isStatement,
    })
  }

  protected transformWhen(node: WhenNode, queryId?: QueryId): WhenNode {
    return requireAllProps<WhenNode>({
      kind: 'WhenNode',
      condition: this.transformNode(node.condition, queryId),
      result: this.transformNode(node.result, queryId),
    })
  }

  protected transformJSONReference(
    node: JSONReferenceNode,
    queryId?: QueryId,
  ): JSONReferenceNode {
    return requireAllProps<JSONReferenceNode>({
      kind: 'JSONReferenceNode',
      reference: this.transformNode(node.reference, queryId),
      traversal: this.transformNode(node.traversal, queryId),
    })
  }

  protected transformJSONPath(
    node: JSONPathNode,
    queryId?: QueryId,
  ): JSONPathNode {
    return requireAllProps<JSONPathNode>({
      kind: 'JSONPathNode',
      inOperator: this.transformNode(node.inOperator, queryId),
      pathLegs: this.transformNodeList(node.pathLegs, queryId),
    })
  }

  protected transformJSONPathLeg(
    node: JSONPathLegNode,
    _queryId?: QueryId,
  ): JSONPathLegNode {
    return requireAllProps<JSONPathLegNode>({
      kind: 'JSONPathLegNode',
      type: node.type,
      value: node.value,
    })
  }

  protected transformJSONOperatorChain(
    node: JSONOperatorChainNode,
    queryId?: QueryId,
  ): JSONOperatorChainNode {
    return requireAllProps<JSONOperatorChainNode>({
      kind: 'JSONOperatorChainNode',
      operator: this.transformNode(node.operator, queryId),
      values: this.transformNodeList(node.values, queryId),
    })
  }

  protected transformTuple(node: TupleNode, queryId?: QueryId): TupleNode {
    return requireAllProps<TupleNode>({
      kind: 'TupleNode',
      values: this.transformNodeList(node.values, queryId),
    })
  }

  protected transformMergeQuery(
    node: MergeQueryNode,
    queryId?: QueryId,
  ): MergeQueryNode {
    return requireAllProps<MergeQueryNode>({
      kind: 'MergeQueryNode',
      into: this.transformNode(node.into, queryId),
      using: this.transformNode(node.using, queryId),
      whens: this.transformNodeList(node.whens, queryId),
      with: this.transformNode(node.with, queryId),
      top: this.transformNode(node.top, queryId),
      endModifiers: this.transformNodeList(node.endModifiers, queryId),
      output: this.transformNode(node.output, queryId),
      returning: this.transformNode(node.returning, queryId),
    })
  }

  protected transformMatched(
    node: MatchedNode,
    _queryId?: QueryId,
  ): MatchedNode {
    return requireAllProps<MatchedNode>({
      kind: 'MatchedNode',
      not: node.not,
      bySource: node.bySource,
    })
  }

  protected transformAddIndex(
    node: AddIndexNode,
    queryId?: QueryId,
  ): AddIndexNode {
    return requireAllProps<AddIndexNode>({
      kind: 'AddIndexNode',
      name: this.transformNode(node.name, queryId),
      columns: this.transformNodeList(node.columns, queryId),
      unique: node.unique,
      using: this.transformNode(node.using, queryId),
      ifNotExists: node.ifNotExists,
    })
  }

  protected transformCast(node: CastNode, queryId?: QueryId): CastNode {
    return requireAllProps<CastNode>({
      kind: 'CastNode',
      expression: this.transformNode(node.expression, queryId),
      dataType: this.transformNode(node.dataType, queryId),
    })
  }

  protected transformFetch(node: FetchNode, queryId?: QueryId): FetchNode {
    return requireAllProps<FetchNode>({
      kind: 'FetchNode',
      rowCount: this.transformNode(node.rowCount, queryId),
      modifier: node.modifier,
    })
  }

  protected transformTop(node: TopNode, _queryId?: QueryId): TopNode {
    return requireAllProps<TopNode>({
      kind: 'TopNode',
      expression: node.expression,
      modifiers: node.modifiers,
    })
  }

  protected transformOutput(node: OutputNode, queryId?: QueryId): OutputNode {
    return requireAllProps<OutputNode>({
      kind: 'OutputNode',
      selections: this.transformNodeList(node.selections, queryId),
    })
  }

  protected transformDataType(
    node: DataTypeNode,
    _queryId?: QueryId,
  ): DataTypeNode {
    // An Object.freezed leaf node. No need to clone.
    return node
  }

  protected transformSelectAll(
    node: SelectAllNode,
    _queryId?: QueryId,
  ): SelectAllNode {
    // An Object.freezed leaf node. No need to clone.
    return node
  }

  protected transformIdentifier(
    node: IdentifierNode,
    _queryId?: QueryId,
  ): IdentifierNode {
    // An Object.freezed leaf node. No need to clone.
    return node
  }

  protected transformValue(node: ValueNode, _queryId?: QueryId): ValueNode {
    // An Object.freezed leaf node. No need to clone.
    return node
  }

  protected transformPrimitiveValueList(
    node: PrimitiveValueListNode,
    _queryId?: QueryId,
  ): PrimitiveValueListNode {
    // An Object.freezed leaf node. No need to clone.
    return node
  }

  protected transformOperator(
    node: OperatorNode,
    _queryId?: QueryId,
  ): OperatorNode {
    // An Object.freezed leaf node. No need to clone.
    return node
  }

  protected transformDefaultInsertValue(
    node: DefaultInsertValueNode,
    _queryId?: QueryId,
  ): DefaultInsertValueNode {
    // An Object.freezed leaf node. No need to clone.
    return node
  }

  protected transformOrAction(
    node: OrActionNode,
    _queryId?: QueryId,
  ): OrActionNode {
    // An Object.freezed leaf node. No need to clone.
    return node
  }

  protected transformCollate(
    node: CollateNode,
    _queryId?: QueryId,
  ): CollateNode {
    // An Object.freezed leaf node. No need to clone.
    return node
  }
}
