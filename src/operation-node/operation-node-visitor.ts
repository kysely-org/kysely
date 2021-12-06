import { AliasNode } from '../operation-node/alias-node.js'
import { ColumnNode } from '../operation-node/column-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import {
  OperationNode,
  OperationNodeKind,
} from '../operation-node/operation-node.js'
import { ReferenceNode } from '../operation-node/reference-node.js'
import { SelectAllNode } from '../operation-node/select-all-node.js'
import { SelectionNode } from '../operation-node/selection-node.js'
import { TableNode } from '../operation-node/table-node.js'
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
import { DefaultValueNode } from './default-to-node.js'
import { freeze } from '../util/object-utils.js'

export abstract class OperationNodeVisitor {
  protected readonly nodeStack: OperationNode[] = []

  readonly #visitors: Record<OperationNodeKind, Function> = freeze({
    AliasNode: this.visitAlias.bind(this),
    ColumnNode: this.visitColumn.bind(this),
    IdentifierNode: this.visitIdentifier.bind(this),
    RawNode: this.visitRaw.bind(this),
    ReferenceNode: this.visitReference.bind(this),
    SelectQueryNode: this.visitSelectQuery.bind(this),
    SelectionNode: this.visitSelection.bind(this),
    TableNode: this.visitTable.bind(this),
    FromNode: this.visitFrom.bind(this),
    SelectAllNode: this.visitSelectAll.bind(this),
    FilterNode: this.visitFilter.bind(this),
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
    ForeignKeyConstraintNode: this.visitForeignKeyConstraint.bind(this),
    UnionNode: this.visitUnion.bind(this),
    CreateViewNode: this.visitCreateView.bind(this),
    DropViewNode: this.visitDropView.bind(this),
    GeneratedAlwaysAsNode: this.visitGeneratedAlwaysAs.bind(this),
    DefaultValueNode: this.visitDefaultValue.bind(this),
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
  protected abstract visitFilter(node: FilterNode): void
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
    node: PrimaryKeyConstraintNode
  ): void
  protected abstract visitUniqueConstraint(node: UniqueConstraintNode): void
  protected abstract visitReferences(node: ReferencesNode): void
  protected abstract visitCheckConstraint(node: CheckConstraintNode): void
  protected abstract visitWith(node: WithNode): void
  protected abstract visitCommonTableExpression(
    node: CommonTableExpressionNode
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
  protected abstract visitForeignKeyConstraint(
    node: ForeignKeyConstraintNode
  ): void
  protected abstract visitUnion(node: UnionNode): void
  protected abstract visitDataType(node: DataTypeNode): void
  protected abstract visitSelectAll(_: SelectAllNode): void
  protected abstract visitIdentifier(_: IdentifierNode): void
  protected abstract visitValue(_: ValueNode): void
  protected abstract visitPrimitiveValueList(_: PrimitiveValueListNode): void
  protected abstract visitOperator(node: OperatorNode): void
  protected abstract visitCreateView(node: CreateViewNode): void
  protected abstract visitDropView(node: DropViewNode): void
  protected abstract visitGeneratedAlwaysAs(node: GeneratedAlwaysAsNode): void
  protected abstract visitDefaultValue(node: DefaultValueNode): void
}
