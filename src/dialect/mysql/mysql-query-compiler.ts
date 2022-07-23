import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler.js'
import { ExplainFormat } from '../../util/explainable.js'

export class MysqlQueryCompiler extends DefaultQueryCompiler {
  protected override getCurrentParameterPlaceholder() {
    return '?'
  }

  protected override getExplainOptionAssignment(): string {
    return '='
  }

  protected override getLeftIdentifierWrapper(): string {
    return '`'
  }

  protected override getRightIdentifierWrapper(): string {
    return '`'
  }
}
