import { AliasedExpression, Expression } from '../expression/expression.js'
import { AliasNode } from '../operation-node/alias-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import {
  JSONPathLegNode,
  JSONPathLegType,
} from '../operation-node/json-path-leg-node.js'
import { JSONPathNode } from '../operation-node/json-path-node.js'
import { JSONPathReferenceNode } from '../operation-node/json-path-reference-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import { ReferenceNode } from '../operation-node/reference-node.js'

export class JSONPathBuilder<S, O = S> {
  readonly #node: ReferenceNode | JSONPathNode

  constructor(node: ReferenceNode | JSONPathNode) {
    this.#node = node
  }

  at<
    I extends any[] extends O ? number | 'last' | `#-${number}` : never,
    O2 = null | NonNullable<NonNullable<O>[keyof NonNullable<O> & number]>
  >(
    index: `${I}` extends `${any}.${any}` | `#--${any}` ? never : I
  ): TraversedJSONPathBuilder<S, O2> {
    return this.#createBuilderWithPathLeg('ArrayLocation', index)
  }

  key<
    K extends any[] extends O
      ? never
      : O extends object
      ? keyof NonNullable<O> & string
      : never,
    O2 = undefined extends O
      ? null | NonNullable<NonNullable<O>[K]>
      : null extends O
      ? null | NonNullable<NonNullable<O>[K]>
      : NonNullable<O>[K]
  >(key: K): TraversedJSONPathBuilder<S, O2> {
    return this.#createBuilderWithPathLeg('Member', key)
  }

  #createBuilderWithPathLeg(
    legType: JSONPathLegType,
    value: string | number
  ): TraversedJSONPathBuilder<any, any> {
    const legNode = JSONPathLegNode.create(
      legType,
      RawNode.createWithSql(String(value))
    )

    return new TraversedJSONPathBuilder(
      ReferenceNode.is(this.#node)
        ? ReferenceNode.cloneWithJSONPath(
            this.#node,
            JSONPathReferenceNode.clone(
              this.#node.jsonPath!,
              JSONPathNode.cloneWithLeg(this.#node.jsonPath!.jsonPath, legNode)
            )
          )
        : JSONPathNode.cloneWithLeg(this.#node, legNode)
    )
  }
}

export class TraversedJSONPathBuilder<S, O>
  extends JSONPathBuilder<S, O>
  implements Expression<O>
{
  readonly #node: ReferenceNode | JSONPathNode

  constructor(node: ReferenceNode | JSONPathNode) {
    super(node)
    this.#node = node
  }

  /** @private */
  get expressionType(): O | undefined {
    return undefined
  }

  /**
   * Returns an aliased version of the expression.
   *
   * In addition to slapping `as "the_alias"` to the end of the SQL,
   * this method also provides strict typing:
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select(eb =>
   *     eb.cmpr('first_name', '=', 'Jennifer').as('is_jennifer')
   *   )
   *   .executeTakeFirstOrThrow()
   *
   * // `is_jennifer: SqlBool` field exists in the result type.
   * console.log(result.is_jennifer)
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```ts
   * select "first_name" = $1 as "is_jennifer"
   * from "person"
   * ```
   */
  as<A extends string>(alias: A): AliasedExpression<O, A>
  as<A extends string>(alias: Expression<unknown>): AliasedExpression<O, A>
  as(alias: string | Expression<any>): AliasedExpression<O, string> {
    return new AliasedJSONPathBuilder(this, alias)
  }

  /**
   * Change the output type of the json path.
   *
   * This method call doesn't change the SQL in any way. This methods simply
   * returns a copy of this `JSONPathBuilder` with a new output type.
   */
  $castTo<T>(): JSONPathBuilder<T> {
    return new JSONPathBuilder(this.#node)
  }

  toOperationNode(): OperationNode {
    return this.#node
  }
}

export class AliasedJSONPathBuilder<O, A extends string>
  implements AliasedExpression<O, A>
{
  readonly #jsonPath: TraversedJSONPathBuilder<any, O>
  readonly #alias: A | Expression<unknown>

  constructor(
    jsonPath: TraversedJSONPathBuilder<any, O>,
    alias: A | Expression<unknown>
  ) {
    this.#jsonPath = jsonPath
    this.#alias = alias
  }

  /** @private */
  get expression(): Expression<O> {
    return this.#jsonPath
  }

  /** @private */
  get alias(): A | Expression<unknown> {
    return this.#alias
  }

  toOperationNode(): AliasNode {
    return AliasNode.create(
      this.#jsonPath.toOperationNode(),
      isOperationNodeSource(this.#alias)
        ? this.#alias.toOperationNode()
        : IdentifierNode.create(this.#alias)
    )
  }
}
