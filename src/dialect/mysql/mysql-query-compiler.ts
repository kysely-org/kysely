import { JSONPathReferenceNode } from '../../operation-node/json-path-reference-node.js'
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

  protected override visitJSONPathReference(node: JSONPathReferenceNode): void {
    this.append(node.operator)
    this.visitJSONPath(node.jsonPath)
  }
}
