import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CommonTableExpressionNode } from '../operation-node/common-table-expression-node.js'
import { preventAwait } from '../util/prevent-await.js'
import { freeze } from '../util/object-utils.js'

export class CTEBuilder<N extends string> implements OperationNodeSource {
  readonly #props: CTEBuilderProps

  constructor(props: CTEBuilderProps) {
    this.#props = freeze(props)
  }

  materialized(): CTEBuilder<N> {
    return new CTEBuilder({
      ...this.#props,
      node: CommonTableExpressionNode.cloneWith(this.#props.node, {
        materialized: true,
      }),
    })
  }

  notMaterialized(): CTEBuilder<N> {
    return new CTEBuilder({
      ...this.#props,
      node: CommonTableExpressionNode.cloneWith(this.#props.node, {
        materialized: false,
      }),
    })
  }

  toOperationNode(): CommonTableExpressionNode {
    return this.#props.node
  }
}

preventAwait(
  CTEBuilder,
  "don't await CTEBuilder instances. They are never executed directly and are always just a part of a query."
)

interface CTEBuilderProps {
  readonly node: CommonTableExpressionNode
}

export type CTEBuilderCallback<N extends string> = (
  // N2 is needed for proper inference. Don't remove it.
  cte: <N2 extends string>(name: N2) => CTEBuilder<N2>
) => CTEBuilder<N>
