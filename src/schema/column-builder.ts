import {
  cloneColumnDefinitionNode,
  ColumnDefinitionNode,
  OnDelete,
} from '../operation-node/column-definition-node'
import { OperationNodeSource } from '../operation-node/operation-node-source'
import { isReferenceNode } from '../operation-node/reference-node'
import { parseStringReference } from '../parser/reference-parser'

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
      cloneColumnDefinitionNode(this.#node, { isAutoIncrementing: true })
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
      cloneColumnDefinitionNode(this.#node, { isPrimaryKey: true })
    )
  }

  references(ref: string): ColumnBuilder {
    const references = parseStringReference(ref)

    if (!isReferenceNode(references)) {
      throw new Error(
        `invalid call references('${ref}'). The reference must have format table.column or schema.table.column`
      )
    }

    return new ColumnBuilder(
      cloneColumnDefinitionNode(this.#node, { references })
    )
  }

  unique(): ColumnBuilder {
    return new ColumnBuilder(
      cloneColumnDefinitionNode(this.#node, { isUnique: true })
    )
  }

  notNullable(): ColumnBuilder {
    return new ColumnBuilder(
      cloneColumnDefinitionNode(this.#node, { isNullable: false })
    )
  }

  onDelete(onDelete: OnDelete): ColumnBuilder {
    return new ColumnBuilder(
      cloneColumnDefinitionNode(this.#node, { onDelete })
    )
  }

  toOperationNode(): ColumnDefinitionNode {
    return this.#node
  }

  /**
   * ColumnBuilder is NOT thenable.
   *
   * This method is here just to throw an exception if someone awaits
   * a ColumnBuilder.
   */
  private async then(..._: any[]): Promise<never> {
    throw new Error("don't await ColumnBuilder instances directly.")
  }
}
