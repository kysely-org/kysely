import { CreateIndexNode } from '../../operation-node/create-index-node.js'
import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler.js'

const ID_WRAP_REGEX = /`/g

export class MysqlQueryCompiler extends DefaultQueryCompiler {
  protected override getCurrentParameterPlaceholder() {
    return '?'
  }

  protected override getLeftExplainOptionsWrapper(): string {
    return ''
  }

  protected override getExplainOptionAssignment(): string {
    return '='
  }

  protected override getExplainOptionsDelimiter(): string {
    return ' '
  }

  protected override getRightExplainOptionsWrapper(): string {
    return ''
  }

  protected override getLeftIdentifierWrapper(): string {
    return '`'
  }

  protected override getRightIdentifierWrapper(): string {
    return '`'
  }

  protected override sanitizeIdentifier(identifier: string): string {
    return identifier.replace(ID_WRAP_REGEX, '``')
  }

  protected override visitCreateIndex(node: CreateIndexNode): void {
    this.append('create ')

    if (node.unique) {
      this.append('unique ')
    }

    this.append('index ')

    if (node.ifNotExists) {
      this.append('if not exists ')
    }

    this.visitNode(node.name)

    if (node.using) {
      this.append(' using ')
      this.visitNode(node.using)
    }

    if (node.table) {
      this.append(' on ')
      this.visitNode(node.table)
    }

    if (node.columns) {
      this.append(' (')
      this.compileList(node.columns)
      this.append(')')
    }

    if (node.where) {
      this.append(' ')
      this.visitNode(node.where)
    }
  }
}
