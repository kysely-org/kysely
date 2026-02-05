import type { AlterTableNode } from '../../operation-node/alter-table-node.js'
import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler.js'

const ID_WRAP_REGEX = /"/g

export class PostgresQueryCompiler extends DefaultQueryCompiler {
  protected override sanitizeIdentifier(identifier: string): string {
    return identifier.replace(ID_WRAP_REGEX, '""')
  }

  protected override visitAlterTable(node: AlterTableNode): void {
    this.append('alter table ')

    if (node.ifExists) {
      this.append('if exists ')
    }

    this.visitNode(node.table)
    this.append(' ')

    if (node.renameTo) {
      this.append('rename to ')
      this.visitNode(node.renameTo)
    }

    if (node.setSchema) {
      this.append('set schema ')
      this.visitNode(node.setSchema)
    }

    if (node.addConstraint) {
      this.visitNode(node.addConstraint)
    }

    if (node.dropConstraint) {
      this.visitNode(node.dropConstraint)
    }

    if (node.renameConstraint) {
      this.visitNode(node.renameConstraint)
    }

    if (node.columnAlterations) {
      this.compileColumnAlterations(node.columnAlterations)
    }

    if (node.addIndex) {
      this.visitNode(node.addIndex)
    }

    if (node.dropIndex) {
      this.visitNode(node.dropIndex)
    }
  }
}
