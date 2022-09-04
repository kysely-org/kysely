import { freeze } from '../util/object-utils.js'
import { AggregateFunctionNode } from '../operation-node/aggregate-function-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { AliasNode } from '../operation-node/alias-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { preventAwait } from '../util/prevent-await.js'
import { OverBuilder } from './over-builder.js'
import { createOverBuilder } from '../parser/parse-utils.js'

export class AggregateFunctionBuilder<DB, TB extends keyof DB, O = unknown>
  implements OperationNodeSource
{
  readonly #props: AggregateFunctionBuilderProps

  constructor(props: AggregateFunctionBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * TODO: ...
   */
  as<A extends string>(
    alias: A
  ): AliasedAggregateFunctionBuilder<DB, TB, O, A> {
    return new AliasedAggregateFunctionBuilder(this, alias)
  }

  /**
   * TODO: ...
   */
  distinct(): AggregateFunctionBuilder<DB, TB, O> {
    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithDistinct(
        this.#props.aggregateFunctionNode
      ),
    })
  }

  /**
   * TODO: ...
   */
  over(
    over?: OverBuilderCallback<DB, TB>
  ): AggregateFunctionBuilder<DB, TB, O> {
    const builder = createOverBuilder()

    return new AggregateFunctionBuilder({
      ...this.#props,
      aggregateFunctionNode: AggregateFunctionNode.cloneWithOver(
        this.#props.aggregateFunctionNode,
        (over ? over(builder) : builder).toOperationNode()
      ),
    })
  }

  toOperationNode(): AggregateFunctionNode {
    return this.#props.aggregateFunctionNode
  }
}

/**
 * {@link AggregateFunctionBuilder} with an alias. The result of calling {@link AggregateFunctionBuilder.as}.
 */
export class AliasedAggregateFunctionBuilder<
  DB,
  TB extends keyof DB,
  O = unknown,
  A extends string = never
> implements OperationNodeSource
{
  readonly #aggregateFunctionBuilder: AggregateFunctionBuilder<DB, TB, O>
  readonly #alias: A

  constructor(
    aggregateFunctionBuilder: AggregateFunctionBuilder<DB, TB, O>,
    alias: A
  ) {
    this.#aggregateFunctionBuilder = aggregateFunctionBuilder
    this.#alias = alias
  }

  /**
   * @private
   *
   * This needs to be here just so that the typings work. Without this
   * the generated .d.ts file contains no reference to the type param A
   * which causes this type to be equal to AliasedAggregateFunctionBuilder with any A
   * as long as O is the same.
   */
  protected get alias(): A {
    return this.#alias
  }

  toOperationNode(): AliasNode {
    return AliasNode.create(
      this.#aggregateFunctionBuilder.toOperationNode(),
      IdentifierNode.create(this.#alias)
    )
  }
}

preventAwait(
  AggregateFunctionBuilder,
  "don't await AggregateFunctionBuilder instances. They are never executed directly and are always just a part of a query."
)

export interface AggregateFunctionBuilderProps {
  aggregateFunctionNode: AggregateFunctionNode
}

export type OverBuilderCallback<DB, TB extends keyof DB> = (
  builder: OverBuilder<DB, TB>
) => OverBuilder<DB, TB>
