import type { AliasNode } from '../operation-node/alias-node.js'
import type { ColumnNode } from '../operation-node/column-node.js'
import type { IdentifierNode } from '../operation-node/identifier-node.js'
import type {
  OperationNode,
  OperationNodeKind,
} from '../operation-node/operation-node.js'
import type { ReferenceNode } from '../operation-node/reference-node.js'
import type { SelectAllNode } from '../operation-node/select-all-node.js'
import type { SelectionNode } from '../operation-node/selection-node.js'
import type { TableNode } from '../operation-node/table-node.js'
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
import { freeze } from '../util/object-utils.js'
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
import type { WhenNode } from './when-node.js'
import type { CaseNode } from './case-node.js'
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
import type { RenameConstraintNode } from './rename-constraint-node.js'

export abstract class OperationNodeVisitor {
  protected readonly nodeStack: OperationNode[] = []

  protected get parentNode(): OperationNode | undefined {
    return this.nodeStack[this.nodeStack.length - 2]
  }

  readonly #visitors: Record<OperationNodeKind, Function> = freeze({
    AliasNode: this.visitAlias.bind(this),
    ColumnNode: this.visitColumn.bind(this),
    IdentifierNode: this.visitIdentifier.bind(this),
    SchemableIdentifierNode: this.visitSchemableIdentifier.bind(this),
    RawNode: this.visitRaw.bind(this),
    ReferenceNode: this.visitReference.bind(this),
    SelectQueryNode: this.visitSelectQuery.bind(this),
    SelectionNode: this.visitSelection.bind(this),
    TableNode: this.visitTable.bind(this),
    FromNode: this.visitFrom.bind(this),
    SelectAllNode: this.visitSelectAll.bind(this),
    AndNode: this.visitAnd.bind(this),
    OrNode: this.visitOr.bind(this),
    ValueNode: this.visitValue.bind(this),
    ValueListNode: this.visitValueList.bind(this),
    PrimitiveValueListNode: this.visitPrimitiveValueList.bind(this),
    ParensNode: this.visitParens.bind(this),
    JoinNode: this.visitJoin.bind(this),
    OperatorNode: this.visitOperator.bind(this),
    WhereNode: this.visitWhere.bind(this),
    InsertQueryNode: this.visitInsertQuery.bind(this),
    DeleteQueryNode: this.visitDeleteQuery.bind(this),
    ReturningNode: this.visitReturning.bind(this),
    CreateTableNode: this.visitCreateTable.bind(this),
    AddColumnNode: this.visitAddColumn.bind(this),
    ColumnDefinitionNode: this.visitColumnDefinition.bind(this),
    DropTableNode: this.visitDropTable.bind(this),
    DataTypeNode: this.visitDataType.bind(this),
    OrderByNode: this.visitOrderBy.bind(this),
    OrderByItemNode: this.visitOrderByItem.bind(this),
    GroupByNode: this.visitGroupBy.bind(this),
    GroupByItemNode: this.visitGroupByItem.bind(this),
    UpdateQueryNode: this.visitUpdateQuery.bind(this),
    ColumnUpdateNode: this.visitColumnUpdate.bind(this),
    LimitNode: this.visitLimit.bind(this),
    OffsetNode: this.visitOffset.bind(this),
    OnConflictNode: this.visitOnConflict.bind(this),
    OnDuplicateKeyNode: this.visitOnDuplicateKey.bind(this),
    CreateIndexNode: this.visitCreateIndex.bind(this),
    DropIndexNode: this.visitDropIndex.bind(this),
    ListNode: this.visitList.bind(this),
    PrimaryKeyConstraintNode: this.visitPrimaryKeyConstraint.bind(this),
    UniqueConstraintNode: this.visitUniqueConstraint.bind(this),
    ReferencesNode: this.visitReferences.bind(this),
    CheckConstraintNode: this.visitCheckConstraint.bind(this),
    WithNode: this.visitWith.bind(this),
    CommonTableExpressionNode: this.visitCommonTableExpression.bind(this),
    CommonTableExpressionNameNode:
      this.visitCommonTableExpressionName.bind(this),
    HavingNode: this.visitHaving.bind(this),
    CreateSchemaNode: this.visitCreateSchema.bind(this),
    DropSchemaNode: this.visitDropSchema.bind(this),
    AlterTableNode: this.visitAlterTable.bind(this),
    DropColumnNode: this.visitDropColumn.bind(this),
    RenameColumnNode: this.visitRenameColumn.bind(this),
    AlterColumnNode: this.visitAlterColumn.bind(this),
    ModifyColumnNode: this.visitModifyColumn.bind(this),
    AddConstraintNode: this.visitAddConstraint.bind(this),
    DropConstraintNode: this.visitDropConstraint.bind(this),
    RenameConstraintNode: this.visitRenameConstraint.bind(this),
    ForeignKeyConstraintNode: this.visitForeignKeyConstraint.bind(this),
    CreateViewNode: this.visitCreateView.bind(this),
    RefreshMaterializedViewNode: this.visitRefreshMaterializedView.bind(this),
    DropViewNode: this.visitDropView.bind(this),
    GeneratedNode: this.visitGenerated.bind(this),
    DefaultValueNode: this.visitDefaultValue.bind(this),
    OnNode: this.visitOn.bind(this),
    ValuesNode: this.visitValues.bind(this),
    SelectModifierNode: this.visitSelectModifier.bind(this),
    CreateTypeNode: this.visitCreateType.bind(this),
    DropTypeNode: this.visitDropType.bind(this),
    ExplainNode: this.visitExplain.bind(this),
    DefaultInsertValueNode: this.visitDefaultInsertValue.bind(this),
    AggregateFunctionNode: this.visitAggregateFunction.bind(this),
    OverNode: this.visitOver.bind(this),
    PartitionByNode: this.visitPartitionBy.bind(this),
    PartitionByItemNode: this.visitPartitionByItem.bind(this),
    SetOperationNode: this.visitSetOperation.bind(this),
    BinaryOperationNode: this.visitBinaryOperation.bind(this),
    UnaryOperationNode: this.visitUnaryOperation.bind(this),
    UsingNode: this.visitUsing.bind(this),
    FunctionNode: this.visitFunction.bind(this),
    CaseNode: this.visitCase.bind(this),
    WhenNode: this.visitWhen.bind(this),
    JSONReferenceNode: this.visitJSONReference.bind(this),
    JSONPathNode: this.visitJSONPath.bind(this),
    JSONPathLegNode: this.visitJSONPathLeg.bind(this),
    JSONOperatorChainNode: this.visitJSONOperatorChain.bind(this),
    TupleNode: this.visitTuple.bind(this),
    MergeQueryNode: this.visitMergeQuery.bind(this),
    MatchedNode: this.visitMatched.bind(this),
    AddIndexNode: this.visitAddIndex.bind(this),
    CastNode: this.visitCast.bind(this),
    FetchNode: this.visitFetch.bind(this),
    TopNode: this.visitTop.bind(this),
    OutputNode: this.visitOutput.bind(this),
    OrActionNode: this.visitOrAction.bind(this),
    CollateNode: this.visitCollate.bind(this),
  })

  protected readonly visitNode = (node: OperationNode): void => {
    this.nodeStack.push(node)
    this.#visitors[node.kind](node)
    this.nodeStack.pop()
  }

  protected abstract visitSelectQuery(node: SelectQueryNode): void
  protected abstract visitSelection(node: SelectionNode): void
  protected abstract visitColumn(node: ColumnNode): void
  protected abstract visitAlias(node: AliasNode): void
  protected abstract visitTable(node: TableNode): void
  protected abstract visitFrom(node: FromNode): void
  protected abstract visitReference(node: ReferenceNode): void
  protected abstract visitAnd(node: AndNode): void
  protected abstract visitOr(node: OrNode): void
  protected abstract visitValueList(node: ValueListNode): void
  protected abstract visitParens(node: ParensNode): void
  protected abstract visitJoin(node: JoinNode): void
  protected abstract visitRaw(node: RawNode): void
  protected abstract visitWhere(node: WhereNode): void
  protected abstract visitInsertQuery(node: InsertQueryNode): void
  protected abstract visitDeleteQuery(node: DeleteQueryNode): void
  protected abstract visitReturning(node: ReturningNode): void
  protected abstract visitCreateTable(node: CreateTableNode): void
  protected abstract visitAddColumn(node: AddColumnNode): void
  protected abstract visitColumnDefinition(node: ColumnDefinitionNode): void
  protected abstract visitDropTable(node: DropTableNode): void
  protected abstract visitOrderBy(node: OrderByNode): void
  protected abstract visitOrderByItem(node: OrderByItemNode): void
  protected abstract visitGroupBy(node: GroupByNode): void
  protected abstract visitGroupByItem(node: GroupByItemNode): void
  protected abstract visitUpdateQuery(node: UpdateQueryNode): void
  protected abstract visitColumnUpdate(node: ColumnUpdateNode): void
  protected abstract visitLimit(node: LimitNode): void
  protected abstract visitOffset(node: OffsetNode): void
  protected abstract visitOnConflict(node: OnConflictNode): void
  protected abstract visitOnDuplicateKey(node: OnDuplicateKeyNode): void
  protected abstract visitCreateIndex(node: CreateIndexNode): void
  protected abstract visitDropIndex(node: DropIndexNode): void
  protected abstract visitList(node: ListNode): void
  protected abstract visitPrimaryKeyConstraint(
    node: PrimaryKeyConstraintNode,
  ): void
  protected abstract visitUniqueConstraint(node: UniqueConstraintNode): void
  protected abstract visitReferences(node: ReferencesNode): void
  protected abstract visitCheckConstraint(node: CheckConstraintNode): void
  protected abstract visitWith(node: WithNode): void
  protected abstract visitCommonTableExpression(
    node: CommonTableExpressionNode,
  ): void
  protected abstract visitCommonTableExpressionName(
    node: CommonTableExpressionNameNode,
  ): void
  protected abstract visitHaving(node: HavingNode): void
  protected abstract visitCreateSchema(node: CreateSchemaNode): void
  protected abstract visitDropSchema(node: DropSchemaNode): void
  protected abstract visitAlterTable(node: AlterTableNode): void
  protected abstract visitDropColumn(node: DropColumnNode): void
  protected abstract visitRenameColumn(node: RenameColumnNode): void
  protected abstract visitAlterColumn(node: AlterColumnNode): void
  protected abstract visitModifyColumn(node: ModifyColumnNode): void
  protected abstract visitAddConstraint(node: AddConstraintNode): void
  protected abstract visitDropConstraint(node: DropConstraintNode): void
  protected abstract visitRenameConstraint(node: RenameConstraintNode): void
  protected abstract visitForeignKeyConstraint(
    node: ForeignKeyConstraintNode,
  ): void
  protected abstract visitDataType(node: DataTypeNode): void
  protected abstract visitSelectAll(node: SelectAllNode): void
  protected abstract visitIdentifier(node: IdentifierNode): void
  protected abstract visitSchemableIdentifier(
    node: SchemableIdentifierNode,
  ): void
  protected abstract visitValue(node: ValueNode): void
  protected abstract visitPrimitiveValueList(node: PrimitiveValueListNode): void
  protected abstract visitOperator(node: OperatorNode): void
  protected abstract visitCreateView(node: CreateViewNode): void
  protected abstract visitRefreshMaterializedView(
    node: RefreshMaterializedViewNode,
  ): void
  protected abstract visitDropView(node: DropViewNode): void
  protected abstract visitGenerated(node: GeneratedNode): void
  protected abstract visitDefaultValue(node: DefaultValueNode): void
  protected abstract visitOn(node: OnNode): void
  protected abstract visitValues(node: ValuesNode): void
  protected abstract visitSelectModifier(node: SelectModifierNode): void
  protected abstract visitCreateType(node: CreateTypeNode): void
  protected abstract visitDropType(node: DropTypeNode): void
  protected abstract visitExplain(node: ExplainNode): void
  protected abstract visitDefaultInsertValue(node: DefaultInsertValueNode): void
  protected abstract visitAggregateFunction(node: AggregateFunctionNode): void
  protected abstract visitOver(node: OverNode): void
  protected abstract visitPartitionBy(node: PartitionByNode): void
  protected abstract visitPartitionByItem(node: PartitionByItemNode): void
  protected abstract visitSetOperation(node: SetOperationNode): void
  protected abstract visitBinaryOperation(node: BinaryOperationNode): void
  protected abstract visitUnaryOperation(node: UnaryOperationNode): void
  protected abstract visitUsing(node: UsingNode): void
  protected abstract visitFunction(node: FunctionNode): void
  protected abstract visitCase(node: CaseNode): void
  protected abstract visitWhen(node: WhenNode): void
  protected abstract visitJSONReference(node: JSONReferenceNode): void
  protected abstract visitJSONPath(node: JSONPathNode): void
  protected abstract visitJSONPathLeg(node: JSONPathLegNode): void
  protected abstract visitJSONOperatorChain(node: JSONOperatorChainNode): void
  protected abstract visitTuple(node: TupleNode): void
  protected abstract visitMergeQuery(node: MergeQueryNode): void
  protected abstract visitMatched(node: MatchedNode): void
  protected abstract visitAddIndex(node: AddIndexNode): void
  protected abstract visitCast(node: CastNode): void
  protected abstract visitFetch(node: FetchNode): void
  protected abstract visitTop(node: TopNode): void
  protected abstract visitOutput(node: OutputNode): void
  protected abstract visitOrAction(node: OrActionNode): void
  protected abstract visitCollate(node: CollateNode): void
  protected abstract visitNullIf(node: FunctionNode): void
}
