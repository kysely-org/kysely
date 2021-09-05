import { AliasNode } from '../operation-node/alias-node'
import { ColumnNode } from '../operation-node/column-node'
import { IdentifierNode } from '../operation-node/identifier-node'
import {
  OperationNode,
  OperationNodeKind,
} from '../operation-node/operation-node'
import { ReferenceNode } from '../operation-node/reference-node'
import { SelectAllNode } from '../operation-node/select-all-node'
import { SelectionNode } from '../operation-node/selection-node'
import { TableNode } from '../operation-node/table-node'
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

export class OperationNodeVisitor {
  protected nodeStack: OperationNode[] = []

  #visitors: Record<OperationNodeKind, Function> = {
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
    TablePrimaryConstraintNode: this.visitTablePrimaryConstraint.bind(this),
    TableUniqueConstraintNode: this.visitTableUniqueConstraint.bind(this),
    ReferencesNode: this.visitReferences.bind(this),
    CheckConstraintNode: this.visitCheckConstraint.bind(this),
    WithNode: this.visitWith.bind(this),
    CommonTableExpressionNode: this.visitCommonTableExpression.bind(this),
    HavingNode: this.visitHaving.bind(this),
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
  }

  protected visitColumnDefinition(node: ColumnDefinitionNode): void {
    this.visitNode(node.column)
    this.visitNode(node.dataType)

    if (node.defaultTo) {
      this.visitNode(node.defaultTo)
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

    if (node.on) {
      this.visitNode(node.on)
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

  protected visitTablePrimaryConstraint(
    node: TablePrimaryConstraintNode
  ): void {
    node.columns.forEach(this.visitNode)
  }

  protected visitTableUniqueConstraint(node: TableUniqueConstraintNode): void {
    node.columns.forEach(this.visitNode)
  }

  protected visitReferences(node: ReferencesNode): void {
    this.visitNode(node.column)
    this.visitNode(node.table)
  }

  protected visitCheckConstraint(node: CheckConstraintNode): void {
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

  protected visitDataType(node: DataTypeNode): void {}

  protected visitSelectAll(_: SelectAllNode): void {}

  protected visitIdentifier(_: IdentifierNode): void {}

  protected visitValue(_: ValueNode): void {}

  protected visitPrimitiveValueList(_: PrimitiveValueListNode): void {}

  protected visitOperator(node: OperatorNode) {}
}
