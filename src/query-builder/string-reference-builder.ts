import {
  AliasedExpressionWrapper,
  ExpressionWrapper,
} from '../expression/expression-wrapper.js'
import { AliasedExpression, Expression } from '../expression/expression.js'
import { JSONPathNode } from '../operation-node/json-path-node.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { JSONOperator } from '../operation-node/operator-node.js'
import { ReferenceNode } from '../operation-node/reference-node.js'
import { freeze } from '../util/object-utils.js'
import { JSONPathBuilder } from './json-path-builder.js'

export class StringReferenceBuilder<S, O = S> implements Expression<O> {
  readonly #props: StringReferenceBuilderProps

  constructor(props: StringReferenceBuilderProps) {
    this.#props = freeze({ ...props })
  }

  /** @private */
  get expressionType(): O | undefined {
    return undefined
  }

  /**
   * TODO:
   * eb.ref('column').op('->>').at(0) ==> column->>0 OR column->>$[0]
   * eb.ref('column').op('->>').key('key') ==> column->>'key' OR column->>$.key
   *
   * to leave room for Postgres-specific json patch syntax:
   * set(eb.ref('column').at(0), 2) ==> set column[0] = $1
   * set(eb.ref('column').key('key'), 'john') ===> set column[key] = $1
   */
  op(operator: JSONOperator): JSONPathBuilder<S, O> {
    return new JSONPathBuilder({
      node: ReferenceNode.cloneWithJSONPath(
        this.#props.node,
        JSONPathNode.create(operator)
      ),
    })
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
    return new AliasedExpressionWrapper(this, alias)
  }

  /**
   * Change the output type of the raw expression.
   *
   * This method call doesn't change the SQL in any way. This methods simply
   * returns a copy of this `ExpressionWrapper` with a new output type.
   */
  $castTo<T>(): ExpressionWrapper<T> {
    return new ExpressionWrapper(this.#props.node)
  }

  toOperationNode(): OperationNode {
    return this.#props.node
  }
}

interface StringReferenceBuilderProps {
  node: ReferenceNode
}
