import { ColumnDefinitionNode } from '../../operation-node/column-definition-node.js'
import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler.js'

export class MysqlQueryCompiler extends DefaultQueryCompiler {
  protected override visitColumnDefinition(node: ColumnDefinitionNode): void {
    this.visitNode(node.column)
    this.append(' ')
    this.visitNode(node.dataType)

    if (node.defaultTo) {
      this.append(' default ')
      this.visitNode(node.defaultTo)
    }

    if (!node.isNullable || node.isAutoIncrementing) {
      this.append(' not null')
    }

    if (node.isAutoIncrementing) {
      this.append(' auto_increment')
    }

    if (node.isUnique) {
      this.append(' unique')
    }

    if (node.isPrimaryKey) {
      this.append(' primary key')
    }

    if (node.references) {
      this.append(' ')
      this.visitNode(node.references)
    }

    if (node.check) {
      this.append(' ')
      this.visitNode(node.check)
    }
  }

  protected override visitReturning(): void {
    // Do nothing.
  }

  protected override getSql(): string {
    return super.getSql().trimEnd()
  }

  protected override getCurrentParameterPlaceholder() {
    return '?'
  }

  protected override getLeftIdentifierWrapper(): string {
    return '`'
  }

  protected override getRightIdentifierWrapper(): string {
    return '`'
  }
}
