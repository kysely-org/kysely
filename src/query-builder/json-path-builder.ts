import { Expression } from '../expression/expression.js'
import { JSONPathLegNode } from '../operation-node/json-path-leg-node.js'
import { JSONPathNode } from '../operation-node/json-path-node.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import {
  ExtractTypeFromReferenceExpression,
  StringReference,
} from '../parser/reference-parser.js'
import { freeze } from '../util/object-utils.js'

export class JSONPathBuilder<DB, TB extends keyof DB> {
  /**
   * Sets the JSON path scope (also known as $, or the root document).
   *
   * TODO: ...
   */
  $<S extends StringReference<DB, TB>>(
    scope: S
  ): BoundJSONPathBuilder<ExtractTypeFromReferenceExpression<DB, TB, S>> {
    return createBoundJSONPathBuilder(scope)
  }
}

export class BoundJSONPathBuilder<S, O = S> implements Expression<O> {
  readonly #props: BoundJSONPathBuilderProps

  constructor(props: BoundJSONPathBuilderProps) {
    this.#props = freeze({ ...props })
  }

  get expressionType(): O | undefined {
    return undefined
  }

  /**
   * TODO: ...
   */
  at<I extends any[] extends O ? keyof NonNullable<O> & number : never>(
    index: I
  ): BoundJSONPathBuilder<
    S,
    undefined extends O
      ? null | NonNullable<NonNullable<O>[I]>
      : null extends O
      ? null | NonNullable<NonNullable<O>[I]>
      : NonNullable<O>[I]
  > {
    return new BoundJSONPathBuilder({
      node: JSONPathNode.cloneWithLeg(
        this.#props.node,
        JSONPathLegNode.create(
          'ArrayLocation',
          RawNode.createWithSql(`${index}`)
        )
      ),
    })
  }

  /**
   * TODO: ...
   */
  key<
    K extends any[] extends O
      ? never
      : NonNullable<O> extends object
      ? keyof NonNullable<O> & string
      : never
  >(
    key: K
  ): BoundJSONPathBuilder<
    S,
    undefined extends O
      ? null | NonNullable<NonNullable<O>[K]>
      : null extends O
      ? null | NonNullable<NonNullable<O>[K]>
      : NonNullable<O>[K]
  > {
    return new BoundJSONPathBuilder({
      node: JSONPathNode.cloneWithLeg(
        this.#props.node,
        JSONPathLegNode.create('Member', RawNode.createWithSql(key))
      ),
    })
  }

  toOperationNode(): OperationNode {
    return this.#props.node
  }
}

interface BoundJSONPathBuilderProps {
  node: JSONPathNode
}

export function createBoundJSONPathBuilder<
  DB,
  TB extends keyof DB,
  S extends StringReference<DB, TB>
>(
  scope?: S
): BoundJSONPathBuilder<ExtractTypeFromReferenceExpression<DB, TB, S>> {
  return new BoundJSONPathBuilder({
    node: JSONPathNode.create(),
  })
}
