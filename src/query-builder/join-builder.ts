import { JoinNode } from '../operation-node/join-node.js'
import type { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
import {
  type ComparisonOperatorExpression,
  type OperandValueExpressionOrList,
  parseValueBinaryOperationOrExpression,
  parseReferentialBinaryOperation,
} from '../parser/binary-operation-parser.js'
import type { ExpressionOrFactory } from '../parser/expression-parser.js'
import type { ReferenceExpression } from '../parser/reference-parser.js'
import { freeze } from '../util/object-utils.js'
import type { SqlBool } from '../util/type-utils.js'

export class JoinBuilder<
  DB,
  TB extends keyof DB,
> implements OperationNodeSource {
  readonly #props: JoinBuilderProps

  constructor(props: JoinBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Just like {@link WhereInterface.where} but adds an item to the join's
   * `on` clause instead.
   *
   * See {@link WhereInterface.where} for documentation and examples.
   */
  on<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>,
  ): JoinBuilder<DB, TB>

  on(expression: ExpressionOrFactory<DB, TB, SqlBool>): JoinBuilder<DB, TB>

  on(...args: any[]): JoinBuilder<DB, TB> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOn(
        this.#props.joinNode,
        parseValueBinaryOperationOrExpression(args),
      ),
    })
  }

  /**
   * Just like {@link WhereInterface.whereRef} but adds an item to the join's
   * `on` clause instead.
   *
   * See {@link WhereInterface.whereRef} for documentation and examples.
   */
  onRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>,
  ): JoinBuilder<DB, TB> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOn(
        this.#props.joinNode,
        parseReferentialBinaryOperation(lhs, op, rhs),
      ),
    })
  }

  /**
   * Adds `on true`.
   */
  onTrue(): JoinBuilder<DB, TB> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOn(
        this.#props.joinNode,
        RawNode.createWithSql('true'),
      ),
    })
  }

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  toOperationNode(): JoinNode {
    return this.#props.joinNode
  }
}

export interface JoinBuilderProps {
  readonly joinNode: JoinNode
}
