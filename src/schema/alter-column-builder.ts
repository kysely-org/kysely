import { AlterColumnNode } from '../operation-node/alter-column-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import {
  DataTypeExpression,
  parseDataTypeExpression,
} from '../parser/data-type-parser.js'
import {
  DefaultValueExpression,
  parseDefaultValueExpression,
} from '../parser/default-value-parser.js'
import { preventAwait } from '../util/prevent-await.js'

export class AlterColumnBuilder {
  readonly #column: string

  constructor(column: string) {
    this.#column = column
  }

  setDataType(dataType: DataTypeExpression): AlteredColumnBuilder {
    return new AlteredColumnBuilder(
      AlterColumnNode.create(
        this.#column,
        'dataType',
        parseDataTypeExpression(dataType),
      ),
    )
  }

  setDefault(value: DefaultValueExpression): AlteredColumnBuilder {
    return new AlteredColumnBuilder(
      AlterColumnNode.create(
        this.#column,
        'setDefault',
        parseDefaultValueExpression(value),
      ),
    )
  }

  dropDefault(): AlteredColumnBuilder {
    return new AlteredColumnBuilder(
      AlterColumnNode.create(this.#column, 'dropDefault', true),
    )
  }

  setNotNull(): AlteredColumnBuilder {
    return new AlteredColumnBuilder(
      AlterColumnNode.create(this.#column, 'setNotNull', true),
    )
  }

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

preventAwait(AlterColumnBuilder, "don't await AlterColumnBuilder instances")

/**
 * Allows us to force consumers to do exactly one alteration to a column.
 *
 * One cannot do no alterations:
 *
 * ```ts
 * db.schema
 *   .alterTable('person')
 * //  .execute() // Property 'execute' does not exist on type 'AlteredColumnBuilder'.
 * ```
 *
 * ```ts
 * db.schema
 *   .alterTable('person')
 * //  .alterColumn('age', (ac) => ac) // Type 'AlterColumnBuilder' is not assignable to type 'AlteredColumnBuilder'.
 * //  .execute()
 * ```
 *
 * One cannot do multiple alterations:
 *
 * ```ts
 * db.schema
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

preventAwait(AlteredColumnBuilder, "don't await AlteredColumnBuilder instances")
