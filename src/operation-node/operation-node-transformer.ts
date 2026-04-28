import type { AliasNode } from './alias-node.js'
import type { ColumnNode } from './column-node.js'
import type { IdentifierNode } from './identifier-node.js'
import type { OperationNode, OperationNodeKind } from './operation-node.js'
import type { ReferenceNode } from './reference-node.js'
import type { SelectAllNode } from './select-all-node.js'
import type { SelectionNode } from './selection-node.js'
import type { TableNode } from './table-node.js'
import type { AndNode } from './and-node.js'
import type { JoinNode } from './join-node.js'
import type { OrNode } from './or-node.js'
import type { ParensNode } from './parens-node.js'
import type { PrimitiveValueListNode } from './primitive-value-list-node.js'
import type { RawNode } from './raw-node.js'
import type { SelectQueryNode } from './select-query-node.js'
import type { ValueListNode } from './value-list-node.js'
import type { ValueNode } from './value-node.js'
import type { OperatorNode } from './operator-node.js'
import type { FromNode } from './from-node.js'
import type { WhereNode } from './where-node.js'
import type { InsertQueryNode } from './insert-query-node.js'
import type { DeleteQueryNode } from './delete-query-node.js'
import type { ReturningNode } from './returning-node.js'
import type { CreateTableNode } from './create-table-node.js'
import type { AddColumnNode } from './add-column-node.js'
import type { DropTableNode } from './drop-table-node.js'
import type { DataTypeNode } from './data-type-node.js'
import type { OrderByNode } from './order-by-node.js'
import type { OrderByItemNode } from './order-by-item-node.js'
import type { GroupByNode } from './group-by-node.js'
import type { GroupByItemNode } from './group-by-item-node.js'
import type { UpdateQueryNode } from './update-query-node.js'
import type { ColumnUpdateNode } from './column-update-node.js'
import type { LimitNode } from './limit-node.js'
import type { OffsetNode } from './offset-node.js'
import type { OnConflictNode } from './on-conflict-node.js'
import type { CreateIndexNode } from './create-index-node.js'
import type { ListNode } from './list-node.js'
import type { DropIndexNode } from './drop-index-node.js'
import type { PrimaryKeyConstraintNode } from './primary-key-constraint-node.js'
import type { UniqueConstraintNode } from './unique-constraint-node.js'
import type { ReferencesNode } from './references-node.js'
import type { CheckConstraintNode } from './check-constraint-node.js'
import type { WithNode } from './with-node.js'
import type { CommonTableExpressionNode } from './common-table-expression-node.js'
import type { CommonTableExpressionNameNode } from './common-table-expression-name-node.js'
import type { HavingNode } from './having-node.js'
import { freeze } from '../util/object-utils.js'
import type { AllProps } from '../util/type-utils.js'
import type { CreateSchemaNode } from './create-schema-node.js'
import type { DropSchemaNode } from './drop-schema-node.js'
import type { AlterTableNode } from './alter-table-node.js'
import type { DropColumnNode } from './drop-column-node.js'
import type { RenameColumnNode } from './rename-column-node.js'
import type { AlterColumnNode } from './alter-column-node.js'
import type { AddConstraintNode } from './add-constraint-node.js'
import type { DropConstraintNode } from './drop-constraint-node.js'
import type { ForeignKeyConstraintNode } from './foreign-key-constraint-node.js'
import type { ColumnDefinitionNode } from './column-definition-node.js'
import type { ModifyColumnNode } from './modify-column-node.js'
import type { OnDuplicateKeyNode } from './on-duplicate-key-node.js'
import type { CreateViewNode } from './create-view-node.js'
import type { DropViewNode } from './drop-view-node.js'
import type { GeneratedNode } from './generated-node.js'
import type { DefaultValueNode } from './default-value-node.js'
import type { OnNode } from './on-node.js'
import type { ValuesNode } from './values-node.js'
import type { SelectModifierNode } from './select-modifier-node.js'
import type { CreateTypeNode } from './create-type-node.js'
import type { DropTypeNode } from './drop-type-node.js'
import type { ExplainNode } from './explain-node.js'
import type { SchemableIdentifierNode } from './schemable-identifier-node.js'
import type { DefaultInsertValueNode } from './default-insert-value-node.js'
import type { AggregateFunctionNode } from './aggregate-function-node.js'
import type { OverNode } from './over-node.js'
import type { PartitionByNode } from './partition-by-node.js'
import type { PartitionByItemNode } from './partition-by-item-node.js'
import type { SetOperationNode } from './set-operation-node.js'
import type { BinaryOperationNode } from './binary-operation-node.js'
import type { UnaryOperationNode } from './unary-operation-node.js'
import type { UsingNode } from './using-node.js'
import type { FunctionNode } from './function-node.js'
import type { CaseNode } from './case-node.js'
import type { WhenNode } from './when-node.js'
import type { JSONReferenceNode } from './json-reference-node.js'
import type { JSONPathNode } from './json-path-node.js'
import type { JSONPathLegNode } from './json-path-leg-node.js'
import type { JSONOperatorChainNode } from './json-operator-chain-node.js'
import type { TupleNode } from './tuple-node.js'
import type { MergeQueryNode } from './merge-query-node.js'
import type { MatchedNode } from './matched-node.js'
import type { AddIndexNode } from './add-index-node.js'
import type { CastNode } from './cast-node.js'
import type { FetchNode } from './fetch-node.js'
import type { TopNode } from './top-node.js'
import type { OutputNode } from './output-node.js'
import type { RefreshMaterializedViewNode } from './refresh-materialized-view-node.js'
import type { OrActionNode } from './or-action-node.js'
import type { CollateNode } from './collate-node.js'
import type { QueryId } from '../util/query-id.js'
import type { RenameConstraintNode } from './rename-constraint-node.js'
import type { AddValueNode } from './add-value-node.js'
import type { AlterTypeNode } from './alter-type-node.js'
import type { RenameValueNode } from './rename-value-node.js'

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
    AlterTypeNode: this.transformAlterType.bind(this),
    AddValueNode: this.transformAddValue.bind(this),
    RenameValueNode: this.transformRenameValue.bind(this),
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
    return {
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
    } satisfies AllProps<SelectQueryNode>
  }

  protected transformSelection(
    node: SelectionNode,
    queryId?: QueryId,
  ): SelectionNode {
    return {
      kind: 'SelectionNode',
      selection: this.transformNode(node.selection, queryId),
    } satisfies AllProps<SelectionNode>
  }

  protected transformColumn(node: ColumnNode, queryId?: QueryId): ColumnNode {
    return {
      kind: 'ColumnNode',
      column: this.transformNode(node.column, queryId),
    } satisfies AllProps<ColumnNode>
  }

  protected transformAlias(node: AliasNode, queryId?: QueryId): AliasNode {
    return {
      kind: 'AliasNode',
      node: this.transformNode(node.node, queryId),
      alias: this.transformNode(node.alias, queryId),
    } satisfies AllProps<AliasNode>
  }

  protected transformTable(node: TableNode, queryId?: QueryId): TableNode {
    return {
      kind: 'TableNode',
      table: this.transformNode(node.table, queryId),
    } satisfies AllProps<TableNode>
  }

  protected transformFrom(node: FromNode, queryId?: QueryId): FromNode {
    return {
      kind: 'FromNode',
      froms: this.transformNodeList(node.froms, queryId),
    } satisfies AllProps<FromNode>
  }

  protected transformReference(
    node: ReferenceNode,
    queryId?: QueryId,
  ): ReferenceNode {
    return {
      kind: 'ReferenceNode',
      column: this.transformNode(node.column, queryId),
      table: this.transformNode(node.table, queryId),
    } satisfies AllProps<ReferenceNode>
  }

  protected transformAnd(node: AndNode, queryId?: QueryId): AndNode {
    return {
      kind: 'AndNode',
      left: this.transformNode(node.left, queryId),
      right: this.transformNode(node.right, queryId),
    } satisfies AllProps<AndNode>
  }

  protected transformOr(node: OrNode, queryId?: QueryId): OrNode {
    return {
      kind: 'OrNode',
      left: this.transformNode(node.left, queryId),
      right: this.transformNode(node.right, queryId),
    } satisfies AllProps<OrNode>
  }

  protected transformValueList(
    node: ValueListNode,
    queryId?: QueryId,
  ): ValueListNode {
    return {
      kind: 'ValueListNode',
      values: this.transformNodeList(node.values, queryId),
    } satisfies AllProps<ValueListNode>
  }

  protected transformParens(node: ParensNode, queryId?: QueryId): ParensNode {
    return {
      kind: 'ParensNode',
      node: this.transformNode(node.node, queryId),
    } satisfies AllProps<ParensNode>
  }

  protected transformJoin(node: JoinNode, queryId?: QueryId): JoinNode {
    return {
      kind: 'JoinNode',
      joinType: node.joinType,
      table: this.transformNode(node.table, queryId),
      on: this.transformNode(node.on, queryId),
    } satisfies AllProps<JoinNode>
  }

  protected transformRaw(node: RawNode, queryId?: QueryId): RawNode {
    return {
      kind: 'RawNode',
      sqlFragments: freeze([...node.sqlFragments]),
      parameters: this.transformNodeList(node.parameters, queryId),
    } satisfies AllProps<RawNode>
  }

  protected transformWhere(node: WhereNode, queryId?: QueryId): WhereNode {
    return {
      kind: 'WhereNode',
      where: this.transformNode(node.where, queryId),
    } satisfies AllProps<WhereNode>
  }

  protected transformInsertQuery(
    node: InsertQueryNode,
    queryId?: QueryId,
  ): InsertQueryNode {
    return {
      kind: 'InsertQueryNode',
      into: this.transformNode(node.into, queryId),
      columns: this.transformNodeList(node.columns, queryId),
      values: this.transformNode(node.values, queryId),
      returning: this.transformNode(node.returning, queryId),
      onConflict: this.transformNode(node.onConflict, queryId),
      onDuplicateKey: this.transformNode(node.onDuplicateKey, queryId),
      endModifiers: this.transformNodeList(node.endModifiers, queryId),
      with: this.transformNode(node.with, queryId),
      orAction: this.transformNode(node.orAction, queryId),
      replace: node.replace,
      explain: this.transformNode(node.explain, queryId),
      defaultValues: node.defaultValues,
      top: this.transformNode(node.top, queryId),
      output: this.transformNode(node.output, queryId),
    } satisfies AllProps<InsertQueryNode>
  }

  protected transformValues(node: ValuesNode, queryId?: QueryId): ValuesNode {
    return {
      kind: 'ValuesNode',
      values: this.transformNodeList(node.values, queryId),
    } satisfies AllProps<ValuesNode>
  }

  protected transformDeleteQuery(
    node: DeleteQueryNode,
    queryId?: QueryId,
  ): DeleteQueryNode {
    return {
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
    } satisfies AllProps<DeleteQueryNode>
  }

  protected transformReturning(
    node: ReturningNode,
    queryId?: QueryId,
  ): ReturningNode {
    return {
      kind: 'ReturningNode',
      selections: this.transformNodeList(node.selections, queryId),
    } satisfies AllProps<ReturningNode>
  }

  protected transformCreateTable(
    node: CreateTableNode,
    queryId?: QueryId,
  ): CreateTableNode {
    return {
      kind: 'CreateTableNode',
      table: this.transformNode(node.table, queryId),
      columns: this.transformNodeList(node.columns, queryId),
      constraints: this.transformNodeList(node.constraints, queryId),
      indexes: this.transformNodeList(node.indexes, queryId),
      temporary: node.temporary,
      ifNotExists: node.ifNotExists,
      onCommit: node.onCommit,
      frontModifiers: this.transformNodeList(node.frontModifiers, queryId),
      endModifiers: this.transformNodeList(node.endModifiers, queryId),
      selectQuery: this.transformNode(node.selectQuery, queryId),
    } satisfies AllProps<CreateTableNode>
  }

  protected transformColumnDefinition(
    node: ColumnDefinitionNode,
    queryId?: QueryId,
  ): ColumnDefinitionNode {
    return {
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
    } satisfies AllProps<ColumnDefinitionNode>
  }

  protected transformAddColumn(
    node: AddColumnNode,
    queryId?: QueryId,
  ): AddColumnNode {
    return {
      kind: 'AddColumnNode',
      column: this.transformNode(node.column, queryId),
    } satisfies AllProps<AddColumnNode>
  }

  protected transformDropTable(
    node: DropTableNode,
    queryId?: QueryId,
  ): DropTableNode {
    return {
      kind: 'DropTableNode',
      table: this.transformNode(node.table, queryId),
      ifExists: node.ifExists,
      cascade: node.cascade,
      temporary: node.temporary,
    } satisfies AllProps<DropTableNode>
  }

  protected transformOrderBy(
    node: OrderByNode,
    queryId?: QueryId,
  ): OrderByNode {
    return {
      kind: 'OrderByNode',
      items: this.transformNodeList(node.items, queryId),
    } satisfies AllProps<OrderByNode>
  }

  protected transformOrderByItem(
    node: OrderByItemNode,
    queryId?: QueryId,
  ): OrderByItemNode {
    return {
      kind: 'OrderByItemNode',
      orderBy: this.transformNode(node.orderBy, queryId),
      direction: this.transformNode(node.direction, queryId),
      collation: this.transformNode(node.collation, queryId),
      nulls: node.nulls,
    } satisfies AllProps<OrderByItemNode>
  }

  protected transformGroupBy(
    node: GroupByNode,
    queryId?: QueryId,
  ): GroupByNode {
    return {
      kind: 'GroupByNode',
      items: this.transformNodeList(node.items, queryId),
    } satisfies AllProps<GroupByNode>
  }

  protected transformGroupByItem(
    node: GroupByItemNode,
    queryId?: QueryId,
  ): GroupByItemNode {
    return {
      kind: 'GroupByItemNode',
      groupBy: this.transformNode(node.groupBy, queryId),
    } satisfies AllProps<GroupByItemNode>
  }

  protected transformUpdateQuery(
    node: UpdateQueryNode,
    queryId?: QueryId,
  ): UpdateQueryNode {
    return {
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
    } satisfies AllProps<UpdateQueryNode>
  }

  protected transformColumnUpdate(
    node: ColumnUpdateNode,
    queryId?: QueryId,
  ): ColumnUpdateNode {
    return {
      kind: 'ColumnUpdateNode',
      column: this.transformNode(node.column, queryId),
      value: this.transformNode(node.value, queryId),
    } satisfies AllProps<ColumnUpdateNode>
  }

  protected transformLimit(node: LimitNode, queryId?: QueryId): LimitNode {
    return {
      kind: 'LimitNode',
      limit: this.transformNode(node.limit, queryId),
    } satisfies AllProps<LimitNode>
  }

  protected transformOffset(node: OffsetNode, queryId?: QueryId): OffsetNode {
    return {
      kind: 'OffsetNode',
      offset: this.transformNode(node.offset, queryId),
    } satisfies AllProps<OffsetNode>
  }

  protected transformOnConflict(
    node: OnConflictNode,
    queryId?: QueryId,
  ): OnConflictNode {
    return {
      kind: 'OnConflictNode',
      columns: this.transformNodeList(node.columns, queryId),
      constraint: this.transformNode(node.constraint, queryId),
      indexExpression: this.transformNode(node.indexExpression, queryId),
      indexWhere: this.transformNode(node.indexWhere, queryId),
      updates: this.transformNodeList(node.updates, queryId),
      updateWhere: this.transformNode(node.updateWhere, queryId),
      doNothing: node.doNothing,
    } satisfies AllProps<OnConflictNode>
  }

  protected transformOnDuplicateKey(
    node: OnDuplicateKeyNode,
    queryId?: QueryId,
  ): OnDuplicateKeyNode {
    return {
      kind: 'OnDuplicateKeyNode',
      updates: this.transformNodeList(node.updates, queryId),
    } satisfies AllProps<OnDuplicateKeyNode>
  }

  protected transformCreateIndex(
    node: CreateIndexNode,
    queryId?: QueryId,
  ): CreateIndexNode {
    return {
      kind: 'CreateIndexNode',
      name: this.transformNode(node.name, queryId),
      table: this.transformNode(node.table, queryId),
      columns: this.transformNodeList(node.columns, queryId),
      unique: node.unique,
      using: this.transformNode(node.using, queryId),
      ifNotExists: node.ifNotExists,
      where: this.transformNode(node.where, queryId),
      nullsNotDistinct: node.nullsNotDistinct,
    } satisfies AllProps<CreateIndexNode>
  }

  protected transformList(node: ListNode, queryId?: QueryId): ListNode {
    return {
      kind: 'ListNode',
      items: this.transformNodeList(node.items, queryId),
    } satisfies AllProps<ListNode>
  }

  protected transformDropIndex(
    node: DropIndexNode,
    queryId?: QueryId,
  ): DropIndexNode {
    return {
      kind: 'DropIndexNode',
      name: this.transformNode(node.name, queryId),
      table: this.transformNode(node.table, queryId),
      ifExists: node.ifExists,
      cascade: node.cascade,
    } satisfies AllProps<DropIndexNode>
  }

  protected transformPrimaryKeyConstraint(
    node: PrimaryKeyConstraintNode,
    queryId?: QueryId,
  ): PrimaryKeyConstraintNode {
    return {
      kind: 'PrimaryKeyConstraintNode',
      columns: this.transformNodeList(node.columns, queryId),
      name: this.transformNode(node.name, queryId),
      deferrable: node.deferrable,
      initiallyDeferred: node.initiallyDeferred,
    } satisfies AllProps<PrimaryKeyConstraintNode>
  }

  protected transformUniqueConstraint(
    node: UniqueConstraintNode,
    queryId?: QueryId,
  ): UniqueConstraintNode {
    return {
      kind: 'UniqueConstraintNode',
      columns: this.transformNodeList(node.columns, queryId),
      name: this.transformNode(node.name, queryId),
      nullsNotDistinct: node.nullsNotDistinct,
      deferrable: node.deferrable,
      initiallyDeferred: node.initiallyDeferred,
    } satisfies AllProps<UniqueConstraintNode>
  }

  protected transformForeignKeyConstraint(
    node: ForeignKeyConstraintNode,
    queryId?: QueryId,
  ): ForeignKeyConstraintNode {
    return {
      kind: 'ForeignKeyConstraintNode',
      columns: this.transformNodeList(node.columns, queryId),
      references: this.transformNode(node.references, queryId),
      name: this.transformNode(node.name, queryId),
      onDelete: node.onDelete,
      onUpdate: node.onUpdate,
      deferrable: node.deferrable,
      initiallyDeferred: node.initiallyDeferred,
    } satisfies AllProps<ForeignKeyConstraintNode>
  }

  protected transformSetOperation(
    node: SetOperationNode,
    queryId?: QueryId,
  ): SetOperationNode {
    return {
      kind: 'SetOperationNode',
      operator: node.operator,
      expression: this.transformNode(node.expression, queryId),
      all: node.all,
    } satisfies AllProps<SetOperationNode>
  }

  protected transformReferences(
    node: ReferencesNode,
    queryId?: QueryId,
  ): ReferencesNode {
    return {
      kind: 'ReferencesNode',
      table: this.transformNode(node.table, queryId),
      columns: this.transformNodeList(node.columns, queryId),
      onDelete: node.onDelete,
      onUpdate: node.onUpdate,
    } satisfies AllProps<ReferencesNode>
  }

  protected transformCheckConstraint(
    node: CheckConstraintNode,
    queryId?: QueryId,
  ): CheckConstraintNode {
    return {
      kind: 'CheckConstraintNode',
      expression: this.transformNode(node.expression, queryId),
      name: this.transformNode(node.name, queryId),
    } satisfies AllProps<CheckConstraintNode>
  }

  protected transformWith(node: WithNode, queryId?: QueryId): WithNode {
    return {
      kind: 'WithNode',
      expressions: this.transformNodeList(node.expressions, queryId),
      recursive: node.recursive,
    } satisfies AllProps<WithNode>
  }

  protected transformCommonTableExpression(
    node: CommonTableExpressionNode,
    queryId?: QueryId,
  ): CommonTableExpressionNode {
    return {
      kind: 'CommonTableExpressionNode',
      name: this.transformNode(node.name, queryId),
      materialized: node.materialized,
      expression: this.transformNode(node.expression, queryId),
    } satisfies AllProps<CommonTableExpressionNode>
  }

  protected transformCommonTableExpressionName(
    node: CommonTableExpressionNameNode,
    queryId?: QueryId,
  ): CommonTableExpressionNameNode {
    return {
      kind: 'CommonTableExpressionNameNode',
      table: this.transformNode(node.table, queryId),
      columns: this.transformNodeList(node.columns, queryId),
    } satisfies AllProps<CommonTableExpressionNameNode>
  }

  protected transformHaving(node: HavingNode, queryId?: QueryId): HavingNode {
    return {
      kind: 'HavingNode',
      having: this.transformNode(node.having, queryId),
    } satisfies AllProps<HavingNode>
  }

  protected transformCreateSchema(
    node: CreateSchemaNode,
    queryId?: QueryId,
  ): CreateSchemaNode {
    return {
      kind: 'CreateSchemaNode',
      schema: this.transformNode(node.schema, queryId),
      ifNotExists: node.ifNotExists,
    } satisfies AllProps<CreateSchemaNode>
  }

  protected transformDropSchema(
    node: DropSchemaNode,
    queryId?: QueryId,
  ): DropSchemaNode {
    return {
      kind: 'DropSchemaNode',
      schema: this.transformNode(node.schema, queryId),
      ifExists: node.ifExists,
      cascade: node.cascade,
    } satisfies AllProps<DropSchemaNode>
  }

  protected transformAlterTable(
    node: AlterTableNode,
    queryId?: QueryId,
  ): AlterTableNode {
    return {
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
    } satisfies AllProps<AlterTableNode>
  }

  protected transformDropColumn(
    node: DropColumnNode,
    queryId?: QueryId,
  ): DropColumnNode {
    return {
      kind: 'DropColumnNode',
      column: this.transformNode(node.column, queryId),
      ifExists: node.ifExists,
    } satisfies AllProps<DropColumnNode>
  }

  protected transformRenameColumn(
    node: RenameColumnNode,
    queryId?: QueryId,
  ): RenameColumnNode {
    return {
      kind: 'RenameColumnNode',
      column: this.transformNode(node.column, queryId),
      renameTo: this.transformNode(node.renameTo, queryId),
    } satisfies AllProps<RenameColumnNode>
  }

  protected transformAlterColumn(
    node: AlterColumnNode,
    queryId?: QueryId,
  ): AlterColumnNode {
    return {
      kind: 'AlterColumnNode',
      column: this.transformNode(node.column, queryId),
      dataType: this.transformNode(node.dataType, queryId),
      dataTypeExpression: this.transformNode(node.dataTypeExpression, queryId),
      setDefault: this.transformNode(node.setDefault, queryId),
      dropDefault: node.dropDefault,
      setNotNull: node.setNotNull,
      dropNotNull: node.dropNotNull,
    } satisfies AllProps<AlterColumnNode>
  }

  protected transformModifyColumn(
    node: ModifyColumnNode,
    queryId?: QueryId,
  ): ModifyColumnNode {
    return {
      kind: 'ModifyColumnNode',
      column: this.transformNode(node.column, queryId),
    } satisfies AllProps<ModifyColumnNode>
  }

  protected transformAddConstraint(
    node: AddConstraintNode,
    queryId?: QueryId,
  ): AddConstraintNode {
    return {
      kind: 'AddConstraintNode',
      constraint: this.transformNode(node.constraint, queryId),
    } satisfies AllProps<AddConstraintNode>
  }

  protected transformDropConstraint(
    node: DropConstraintNode,
    queryId?: QueryId,
  ): DropConstraintNode {
    return {
      kind: 'DropConstraintNode',
      constraintName: this.transformNode(node.constraintName, queryId),
      ifExists: node.ifExists,
      modifier: node.modifier,
    } satisfies AllProps<DropConstraintNode>
  }

  protected transformRenameConstraint(
    node: RenameConstraintNode,
    queryId?: QueryId,
  ): RenameConstraintNode {
    return {
      kind: 'RenameConstraintNode',
      oldName: this.transformNode(node.oldName, queryId),
      newName: this.transformNode(node.newName, queryId),
    } satisfies AllProps<RenameConstraintNode>
  }

  protected transformCreateView(
    node: CreateViewNode,
    queryId?: QueryId,
  ): CreateViewNode {
    return {
      kind: 'CreateViewNode',
      name: this.transformNode(node.name, queryId),
      temporary: node.temporary,
      orReplace: node.orReplace,
      ifNotExists: node.ifNotExists,
      materialized: node.materialized,
      columns: this.transformNodeList(node.columns, queryId),
      as: this.transformNode(node.as, queryId),
    } satisfies AllProps<CreateViewNode>
  }

  protected transformRefreshMaterializedView(
    node: RefreshMaterializedViewNode,
    queryId?: QueryId,
  ): RefreshMaterializedViewNode {
    return {
      kind: 'RefreshMaterializedViewNode',
      name: this.transformNode(node.name, queryId),
      concurrently: node.concurrently,
      withNoData: node.withNoData,
    } satisfies AllProps<RefreshMaterializedViewNode>
  }

  protected transformDropView(
    node: DropViewNode,
    queryId?: QueryId,
  ): DropViewNode {
    return {
      kind: 'DropViewNode',
      name: this.transformNode(node.name, queryId),
      ifExists: node.ifExists,
      materialized: node.materialized,
      cascade: node.cascade,
    } satisfies AllProps<DropViewNode>
  }

  protected transformGenerated(
    node: GeneratedNode,
    queryId?: QueryId,
  ): GeneratedNode {
    return {
      kind: 'GeneratedNode',
      byDefault: node.byDefault,
      always: node.always,
      identity: node.identity,
      stored: node.stored,
      expression: this.transformNode(node.expression, queryId),
    } satisfies AllProps<GeneratedNode>
  }

  protected transformDefaultValue(
    node: DefaultValueNode,
    queryId?: QueryId,
  ): DefaultValueNode {
    return {
      kind: 'DefaultValueNode',
      defaultValue: this.transformNode(node.defaultValue, queryId),
    } satisfies AllProps<DefaultValueNode>
  }

  protected transformOn(node: OnNode, queryId?: QueryId): OnNode {
    return {
      kind: 'OnNode',
      on: this.transformNode(node.on, queryId),
    } satisfies AllProps<OnNode>
  }

  protected transformSelectModifier(
    node: SelectModifierNode,
    queryId?: QueryId,
  ): SelectModifierNode {
    return {
      kind: 'SelectModifierNode',
      modifier: node.modifier,
      rawModifier: this.transformNode(node.rawModifier, queryId),
      of: this.transformNodeList(node.of, queryId),
    } satisfies AllProps<SelectModifierNode>
  }

  protected transformCreateType(
    node: CreateTypeNode,
    queryId?: QueryId,
  ): CreateTypeNode {
    return {
      kind: 'CreateTypeNode',
      name: this.transformNode(node.name, queryId),
      enum: this.transformNode(node.enum, queryId),
    } satisfies AllProps<CreateTypeNode>
  }

  protected transformDropType(
    node: DropTypeNode,
    queryId?: QueryId,
  ): DropTypeNode {
    return {
      kind: 'DropTypeNode',
      name: this.transformNode(node.name, queryId),
      additionalNames: this.transformNodeList(node.additionalNames, queryId),
      cascade: node.cascade,
      ifExists: node.ifExists,
    } satisfies AllProps<DropTypeNode>
  }

  protected transformExplain(
    node: ExplainNode,
    queryId?: QueryId,
  ): ExplainNode {
    return {
      kind: 'ExplainNode',
      format: node.format,
      options: this.transformNode(node.options, queryId),
    } satisfies AllProps<ExplainNode>
  }

  protected transformSchemableIdentifier(
    node: SchemableIdentifierNode,
    queryId?: QueryId,
  ): SchemableIdentifierNode {
    return {
      kind: 'SchemableIdentifierNode',
      schema: this.transformNode(node.schema, queryId),
      identifier: this.transformNode(node.identifier, queryId),
    } satisfies AllProps<SchemableIdentifierNode>
  }

  protected transformAggregateFunction(
    node: AggregateFunctionNode,
    queryId?: QueryId,
  ): AggregateFunctionNode {
    return {
      kind: 'AggregateFunctionNode',
      func: node.func,
      aggregated: this.transformNodeList(node.aggregated, queryId),
      distinct: node.distinct,
      orderBy: this.transformNode(node.orderBy, queryId),
      withinGroup: this.transformNode(node.withinGroup, queryId),
      filter: this.transformNode(node.filter, queryId),
      over: this.transformNode(node.over, queryId),
    } satisfies AllProps<AggregateFunctionNode>
  }

  protected transformOver(node: OverNode, queryId?: QueryId): OverNode {
    return {
      kind: 'OverNode',
      orderBy: this.transformNode(node.orderBy, queryId),
      partitionBy: this.transformNode(node.partitionBy, queryId),
    } satisfies AllProps<OverNode>
  }

  protected transformPartitionBy(
    node: PartitionByNode,
    queryId?: QueryId,
  ): PartitionByNode {
    return {
      kind: 'PartitionByNode',
      items: this.transformNodeList(node.items, queryId),
    } satisfies AllProps<PartitionByNode>
  }

  protected transformPartitionByItem(
    node: PartitionByItemNode,
    queryId?: QueryId,
  ): PartitionByItemNode {
    return {
      kind: 'PartitionByItemNode',
      partitionBy: this.transformNode(node.partitionBy, queryId),
    } satisfies AllProps<PartitionByItemNode>
  }

  protected transformBinaryOperation(
    node: BinaryOperationNode,
    queryId?: QueryId,
  ): BinaryOperationNode {
    return {
      kind: 'BinaryOperationNode',
      leftOperand: this.transformNode(node.leftOperand, queryId),
      operator: this.transformNode(node.operator, queryId),
      rightOperand: this.transformNode(node.rightOperand, queryId),
    } satisfies AllProps<BinaryOperationNode>
  }

  protected transformUnaryOperation(
    node: UnaryOperationNode,
    queryId?: QueryId,
  ): UnaryOperationNode {
    return {
      kind: 'UnaryOperationNode',
      operator: this.transformNode(node.operator, queryId),
      operand: this.transformNode(node.operand, queryId),
    } satisfies AllProps<UnaryOperationNode>
  }

  protected transformUsing(node: UsingNode, queryId?: QueryId): UsingNode {
    return {
      kind: 'UsingNode',
      tables: this.transformNodeList(node.tables, queryId),
    } satisfies AllProps<UsingNode>
  }

  protected transformFunction(
    node: FunctionNode,
    queryId?: QueryId,
  ): FunctionNode {
    return {
      kind: 'FunctionNode',
      func: node.func,
      arguments: this.transformNodeList(node.arguments, queryId),
    } satisfies AllProps<FunctionNode>
  }

  protected transformCase(node: CaseNode, queryId?: QueryId): CaseNode {
    return {
      kind: 'CaseNode',
      value: this.transformNode(node.value, queryId),
      when: this.transformNodeList(node.when, queryId),
      else: this.transformNode(node.else, queryId),
      isStatement: node.isStatement,
    } satisfies AllProps<CaseNode>
  }

  protected transformWhen(node: WhenNode, queryId?: QueryId): WhenNode {
    return {
      kind: 'WhenNode',
      condition: this.transformNode(node.condition, queryId),
      result: this.transformNode(node.result, queryId),
    } satisfies AllProps<WhenNode>
  }

  protected transformJSONReference(
    node: JSONReferenceNode,
    queryId?: QueryId,
  ): JSONReferenceNode {
    return {
      kind: 'JSONReferenceNode',
      reference: this.transformNode(node.reference, queryId),
      traversal: this.transformNode(node.traversal, queryId),
    } satisfies AllProps<JSONReferenceNode>
  }

  protected transformJSONPath(
    node: JSONPathNode,
    queryId?: QueryId,
  ): JSONPathNode {
    return {
      kind: 'JSONPathNode',
      inOperator: this.transformNode(node.inOperator, queryId),
      pathLegs: this.transformNodeList(node.pathLegs, queryId),
    } satisfies AllProps<JSONPathNode>
  }

  protected transformJSONPathLeg(
    node: JSONPathLegNode,
    _queryId?: QueryId,
  ): JSONPathLegNode {
    return {
      kind: 'JSONPathLegNode',
      type: node.type,
      value: node.value,
    } satisfies AllProps<JSONPathLegNode>
  }

  protected transformJSONOperatorChain(
    node: JSONOperatorChainNode,
    queryId?: QueryId,
  ): JSONOperatorChainNode {
    return {
      kind: 'JSONOperatorChainNode',
      operator: this.transformNode(node.operator, queryId),
      values: this.transformNodeList(node.values, queryId),
    } satisfies AllProps<JSONOperatorChainNode>
  }

  protected transformTuple(node: TupleNode, queryId?: QueryId): TupleNode {
    return {
      kind: 'TupleNode',
      values: this.transformNodeList(node.values, queryId),
    } satisfies AllProps<TupleNode>
  }

  protected transformMergeQuery(
    node: MergeQueryNode,
    queryId?: QueryId,
  ): MergeQueryNode {
    return {
      kind: 'MergeQueryNode',
      into: this.transformNode(node.into, queryId),
      using: this.transformNode(node.using, queryId),
      whens: this.transformNodeList(node.whens, queryId),
      with: this.transformNode(node.with, queryId),
      top: this.transformNode(node.top, queryId),
      endModifiers: this.transformNodeList(node.endModifiers, queryId),
      output: this.transformNode(node.output, queryId),
      returning: this.transformNode(node.returning, queryId),
    } satisfies AllProps<MergeQueryNode>
  }

  protected transformMatched(
    node: MatchedNode,
    _queryId?: QueryId,
  ): MatchedNode {
    return {
      kind: 'MatchedNode',
      not: node.not,
      bySource: node.bySource,
    } satisfies AllProps<MatchedNode>
  }

  protected transformAddIndex(
    node: AddIndexNode,
    queryId?: QueryId,
  ): AddIndexNode {
    return {
      kind: 'AddIndexNode',
      name: this.transformNode(node.name, queryId),
      columns: this.transformNodeList(node.columns, queryId),
      unique: node.unique,
      using: this.transformNode(node.using, queryId),
      ifNotExists: node.ifNotExists,
    } satisfies AllProps<AddIndexNode>
  }

  protected transformCast(node: CastNode, queryId?: QueryId): CastNode {
    return {
      kind: 'CastNode',
      expression: this.transformNode(node.expression, queryId),
      dataType: this.transformNode(node.dataType, queryId),
    } satisfies AllProps<CastNode>
  }

  protected transformFetch(node: FetchNode, queryId?: QueryId): FetchNode {
    return {
      kind: 'FetchNode',
      rowCount: this.transformNode(node.rowCount, queryId),
      modifier: node.modifier,
    } satisfies AllProps<FetchNode>
  }

  protected transformTop(node: TopNode, _queryId?: QueryId): TopNode {
    return {
      kind: 'TopNode',
      expression: node.expression,
      modifiers: node.modifiers,
    } satisfies AllProps<TopNode>
  }

  protected transformOutput(node: OutputNode, queryId?: QueryId): OutputNode {
    return {
      kind: 'OutputNode',
      selections: this.transformNodeList(node.selections, queryId),
    } satisfies AllProps<OutputNode>
  }

  protected transformAlterType(
    node: AlterTypeNode,
    queryId?: QueryId,
  ): AlterTypeNode {
    return {
      kind: 'AlterTypeNode',
      name: this.transformNode(node.name, queryId),
      addValue: this.transformNode(node.addValue, queryId),
      renameTo: this.transformNode(node.renameTo, queryId),
      renameValue: this.transformNode(node.renameValue, queryId),
      setSchema: this.transformNode(node.setSchema, queryId),
    } satisfies AllProps<AlterTypeNode>
  }

  protected transformAddValue(
    node: AddValueNode,
    queryId?: QueryId,
  ): AddValueNode {
    return {
      kind: 'AddValueNode',
      value: this.transformNode(node.value, queryId),
      ifNotExists: node.ifNotExists,
      isBefore: node.isBefore,
      neighborValue: this.transformNode(node.neighborValue, queryId),
    } satisfies AllProps<AddValueNode>
  }

  protected transformRenameValue(
    node: RenameValueNode,
    queryId?: QueryId,
  ): RenameValueNode {
    return {
      kind: 'RenameValueNode',
      oldValue: this.transformNode(node.oldValue, queryId),
      newValue: this.transformNode(node.newValue, queryId),
    } satisfies AllProps<RenameValueNode>
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
