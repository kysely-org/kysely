import { AddValueNode } from '../operation-node/add-value-node.js'
import { ValueNode } from '../operation-node/value-node.js'
import { AlterTypeNode } from '../operation-node/alter-type-node.js'
import type { QueryExecutor } from '../query-executor/query-executor.js'
import type { QueryId } from '../util/query-id.js'
import { QueryFinalizer } from '../query-finalizer.js'

export class AlterTypeAddValueBuilder<
  const V extends string,
> extends QueryFinalizer<AlterTypeNode> {
  readonly #props: AlterTypeAddValueBuilderProps

  constructor(props: AlterTypeAddValueBuilderProps) {
    super(props)
    this.#props = props
  }

  /**
   * Adds an `if not exists` clause.
   */
  ifNotExists(): AlterTypeAddValueBuilder<V> {
    return new AlterTypeAddValueBuilder({
      ...this.#props,
      node: AlterTypeNode.cloneWith(this.#props.node, {
        addValue: AddValueNode.cloneWith(this.#props.node.addValue!, {
          ifNotExists: true,
        }),
      }),
    })
  }

  /**
   * Sets a `before <value>` clause.
   */
  before<const NV extends string>(
    neighborValue: NV extends V ? never : NV,
  ): AlterTypeAddValueBuilder<V> {
    return this.#setNeighbor(neighborValue, true)
  }

  /**
   * Sets an `after <value>` clause.
   */
  after<const NV extends string>(
    neighborValue: NV extends V ? never : NV,
  ): AlterTypeAddValueBuilder<V> {
    return this.#setNeighbor(neighborValue, false)
  }

  #setNeighbor(
    neighborValue: string,
    isBefore: boolean,
  ): AlterTypeAddValueBuilder<V> {
    return new AlterTypeAddValueBuilder({
      ...this.#props,
      node: AlterTypeNode.cloneWith(this.#props.node, {
        addValue: AddValueNode.cloneWith(this.#props.node.addValue!, {
          isBefore,
          neighborValue: ValueNode.createImmediate(neighborValue),
        }),
      }),
    })
  }
}

export interface AlterTypeAddValueBuilderProps {
  readonly executor: QueryExecutor
  readonly node: AlterTypeNode
  readonly queryId: QueryId
}
