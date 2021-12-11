import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler.js'

export class PostgresQueryCompiler extends DefaultQueryCompiler {
  protected getCurrentParameterPlaceholder(): string {
    return '$' + this.numParameters
  }

  protected override getLeftIdentifierWrapper(): string {
    return '"'
  }

  protected override getRightIdentifierWrapper(): string {
    return '"'
  }
}
