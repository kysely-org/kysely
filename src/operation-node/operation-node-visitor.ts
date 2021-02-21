import { AliasNode } from '../operation-node/alias-node'
import { ColumnNode } from '../operation-node/column-node'
import { FromNode } from '../operation-node/from-node'
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
import { QueryNode } from './query-node'
import { RawNode } from './raw-node'
import { SelectNode } from './select-node'
import { ValueListNode } from './value-list-node'
import { ValueNode } from './value-node'
import { FilterNode } from './filter-node'
import { OperatorNode } from './operator-node'

export class OperationNodeVisitor {
  #visitors: Record<OperationNodeKind, Function> = {
    AliasNode: this.visitAlias.bind(this),
    ColumnNode: this.visitColumn.bind(this),
    IdentifierNode: this.visitIdentifier.bind(this),
    QueryNode: this.visitQuery.bind(this),
    RawNode: this.visitRaw.bind(this),
    ReferenceNode: this.visitReference.bind(this),
    SelectNode: this.visitSelect.bind(this),
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
  }

  readonly visitNode = (node: OperationNode): void => {
    this.#visitors[node.kind](node)
  }

  protected visitQuery(node: QueryNode): void {
    node.from.forEach(this.visitNode)

    if (node.select) {
      this.visitNode(node.select)
    }

    if (node.where) {
      this.visitNode(node.where)
    }
  }

  protected visitSelect(node: SelectNode): void {
    node.selections.forEach(this.visitNode)
    node.distinctOnSelections.forEach(this.visitNode)
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
    this.visitNode(node.from)
  }

  protected visitReference(node: ReferenceNode): void {
    this.visitNode(node.column)
    this.visitNode(node.table)
  }

  protected visitFilter(node: FilterNode): void {
    if (node.lhs) {
      this.visitNode(node.lhs)
    }

    this.visitNode(node.op)
    this.visitNode(node.rhs)
  }

  protected visitAnd(node: AndNode): void {
    this.visitNode(node.lhs)
    this.visitNode(node.rhs)
  }

  protected visitOr(node: OrNode): void {
    this.visitNode(node.lhs)
    this.visitNode(node.rhs)
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

  protected visitSelectAll(_: SelectAllNode): void {}

  protected visitIdentifier(_: IdentifierNode): void {}

  protected visitValue(_: ValueNode): void {}

  protected visitPrimitiveValueList(_: PrimitiveValueListNode): void {}

  protected visitOperator(node: OperatorNode) {}
}
