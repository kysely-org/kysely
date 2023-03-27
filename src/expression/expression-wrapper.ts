import { AliasNode } from '../operation-node/alias-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { AliasedExpression, Expression } from './expression.js'

export class ExpressionWrapper<T> implements Expression<T> {
  readonly #node: OperationNode

  constructor(node: OperationNode) {
    this.#node = node
  }

  /** @private */
  get expressionType(): T | undefined {
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
  as<A extends string>(alias: A): AliasedExpression<T, A>
  as<A extends string>(alias: Expression<unknown>): AliasedExpression<T, A>
  as(alias: string | Expression<any>): AliasedExpression<T, string> {
    return new AliasedExpressionWrapper(this, alias)
  }

  /**
   * Change the output type of the raw expression.
   *
   * This method call doesn't change the SQL in any way. This methods simply
   * returns a copy of this `ExpressionWrapper` with a new output type.
   */
  $castTo<T>(): ExpressionWrapper<T> {
    return new ExpressionWrapper(this.#node)
  }

  toOperationNode(): OperationNode {
    return this.#node
  }
}

export class AliasedExpressionWrapper<T, A extends string>
  implements AliasedExpression<T, A>
{
  readonly #expr: Expression<T>
  readonly #alias: A | Expression<unknown>

  constructor(expr: Expression<T>, alias: A | Expression<unknown>) {
    this.#expr = expr
    this.#alias = alias
  }

  /** @private */
  get expression(): Expression<T> {
    return this.#expr
  }

  /** @private */
  get alias(): A | Expression<unknown> {
    return this.#alias
  }

  toOperationNode(): AliasNode {
    return AliasNode.create(
      this.#expr.toOperationNode(),
      isOperationNodeSource(this.#alias)
        ? this.#alias.toOperationNode()
        : IdentifierNode.create(this.#alias)
    )
  }
}
