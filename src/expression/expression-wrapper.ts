import { AliasNode } from '../operation-node/alias-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { AliasedExpression, Expression } from './expression.js'

export class ExpressionWrapper<T> implements Expression<T> {
  #node: OperationNode

  constructor(node: OperationNode) {
    this.#node = node
  }

  /** @private */
  get expressionType(): T | undefined {
    return undefined
  }

  as<A extends string>(alias: A): AliasedExpression<T, A>
  as<A extends string>(alias: Expression<unknown>): AliasedExpression<T, A>
  as(alias: string | Expression<any>): AliasedExpression<T, string> {
    return new AliasedExpressionWrapper(this, alias)
  }

  toOperationNode(): OperationNode {
    return this.#node
  }
}

export class AliasedExpressionWrapper<T, A extends string>
  implements AliasedExpression<T, A>
{
  #expr: Expression<T>
  #alias: A | Expression<unknown>

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
