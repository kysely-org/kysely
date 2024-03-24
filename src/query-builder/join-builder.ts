import { JoinNode } from '../operation-node/join-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
import {
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
  parseValueBinaryOperationOrExpression,
  parseReferentialBinaryOperation,
} from '../parser/binary-operation-parser.js'
import { ExpressionOrFactory } from '../parser/expression-parser.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import { freeze } from '../util/object-utils.js'
import { preventAwait } from '../util/prevent-await.js'
import { SqlBool } from '../util/type-utils.js'

export class JoinBuilder<DB, TB extends keyof DB, C extends string>
  implements OperationNodeSource
{
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
  ): JoinBuilder<DB, TB, C>

  on(expression: ExpressionOrFactory<DB, TB, SqlBool>): JoinBuilder<DB, TB, C>

  on(...args: any[]): JoinBuilder<DB, TB, C> {
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
  ): JoinBuilder<DB, TB, C> {
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
  onTrue(): JoinBuilder<DB, TB, C> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOn(
        this.#props.joinNode,
        RawNode.createWithSql('true'),
      ),
    })
  }

  /**
   * Adds a `using` clause to the query.
   *
   * This clause is a non-standard shorthand for the specific situation where both
   * sides of the join use the same name for the joining column(s).
   *
   * ### Examples:
   *
   * ```ts
   * await db
   *   .selectFrom('person')
   *   .innerJoin('pet', join => join.using(['name']))
   *   .selectAll()
   *   .executeTakeFirstOrThrow()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select *
   * from "person"
   * inner join "pet" using ("name")
   * ```
   */
  using(columns: [C, ...C[]]): JoinBuilder<DB, TB, C> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithUsing(this.#props.joinNode, columns),
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

preventAwait(
  JoinBuilder,
  "don't await JoinBuilder instances. They are never executed directly and are always just a part of a query.",
)

export interface JoinBuilderProps {
  readonly joinNode: JoinNode
}
