import type { DefaultInsertValueNode } from '../../operation-node/default-insert-value-node.js'
import type { OrActionNode } from '../../operation-node/or-action-node.js'
import { ParensNode } from '../../operation-node/parens-node.js'
import { RawNode } from '../../operation-node/raw-node.js'
import { WhenNode } from '../../operation-node/when-node.js'
import type { UpdateQueryNode } from '../../operation-node/update-query-node.js'
import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler.js'

const ID_WRAP_REGEX = /"/g

export class SqliteQueryCompiler extends DefaultQueryCompiler {
  protected override visitOrAction(node: OrActionNode): void {
    this.append('or ')
    this.append(node.action)
  }

  protected override getCurrentParameterPlaceholder(): string {
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

  protected override getAutoIncrement(): string {
    return 'autoincrement'
  }

  protected override sanitizeIdentifier(identifier: string): string {
    return identifier.replace(ID_WRAP_REGEX, '""')
  }

  protected override visitDefaultInsertValue(_: DefaultInsertValueNode): void {
    // sqlite doesn't support the `default` keyword in inserts.
    this.append('null')
  }

  protected override visitUpdateQuery(node: UpdateQueryNode): void {
    const wrapInParens =
      this.parentNode !== undefined &&
      !ParensNode.is(this.parentNode) &&
      !RawNode.is(this.parentNode) &&
      !WhenNode.is(this.parentNode)

    if (this.parentNode === undefined && node.explain) {
      this.visitNode(node.explain)
      this.append(' ')
    }

    if (wrapInParens) {
      this.append('(')
    }

    if (node.with) {
      this.visitNode(node.with)
      this.append(' ')
    }

    this.append('update ')

    if (node.top) {
      this.visitNode(node.top)
      this.append(' ')
    }

    if (node.table) {
      this.visitNode(node.table)
      this.append(' ')
    }

    this.append('set ')

    if (node.updates) {
      this.compileList(node.updates)
    }

    if (node.output) {
      this.append(' ')
      this.visitNode(node.output)
    }

    if (node.from) {
      this.append(' ')
      this.visitNode(node.from)
    }

    if (node.joins) {
      if (!node.from) {
        throw new Error(
          "Joins in an update query are only supported as a part of a PostgreSQL 'update set from join' query. If you want to create a MySQL 'update join set' query, see https://kysely.dev/docs/examples/update/my-sql-joins",
        )
      }

      this.append(' ')
      this.compileList(node.joins, ' ')
    }

    if (node.where) {
      this.append(' ')
      this.visitNode(node.where)
    }

    if (node.returning) {
      this.append(' ')
      this.visitNode(node.returning)
    }

    if (node.orderBy) {
      this.append(' ')
      this.visitNode(node.orderBy)
    }

    if (node.limit) {
      this.append(' ')
      this.visitNode(node.limit)
    }

    if (wrapInParens) {
      this.append(')')
    }

    if (node.endModifiers?.length) {
      this.append(' ')
      this.compileList(node.endModifiers, ' ')
    }
  }
}
