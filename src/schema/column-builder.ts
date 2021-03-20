import {
  cloneColumnDefinitionNode,
  ColumnDefinitionNode,
} from '../operation-node/column-definition-node'
import { OperationNodeSource } from '../operation-node/operation-node-source'
import { isReferenceNode } from '../operation-node/reference-node'
import { parseStringReference } from '../query-builder/methods/select-method'

export class ColumnBuilder implements OperationNodeSource {
  readonly #node: ColumnDefinitionNode

  constructor(node: ColumnDefinitionNode) {
    this.#node = node
  }

  /**
   * Sets the columns datatype to string with a given maximum length.
   *
   * This creates a `varchar(maxLength)` data type on most dialects.
   */
  string(maxLength: number = 255): ColumnBuilder {
    return new ColumnBuilder(
      cloneColumnDefinitionNode(this.#node, {
        dataType: 'String',
        dataTypeSize: maxLength,
      })
    )
  }

  /**
   * Sets the columns datatype to text.
   *
   * Unlike {@link ColumnBuilder.string} this creates a string column
   * that doesn't have a maximum length.
   */
  text(): ColumnBuilder {
    return new ColumnBuilder(
      cloneColumnDefinitionNode(this.#node, { dataType: 'Text' })
    )
  }

  /**
   * Sets the columns datatype to integer.
   */
  integer(): ColumnBuilder {
    return new ColumnBuilder(
      cloneColumnDefinitionNode(this.#node, { dataType: 'Integer' })
    )
  }

  /**
   * Sets the columns datatype to big integer.
   *
   * Creates a `bigint` column on dialects that support it and defaults
   * to a normal integer on others.
   */
  bigInteger(): ColumnBuilder {
    return new ColumnBuilder(
      cloneColumnDefinitionNode(this.#node, { dataType: 'BigInteger' })
    )
  }

  /**
   * Sets the columns datatype to double.
   */
  double(): ColumnBuilder {
    return new ColumnBuilder(
      cloneColumnDefinitionNode(this.#node, { dataType: 'Double' })
    )
  }

  /**
   * Adds an index for the column.
   */
  index(): ColumnBuilder {
    return new ColumnBuilder(
      cloneColumnDefinitionNode(this.#node, { hasIndex: true })
    )
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

  toOperationNode(): ColumnDefinitionNode {
    return this.#node
  }
}
