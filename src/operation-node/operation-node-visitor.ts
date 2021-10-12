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

export class OperationNodeVisitor {
  protected readonly nodeStack: OperationNode[] = []

  readonly #visitors: Record<OperationNodeKind, Function> = {
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
    AddConstraintNode: this.visitAddConstraint.bind(this),
    DropConstraintNode: this.visitDropConstraint.bind(this),
    ForeignKeyConstraintNode: this.visitForeignKeyConstraint.bind(this),
  }

  protected readonly visitNode = (node: OperationNode): void => {
    this.nodeStack.push(node)
    this.#visitors[node.kind](node)
    this.nodeStack.pop()
  }

  protected visitSelectQuery(node: SelectQueryNode): void {
    if (node.with) {
      this.visitNode(node.with)
    }

    if (node.distinctOnSelections) {
      node.distinctOnSelections.forEach(this.visitNode)
    }

    if (node.selections) {
      node.selections.forEach(this.visitNode)
    }

    this.visitNode(node.from)

    if (node.joins) {
      node.joins.forEach(this.visitNode)
    }

    if (node.where) {
      this.visitNode(node.where)
    }

    if (node.groupBy) {
      this.visitNode(node.groupBy)
    }

    if (node.having) {
      this.visitNode(node.having)
    }

    if (node.orderBy) {
      this.visitNode(node.orderBy)
    }

    if (node.limit) {
      this.visitNode(node.limit)
    }

    if (node.offset) {
      this.visitNode(node.offset)
    }
  }

  protected visitSelection(node: SelectionNode): void {
    this.visitNode(node.selection)
  }

  protected visitColumn(node: ColumnNode): void {
    this.visitNode(node.column)
  }

  protected visitAlias(node: AliasNode): void {
    this.visitNode(node.node)
  }

  protected visitTable(node: TableNode): void {
    if (node.schema) {
      this.visitNode(node.schema)
    }

    this.visitNode(node.table)
  }

  protected visitFrom(node: FromNode): void {
    node.froms.forEach(this.visitNode)
  }

  protected visitReference(node: ReferenceNode): void {
    this.visitNode(node.column)
    this.visitNode(node.table)
  }

  protected visitFilter(node: FilterNode): void {
    if (node.left) {
      this.visitNode(node.left)
    }

    this.visitNode(node.op)
    this.visitNode(node.right)
  }

  protected visitAnd(node: AndNode): void {
    this.visitNode(node.left)
    this.visitNode(node.right)
  }

  protected visitOr(node: OrNode): void {
    this.visitNode(node.left)
    this.visitNode(node.right)
  }

  protected visitValueList(node: ValueListNode): void {
    node.values.forEach(this.visitNode)
  }

  protected visitParens(node: ParensNode): void {
    this.visitNode(node.node)
  }

  protected visitJoin(node: JoinNode): void {
    this.visitNode(node.table)

    if (node.on) {
      this.visitNode(node.on)
    }
  }

  protected visitRaw(node: RawNode): void {
    node.params.forEach(this.visitNode)
  }

  protected visitWhere(node: WhereNode): void {
    this.visitNode(node.where)
  }

  protected visitInsertQuery(node: InsertQueryNode): void {
    if (node.with) {
      this.visitNode(node.with)
    }

    this.visitNode(node.into)

    if (node.columns) {
      node.columns.forEach(this.visitNode)
    }

    if (node.values) {
      node.values.forEach(this.visitNode)
    }

    if (node.returning) {
      this.visitNode(node.returning)
    }
  }

  protected visitDeleteQuery(node: DeleteQueryNode): void {
    if (node.with) {
      this.visitNode(node.with)
    }

    this.visitNode(node.from)

    if (node.joins) {
      node.joins.forEach(this.visitNode)
    }

    if (node.where) {
      this.visitNode(node.where)
    }

    if (node.returning) {
      this.visitNode(node.returning)
    }
  }

  protected visitReturning(node: ReturningNode): void {
    node.selections.forEach(this.visitNode)
  }

  protected visitCreateTable(node: CreateTableNode): void {
    this.visitNode(node.table)

    node.columns.forEach(this.visitNode)

    if (node.constraints) {
      node.constraints.forEach(this.visitNode)
    }
  }

  protected visitAddColumn(node: AddColumnNode): void {
    this.visitNode(node.column)
  }

  protected visitColumnDefinition(node: ColumnDefinitionNode): void {
    this.visitNode(node.column)
    this.visitNode(node.dataType)

    if (node.defaultTo) {
      this.visitNode(node.defaultTo)
    }

    if (node.references) {
      this.visitNode(node.references)
    }

    if (node.check) {
      this.visitNode(node.check)
    }
  }

  protected visitDropTable(node: DropTableNode): void {
    this.visitNode(node.table)
  }

  protected visitOrderBy(node: OrderByNode): void {
    node.items.forEach(this.visitNode)
  }

  protected visitOrderByItem(node: OrderByItemNode): void {
    this.visitNode(node.orderBy)
  }

  protected visitGroupBy(node: GroupByNode): void {
    node.items.forEach(this.visitNode)
  }

  protected visitGroupByItem(node: GroupByItemNode): void {
    this.visitNode(node.groupBy)
  }

  protected visitUpdateQuery(node: UpdateQueryNode): void {
    if (node.with) {
      this.visitNode(node.with)
    }

    this.visitNode(node.table)

    if (node.updates) {
      node.updates.forEach(this.visitNode)
    }

    if (node.joins) {
      node.joins.forEach(this.visitNode)
    }

    if (node.where) {
      this.visitNode(node.where)
    }

    if (node.returning) {
      this.visitNode(node.returning)
    }
  }

  protected visitColumnUpdate(node: ColumnUpdateNode): void {
    this.visitNode(node.column)
    this.visitNode(node.value)
  }

  protected visitLimit(node: LimitNode): void {
    this.visitNode(node.limit)
  }

  protected visitOffset(node: OffsetNode): void {
    this.visitNode(node.offset)
  }

  protected visitOnConflict(node: OnConflictNode): void {
    node.columns.forEach(this.visitNode)

    if (node.updates) {
      node.updates.forEach(this.visitNode)
    }
  }

  protected visitCreateIndex(node: CreateIndexNode): void {
    this.visitNode(node.name)

    if (node.table) {
      this.visitNode(node.table)
    }

    if (node.using) {
      this.visitNode(node.using)
    }

    if (node.expression) {
      this.visitNode(node.expression)
    }
  }

  protected visitList(node: ListNode): void {
    node.items.forEach(this.visitNode)
  }

  protected visitDropIndex(node: DropIndexNode): void {
    this.visitNode(node.name)
  }

  protected visitPrimaryKeyConstraint(node: PrimaryKeyConstraintNode): void {
    if (node.name) {
      this.visitNode(node.name)
    }

    node.columns.forEach(this.visitNode)
  }

  protected visitUniqueConstraint(node: UniqueConstraintNode): void {
    if (node.name) {
      this.visitNode(node.name)
    }

    node.columns.forEach(this.visitNode)
  }

  protected visitReferences(node: ReferencesNode): void {
    node.columns.forEach(this.visitNode)
    this.visitNode(node.table)
  }

  protected visitCheckConstraint(node: CheckConstraintNode): void {
    if (node.name) {
      this.visitNode(node.name)
    }

    this.visitNode(node.expression)
  }

  protected visitWith(node: WithNode): void {
    node.expressions.forEach(this.visitNode)
  }

  protected visitCommonTableExpression(node: CommonTableExpressionNode): void {
    this.visitNode(node.name)
    this.visitNode(node.expression)
  }

  protected visitHaving(node: HavingNode): void {
    this.visitNode(node.having)
  }

  protected visitCreateSchema(node: CreateSchemaNode): void {
    this.visitNode(node.schema)
  }

  protected visitDropSchema(node: DropSchemaNode): void {
    this.visitNode(node.schema)
  }

  protected visitAlterTable(node: AlterTableNode): void {
    this.visitNode(node.table)

    if (node.renameTo) {
      this.visitNode(node.renameTo)
    }

    if (node.renameColumn) {
      this.visitNode(node.renameColumn)
    }

    if (node.setSchema) {
      this.visitNode(node.setSchema)
    }

    if (node.addColumn) {
      this.visitNode(node.addColumn)
    }

    if (node.dropColumn) {
      this.visitNode(node.dropColumn)
    }

    if (node.alterColumn) {
      this.visitNode(node.alterColumn)
    }
  }

  protected visitDropColumn(node: DropColumnNode): void {
    this.visitNode(node.column)
  }

  protected visitRenameColumn(node: RenameColumnNode): void {
    this.visitNode(node.column)
    this.visitNode(node.renameTo)
  }

  protected visitAlterColumn(node: AlterColumnNode): void {
    this.visitNode(node.column)
  }

  protected visitAddConstraint(node: AddConstraintNode): void {
    this.visitNode(node.constraint)
  }

  protected visitDropConstraint(node: DropConstraintNode): void {
    this.visitNode(node.constraintName)
  }

  protected visitForeignKeyConstraint(node: ForeignKeyConstraintNode): void {
    if (node.name) {
      this.visitNode(node.name)
    }

    node.columns.forEach(this.visitNode)
    this.visitNode(node.references)
  }

  protected visitDataType(node: DataTypeNode): void {}

  protected visitSelectAll(_: SelectAllNode): void {}

  protected visitIdentifier(_: IdentifierNode): void {}

  protected visitValue(_: ValueNode): void {}

  protected visitPrimitiveValueList(_: PrimitiveValueListNode): void {}

  protected visitOperator(node: OperatorNode) {}
}
