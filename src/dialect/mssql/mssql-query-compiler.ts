import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler.js'

export class MssqlQueryCompiler extends DefaultQueryCompiler {
  protected override getCurrentParameterPlaceholder(): string {
    return `@${this.numParameters}`
  }
}
