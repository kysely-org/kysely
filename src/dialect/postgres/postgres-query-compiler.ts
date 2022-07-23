import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler.js'

export class PostgresQueryCompiler extends DefaultQueryCompiler {
  protected getCurrentParameterPlaceholder(): string {
    return '$' + this.numParameters
  }

  protected override getLeftExplainOptionsWrapper(): string {
    return '('
  }

  protected override getExplainOptionsDelimiter(): string {
    return ', '
  }

  protected override getRightExplainOptionsWrapper(): string {
    return ')'
  }

  protected override getLeftIdentifierWrapper(): string {
    return '"'
  }

  protected override getRightIdentifierWrapper(): string {
    return '"'
  }
}
