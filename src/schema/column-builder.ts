import {
  ColumnDefinitionNode,
  OnDelete,
  columnDefinitionNode,
} from '../operation-node/column-definition-node'
import {
  isOperationNodeSource,
  OperationNodeSource,
} from '../operation-node/operation-node-source'
import { referenceNode } from '../operation-node/reference-node'
import { valueNode } from '../operation-node/value-node'
import { parseStringReference } from '../parser/reference-parser'
import { RawBuilder } from '../raw-builder/raw-builder'
import { PrimitiveValue } from '../util/object-utils'
import { preventAwait } from '../util/prevent-await'

export class ColumnBuilder implements OperationNodeSource {
  readonly #node: ColumnDefinitionNode

  constructor(node: ColumnDefinitionNode) {
    this.#node = node
  }

  /**
   * Makes the column automatically incrementing.
   *
   * On some dialects this may change the column type as well. For example
   * on postgres this sets the column type to `serial` no matter what you
   * have specified before.
   */
  increments(): ColumnBuilder {
    return new ColumnBuilder(
      columnDefinitionNode.cloneWith(this.#node, { isAutoIncrementing: true })
    )
  }

  /**
   * Makes the column the primary key.
   *
   * If you want to specify a composite primary key use the
   * {@link TableBuilder.primary} method.
   */
  primary(): ColumnBuilder {
    return new ColumnBuilder(
      columnDefinitionNode.cloneWith(this.#node, { isPrimaryKey: true })
    )
  }

  /**
   * Adds a foreign key constraint for the column.
   *
   * @example
   * ```ts
   * col.references('person.id')
   * ```
   */
  references(ref: string): ColumnBuilder {
    const references = parseStringReference(ref)

    if (!referenceNode.is(references)) {
      throw new Error(
        `invalid call references('${ref}'). The reference must have format table.column or schema.table.column`
      )
    }

    return new ColumnBuilder(
      columnDefinitionNode.cloneWith(this.#node, { references })
    )
  }

  /**
   * Adds a unique constraint for the column.
   */
  unique(): ColumnBuilder {
    return new ColumnBuilder(
      columnDefinitionNode.cloneWith(this.#node, { isUnique: true })
    )
  }

  /**
   * Makes the column non-nullable.
   */
  notNullable(): ColumnBuilder {
    return new ColumnBuilder(
      columnDefinitionNode.cloneWith(this.#node, { isNullable: false })
    )
  }

  /**
   * Adds an `on delete` constraint for the column.
   */
  onDelete(onDelete: OnDelete): ColumnBuilder {
    return new ColumnBuilder(
      columnDefinitionNode.cloneWith(this.#node, { onDelete })
    )
  }

  /**
   * Adds a default value constraint for the column.
   */
  defaultTo(value: PrimitiveValue | RawBuilder<any>): ColumnBuilder {
    return new ColumnBuilder(
      columnDefinitionNode.cloneWith(this.#node, {
        defaultTo: isOperationNodeSource(value)
          ? value.toOperationNode()
          : valueNode.createImmediate(value),
      })
    )
  }

  toOperationNode(): ColumnDefinitionNode {
    return this.#node
  }
}

preventAwait(ColumnBuilder, "don't await ColumnBuilder instances directly.")
