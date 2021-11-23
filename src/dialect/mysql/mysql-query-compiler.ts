import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler.js'

export class MysqlQueryCompiler extends DefaultQueryCompiler {
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
