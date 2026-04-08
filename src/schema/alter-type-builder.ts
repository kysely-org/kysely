import type { QueryExecutor } from '../query-executor/query-executor.js'
import type { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { AlterTypeNode } from '../operation-node/alter-type-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { AlterTypeAddValueBuilder } from './alter-type-add-value-builder.js'
import { AddValueNode } from '../operation-node/add-value-node.js'
import { ValueNode } from '../operation-node/value-node.js'
import { QueryFinalizer } from '../query-finalizer.js'
import { RenameValueNode } from '../operation-node/rename-value-node.js'

/**
 * This builder can be used to create `alter type` queries.
 */
export class AlterTypeBuilder<const N extends string> {
  readonly #props: AlterTypeBuilderProps

  constructor(props: AlterTypeBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Adds a new value to an enum type.
   */
  addValue<const V extends string>(value: V): AlterTypeAddValueBuilder<V> {
    return new AlterTypeAddValueBuilder({
      ...this.#props,
      node: AlterTypeNode.cloneWith(this.#props.node, {
        addValue: AddValueNode.create(ValueNode.createImmediate(value)),
      }),
    })
  }

  /**
   * Rename the type.
   */
  renameTo<NN extends string>(
    newName: NN extends N ? never : NN,
  ): QueryFinalizer<AlterTypeNode> {
    return new QueryFinalizer({
      ...this.#props,
      node: AlterTypeNode.cloneWith(this.#props.node, {
        renameTo: IdentifierNode.create(newName),
      }),
    })
  }

  /**
   * Renames a value of an enum type.
   */
  renameValue<const OV extends string, const NV extends string>(
    oldValue: OV,
    newValue: NV extends OV ? never : NV,
  ): QueryFinalizer<AlterTypeNode> {
    return new QueryFinalizer({
      ...this.#props,
      node: AlterTypeNode.cloneWith(this.#props.node, {
        renameValue: RenameValueNode.create(
          ValueNode.createImmediate(oldValue),
          ValueNode.createImmediate(newValue),
        ),
      }),
    })
  }

  /**
   * Changes the type's schema.
   */
  setSchema<const NS extends string>(
    schema: NS extends (N extends `${infer S}.${string}` ? S : never)
      ? never
      : NS,
  ): QueryFinalizer<AlterTypeNode> {
    return new QueryFinalizer({
      ...this.#props,
      node: AlterTypeNode.cloneWith(this.#props.node, {
        setSchema: IdentifierNode.create(schema),
      }),
    })
  }
}

export interface AlterTypeBuilderProps {
  readonly executor: QueryExecutor
  readonly node: AlterTypeNode
  readonly queryId: QueryId
}
