import { AlterColumnNode } from '../operation-node/alter-column-node.js'
import type { OperationNodeSource } from '../operation-node/operation-node-source.js'
import {
  type DataTypeExpression,
  parseDataTypeExpression,
} from '../parser/data-type-parser.js'
import {
  type DefaultValueExpression,
  parseDefaultValueExpression,
} from '../parser/default-value-parser.js'

export class AlterColumnBuilder {
  readonly #column: string

  constructor(column: string) {
    this.#column = column
  }

  /**
   * Sets the column data type. Supported by PostgreSQL and MSSQL.
   *
   * For MySQL, use {@link AlterTableBuilder.modifyColumn}.
   *
   * See {@link AlterTableBuilder.alterColumn} for examples.
   */
  setDataType(dataType: DataTypeExpression): AlteredColumnBuilder {
    return new AlteredColumnBuilder(
      AlterColumnNode.create(
        this.#column,
        'dataType',
        parseDataTypeExpression(dataType),
      ),
    )
  }

  /**
   * Sets the default value for future inserts. Existing rows are not changed.
   *
   * Supported by PostgreSQL and MySQL.
   *
   * See {@link AlterTableBuilder.alterColumn} for examples.
   */
  setDefault(value: DefaultValueExpression): AlteredColumnBuilder {
    return new AlteredColumnBuilder(
      AlterColumnNode.create(
        this.#column,
        'setDefault',
        parseDefaultValueExpression(value),
      ),
    )
  }

  /**
   * Removes the column default. Supported by PostgreSQL and MySQL.
   *
   * See {@link AlterTableBuilder.alterColumn} for examples.
   */
  dropDefault(): AlteredColumnBuilder {
    return new AlteredColumnBuilder(
      AlterColumnNode.create(this.#column, 'dropDefault', true),
    )
  }

  /**
   * Adds a `not null` constraint. Existing rows must not contain null values.
   *
   * Supported by PostgreSQL. For MySQL, use {@link AlterTableBuilder.modifyColumn}.
   *
   * See {@link AlterTableBuilder.alterColumn} for examples.
   */
  setNotNull(): AlteredColumnBuilder {
    return new AlteredColumnBuilder(
      AlterColumnNode.create(this.#column, 'setNotNull', true),
    )
  }

  /**
   * Removes the `not null` constraint. Supported by PostgreSQL.
   *
   * For MySQL, use {@link AlterTableBuilder.modifyColumn}.
   *
   * See {@link AlterTableBuilder.alterColumn} for examples.
   */
  dropNotNull(): AlteredColumnBuilder {
    return new AlteredColumnBuilder(
      AlterColumnNode.create(this.#column, 'dropNotNull', true),
    )
  }

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }
}

/**
 * Allows us to force consumers to do exactly one alteration to a column.
 *
 * One cannot do no alterations:
 *
 * ```ts
 * await db.schema
 *   .alterTable('person')
 * //  .execute() // Property 'execute' does not exist on type 'AlteredColumnBuilder'.
 * ```
 *
 * ```ts
 * await db.schema
 *   .alterTable('person')
 * //  .alterColumn('age', (ac) => ac) // Type 'AlterColumnBuilder' is not assignable to type 'AlteredColumnBuilder'.
 * //  .execute()
 * ```
 *
 * One cannot do multiple alterations:
 *
 * ```ts
 * await db.schema
 *   .alterTable('person')
 * //  .alterColumn('age', (ac) => ac.dropNotNull().setNotNull()) // Property 'setNotNull' does not exist on type 'AlteredColumnBuilder'.
 * //  .execute()
 * ```
 *
 * Which would now throw a compilation error, instead of a runtime error.
 */
export class AlteredColumnBuilder implements OperationNodeSource {
  readonly #alterColumnNode: AlterColumnNode

  constructor(alterColumnNode: AlterColumnNode) {
    this.#alterColumnNode = alterColumnNode
  }

  toOperationNode(): AlterColumnNode {
    return this.#alterColumnNode
  }
}

export type AlterColumnBuilderCallback = (
  builder: AlterColumnBuilder,
) => AlteredColumnBuilder
