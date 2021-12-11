import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler.js'

export class SqliteQueryCompiler extends DefaultQueryCompiler {
  protected override getCurrentParameterPlaceholder() {
    return '?'
  }

  protected override getLeftIdentifierWrapper(): string {
    return '"'
  }

  protected override getRightIdentifierWrapper(): string {
    return '"'
  }

  protected override getAutoIncrement() {
    return 'autoincrement'
  }
}
