import { AddColumnNode } from '../../operation-node/add-column-node.js'
import { AlterTableColumnAlterationNode } from '../../operation-node/alter-table-node.js'
import { DropColumnNode } from '../../operation-node/drop-column-node.js'
import { OffsetNode } from '../../operation-node/offset-node.js'
import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler.js'

export class MssqlQueryCompiler extends DefaultQueryCompiler {
  protected override getCurrentParameterPlaceholder(): string {
    return `@${this.numParameters}`
  }

  protected override visitOffset(node: OffsetNode): void {
    super.visitOffset(node)
    this.append(' rows')
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
