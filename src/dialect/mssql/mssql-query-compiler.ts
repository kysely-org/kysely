import { AddColumnNode } from '../../operation-node/add-column-node.js'
import { AlterTableColumnAlterationNode } from '../../operation-node/alter-table-node.js'
import { CreateViewNode } from '../../operation-node/create-view-node.js'
import { DropColumnNode } from '../../operation-node/drop-column-node.js'
import { InsertQueryNode } from '../../operation-node/insert-query-node.js'
import { LimitNode } from '../../operation-node/limit-node.js'
import { OffsetNode } from '../../operation-node/offset-node.js'
import { ParensNode } from '../../operation-node/parens-node.js'
import { SelectQueryNode } from '../../operation-node/select-query-node.js'
import { SetOperationNode } from '../../operation-node/set-operation-node.js'
import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler.js'

export class MssqlQueryCompiler extends DefaultQueryCompiler {
  protected override getCurrentParameterPlaceholder(): string {
    return `@${this.numParameters}`
  }

  // mssql allows multi-column alterations in a single statement,
  // but you can only use the command keyword/s once.
  // it also doesn't support multiple kinds of commands in the same
  // alter table statement, but we compile that anyway for the sake
  // of WYSIWYG.
  protected override compileColumnAlterations(
    columnAlterations: readonly AlterTableColumnAlterationNode[]
  ): void {
    const nodesByKind: Partial<
      Record<
        AlterTableColumnAlterationNode['kind'],
        AlterTableColumnAlterationNode[]
      >
    > = {}

    for (const columnAlteration of columnAlterations) {
      if (!nodesByKind[columnAlteration.kind]) {
        nodesByKind[columnAlteration.kind] = []
      }

      nodesByKind[columnAlteration.kind]!.push(columnAlteration)
    }

    let first = true

    if (nodesByKind.AddColumnNode) {
      this.append('add ')
      this.compileList(nodesByKind.AddColumnNode)
      first = false
    }

    // multiple of these are not really supported by mssql,
    // but for the sake of WYSIWYG.
    if (nodesByKind.AlterColumnNode) {
      if (!first) this.append(', ')
      this.compileList(nodesByKind.AlterColumnNode)
    }

    if (nodesByKind.DropColumnNode) {
      if (!first) this.append(', ')
      this.append('drop column ')
      this.compileList(nodesByKind.DropColumnNode)
    }

    // not really supported by mssql, but for the sake of WYSIWYG.
    if (nodesByKind.ModifyColumnNode) {
      if (!first) this.append(', ')
      this.compileList(nodesByKind.ModifyColumnNode)
    }

    // not really supported by mssql, but for the sake of WYSIWYG.
    if (nodesByKind.RenameColumnNode) {
      if (!first) this.append(', ')
      this.compileList(nodesByKind.RenameColumnNode)
    }
  }

  protected override visitSelectQuery(node: SelectQueryNode): void {
    const wrapInParens =
      this.parentNode !== undefined &&
      !ParensNode.is(this.parentNode) &&
      !InsertQueryNode.is(this.parentNode) &&
      !CreateViewNode.is(this.parentNode) &&
      !SetOperationNode.is(this.parentNode)

    if (this.parentNode === undefined && node.explain) {
      this.visitNode(node.explain)
      this.append(' ')
    }

    if (wrapInParens) {
      this.append('(')
    }

    if (node.with) {
      this.visitNode(node.with)
      this.append(' ')
    }

    this.append('select')

    if (node.distinctOn) {
      this.append(' ')
      this.compileDistinctOn(node.distinctOn)
    }

    if (node.frontModifiers?.length) {
      this.append(' ')
      this.compileList(node.frontModifiers, ' ')
    }

    if (node.selections) {
      this.append(' ')
      this.compileList(node.selections)
    }

    if (node.from) {
      this.append(' ')
      this.visitNode(node.from)
    }

    if (node.joins) {
      this.append(' ')
      this.compileList(node.joins, ' ')
    }

    if (node.where) {
      this.append(' ')
      this.visitNode(node.where)
    }

    if (node.groupBy) {
      this.append(' ')
      this.visitNode(node.groupBy)
    }

    if (node.having) {
      this.append(' ')
      this.visitNode(node.having)
    }

    if (node.setOperations) {
      this.append(' ')
      this.compileList(node.setOperations, ' ')
    }

    if (node.orderBy) {
      this.append(' ')
      this.visitNode(node.orderBy)
    }

    if (node.offset) {
      this.append(' ')
      this.visitNode(node.offset)
    }

    if (!node.offset && node.limit) {
      this.append(' ')
      // mssql requires an offset if a limit is specified
      this.visitOffset({
        offset: { kind: 'ValueNode', value: 0 },
        kind: 'OffsetNode',
      })
      this.append(' ')
      this.visitNode(node.limit)
    } else if (node.limit) {
      this.append(' ')
      this.visitNode(node.limit)
    }

    if (node.endModifiers?.length) {
      this.append(' ')
      this.compileList(this.sortSelectModifiers([...node.endModifiers]), ' ')
    }

    if (wrapInParens) {
      this.append(')')
    }
  }

  protected override getAutoIncrement(): string {
    return 'identity(1, 1)'
  }

  protected override visitLimit(node: LimitNode): void {
    this.append('fetch next ')
    this.visitNode(node.limit)
    this.append(' rows only')
  }

  protected visitOffset(node: OffsetNode): void {
    this.append('offset ')
    this.visitNode(node.offset)
    this.append(' rows')
  }

  protected override visitAddColumn(node: AddColumnNode): void {
    this.visitNode(node.column)
  }

  protected override visitDropColumn(node: DropColumnNode): void {
    this.visitNode(node.column)
  }

  protected override announcesNewColumnDataType(): boolean {
    return false
  }
}
