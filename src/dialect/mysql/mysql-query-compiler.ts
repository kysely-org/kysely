import type { CreateIndexNode } from '../../operation-node/create-index-node.js'
import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler.js'

const LITERAL_ESCAPE_REGEX = /\\|'/g
const ID_WRAP_REGEX = /`/g

export class MysqlQueryCompiler extends DefaultQueryCompiler {
  protected override getCurrentParameterPlaceholder(): string {
    return '?'
  }

  protected override getExistingParameterPlaceholder(_parameter: unknown): undefined {
    return undefined
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
    return ID_WRAP_REGEX.source
  }

  protected override getRightIdentifierWrapper(): string {
    return ID_WRAP_REGEX.source
  }

  protected override sanitizeIdentifier(identifier: string): string {
    return identifier.replace(ID_WRAP_REGEX, '``')
  }

  /**
   * MySQL requires escaping backslashes in string literals when using the
   * default NO_BACKSLASH_ESCAPES=OFF mode. Without this, a backslash
   * followed by a quote (\') can break out of the string literal.
   *
   * @see https://dev.mysql.com/doc/refman/9.6/en/string-literals.html
   */
  protected override sanitizeStringLiteral(value: string): string {
    return value.replace(LITERAL_ESCAPE_REGEX, (char) =>
      char === '\\' ? '\\\\' : "''",
    )
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
