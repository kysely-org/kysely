import {
  AliasableExpression,
  AliasedExpression,
  Expression,
} from '../expression/expression.js'
import { AliasNode } from '../operation-node/alias-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { JSONOperatorChainNode } from '../operation-node/json-operator-chain-node.js'
import {
  JSONPathLegNode,
  JSONPathLegType,
} from '../operation-node/json-path-leg-node.js'
import { JSONPathNode } from '../operation-node/json-path-node.js'
import { JSONReferenceNode } from '../operation-node/json-reference-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { ValueNode } from '../operation-node/value-node.js'

export class JSONPathBuilder<S, O = S> {
  readonly #node: JSONReferenceNode | JSONPathNode

  constructor(node: JSONReferenceNode | JSONPathNode) {
    this.#node = node
  }

  /**
   * Access an element of a JSON array in a specific location.
   *
   * Since there's no guarantee an element exists in the given array location, the
   * resulting type is always nullable. If you're sure the element exists, you
   * should use {@link SelectQueryBuilder.$assertType} to narrow the type safely.
   *
   * See also {@link key} to access properties of JSON objects.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person').select(eb =>
   *   eb.ref('nicknames', '->').at(0).as('primary_nickname')
   * )
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "nicknames"->0 as "primary_nickname" from "person"
   *```
   *
   * Combined with {@link key}:
   *
   * ```ts
   * db.selectFrom('person').select(eb =>
   *   eb.ref('experience', '->').at(0).key('role').as('first_role')
   * )
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "experience"->0->'role' as "first_role" from "person"
   * ```
   *
   * You can use `'last'` to access the last element of the array in MySQL:
   *
   * ```ts
   * db.selectFrom('person').select(eb =>
   *   eb.ref('nicknames', '->$').at('last').as('last_nickname')
   * )
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * select `nicknames`->'$[last]' as `last_nickname` from `person`
   * ```
   *
   * Or `'#-1'` in SQLite:
   *
   * ```ts
   * db.selectFrom('person').select(eb =>
   *   eb.ref('nicknames', '->>$').at('#-1').as('last_nickname')
   * )
   * ```
   *
   * The generated SQL (SQLite):
   *
   * ```sql
   * select "nicknames"->>'$[#-1]' as `last_nickname` from `person`
   * ```
   */
  at<
    I extends any[] extends O ? number | 'last' | `#-${number}` : never,
    O2 = null | NonNullable<NonNullable<O>[keyof NonNullable<O> & number]>,
  >(
    index: `${I}` extends `${any}.${any}` | `#--${any}` ? never : I,
  ): TraversedJSONPathBuilder<S, O2> {
    return this.#createBuilderWithPathLeg('ArrayLocation', index)
  }

  /**
   * Access a property of a JSON object.
   *
   * If a field is optional, the resulting type will be nullable.
   *
   * See also {@link at} to access elements of JSON arrays.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person').select(eb =>
   *   eb.ref('address', '->').key('city').as('city')
   * )
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "address"->'city' as "city" from "person"
   * ```
   *
   * Going deeper:
   *
   * ```ts
   * db.selectFrom('person').select(eb =>
   *   eb.ref('profile', '->$').key('website').key('url').as('website_url')
   * )
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * select `profile`->'$.website.url' as `website_url` from `person`
   * ```
   *
   * Combined with {@link at}:
   *
   * ```ts
   * db.selectFrom('person').select(eb =>
   *   eb.ref('profile', '->').key('addresses').at(0).key('city').as('city')
   * )
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "profile"->'addresses'->0->'city' as "city" from "person"
   * ```
   */
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
        : // when the object has non-specific keys, e.g. Record<string, T>, should infer `T | null`!
          string extends keyof NonNullable<O>
          ? null | NonNullable<NonNullable<O>[K]>
          : NonNullable<O>[K],
  >(key: K): TraversedJSONPathBuilder<S, O2> {
    return this.#createBuilderWithPathLeg('Member', key)
  }

  #createBuilderWithPathLeg(
    legType: JSONPathLegType,
    value: string | number,
  ): TraversedJSONPathBuilder<any, any> {
    if (JSONReferenceNode.is(this.#node)) {
      return new TraversedJSONPathBuilder(
        JSONReferenceNode.cloneWithTraversal(
          this.#node,
          JSONPathNode.is(this.#node.traversal)
            ? JSONPathNode.cloneWithLeg(
                this.#node.traversal,
                JSONPathLegNode.create(legType, value),
              )
            : JSONOperatorChainNode.cloneWithValue(
                this.#node.traversal,
                ValueNode.createImmediate(value),
              ),
        ),
      )
    }

    return new TraversedJSONPathBuilder(
      JSONPathNode.cloneWithLeg(
        this.#node,
        JSONPathLegNode.create(legType, value),
      ),
    )
  }
}

export class TraversedJSONPathBuilder<S, O>
  extends JSONPathBuilder<S, O>
  implements AliasableExpression<O>
{
  readonly #node: JSONReferenceNode | JSONPathNode

  constructor(node: JSONReferenceNode | JSONPathNode) {
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
   *     eb('first_name', '=', 'Jennifer').as('is_jennifer')
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
  $castTo<O2>(): TraversedJSONPathBuilder<S, O2> {
    return new TraversedJSONPathBuilder(this.#node)
  }

  $notNull(): TraversedJSONPathBuilder<S, Exclude<O, null>> {
    return new TraversedJSONPathBuilder(this.#node)
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
    alias: A | Expression<unknown>,
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
        : IdentifierNode.create(this.#alias),
    )
  }
}
