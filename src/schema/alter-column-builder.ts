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

export class AlterColumnBuilder {
  protected readonly alterColumnNode: AlterColumnNode

  constructor(alterColumnNode: AlterColumnNode) {
    this.alterColumnNode = alterColumnNode
  }

  setDataType(dataType: DataTypeExpression): AlteredColumnBuilder {
    return new AlteredColumnBuilder(
      AlterColumnNode.cloneWith(this.alterColumnNode, {
        dataType: parseDataTypeExpression(dataType),
      })
    )
  }

  setDefault(value: DefaultValueExpression): AlteredColumnBuilder {
    return new AlteredColumnBuilder(
      AlterColumnNode.cloneWith(this.alterColumnNode, {
        setDefault: parseDefaultValueExpression(value),
      })
    )
  }

  dropDefault(): AlteredColumnBuilder {
    return new AlteredColumnBuilder(
      AlterColumnNode.cloneWith(this.alterColumnNode, {
        dropDefault: true,
      })
    )
  }

  setNotNull(): AlteredColumnBuilder {
    return new AlteredColumnBuilder(
      AlterColumnNode.cloneWith(this.alterColumnNode, {
        setNotNull: true,
      })
    )
  }

  dropNotNull(): AlteredColumnBuilder {
    return new AlteredColumnBuilder(
      AlterColumnNode.cloneWith(this.alterColumnNode, {
        dropNotNull: true,
      })
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
 * Allows us to force consumers to do something, anything, when altering a column.
 *
 * Basically, deny the following:
 *
 * ```ts
 * db.schema.alterTable('person').alterColumn('age', (ac) => ac)
 * ```
 *
 * Which would now throw a compilation error, instead of a runtime error.
 */
export class AlteredColumnBuilder
  extends AlterColumnBuilder
  implements OperationNodeSource
{
  toOperationNode(): AlterColumnNode {
    return this.alterColumnNode
  }
}

export type AlterColumnBuilderCallback = (
  builder: AlterColumnBuilder
) => AlteredColumnBuilder
