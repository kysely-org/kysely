import { JSONPathLegNode } from '../operation-node/json-path-leg-node.js'
import { JSONPathNode } from '../operation-node/json-path-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import { ReferenceNode } from '../operation-node/reference-node.js'
import { freeze } from '../util/object-utils.js'
import { JSONTraversable } from './json-traversable-interface.js'

export class JSONPathBuilder<S, O = S> implements JSONTraversable<S, O> {
  readonly #props: JSONPathBuilderProps

  constructor(props: JSONPathBuilderProps) {
    this.#props = freeze({ ...props })
  }

  at<I extends any[] extends O ? keyof NonNullable<O> & number : never>(
    index: I
  ): JSONPathBuilder<
    S,
    undefined extends O
      ? null | NonNullable<NonNullable<O>[I]>
      : null extends O
      ? null | NonNullable<NonNullable<O>[I]>
      : NonNullable<O>[I]
  > {
    const legNode = JSONPathLegNode.create(
      'ArrayLocation',
      RawNode.createWithSql(`${index}`)
    )

    return new JSONPathBuilder({
      node: ReferenceNode.is(this.#props.node)
        ? ReferenceNode.cloneWithJSONPath(
            this.#props.node,
            JSONPathNode.cloneWithLeg(this.#props.node.jsonPath!, legNode)
          )
        : JSONPathNode.cloneWithLeg(this.#props.node, legNode),
    })
  }

  key<
    K extends any[] extends O
      ? never
      : NonNullable<O> extends object
      ? keyof NonNullable<O> & string
      : never
  >(
    key: K
  ): JSONPathBuilder<
    S,
    undefined extends O
      ? null | NonNullable<NonNullable<O>[K]>
      : null extends O
      ? null | NonNullable<NonNullable<O>[K]>
      : NonNullable<O>[K]
  > {
    const legNode = JSONPathLegNode.create('Member', RawNode.createWithSql(key))

    return new JSONPathBuilder({
      node: ReferenceNode.is(this.#props.node)
        ? ReferenceNode.cloneWithJSONPath(
            this.#props.node,
            JSONPathNode.cloneWithLeg(this.#props.node.jsonPath!, legNode)
          )
        : JSONPathNode.cloneWithLeg(this.#props.node, legNode),
    })
  }
}

interface JSONPathBuilderProps {
  node: ReferenceNode | JSONPathNode
}
