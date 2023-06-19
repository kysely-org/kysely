import { DefaultInsertValueNode } from '../../operation-node/default-insert-value-node.js'
import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler.js'

const ID_WRAP_REGEX = /"/g

export class SqliteQueryCompiler extends DefaultQueryCompiler {
  protected override getCurrentParameterPlaceholder() {
    return '?'
  }

  protected override getLeftExplainOptionsWrapper(): string {
    return ''
  }

  protected override getRightExplainOptionsWrapper(): string {
    return ''
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

  protected override sanitizeIdentifier(identifier: string): string {
    return identifier.replace(ID_WRAP_REGEX, '""')
  }

  protected override visitDefaultInsertValue(_: DefaultInsertValueNode): void {
    // sqlite doesn't support the `default` keyword in inserts.
    this.append('null')
  }
}
