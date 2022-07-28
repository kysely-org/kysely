import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler.js'

const ID_WRAP_REGEX = /`/g

export class MysqlQueryCompiler extends DefaultQueryCompiler {
  protected override getCurrentParameterPlaceholder() {
    return '?'
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
}
