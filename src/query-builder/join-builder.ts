import { cloneJoinNodeWithOn, JoinNode } from '../operation-node/join-node'
import { OperationNodeSource } from '../operation-node/operation-node-source'
import {
  ExistsFilterArg,
  FilterOperatorArg,
  parseExistsFilterArgs,
  parseFilterArgs,
  parseReferenceFilterArgs,
} from '../parser/filter-parser'
import { ReferenceExpression } from '../parser/reference-parser'
import { ValueExpressionOrList } from '../parser/value-parser'
import { preventAwait } from '../util/prevent-await'

export class JoinBuilder<DB, TB extends keyof DB>
  implements OperationNodeSource
{
  readonly #joinNode: JoinNode

  constructor(joinNode: JoinNode) {
    this.#joinNode = joinNode
  }

  /**
   * Just like {@link QueryBuilder.where} but adds an item to the join's
   * `on` clause instead.
   *
   * See {@link QueryBuilder.where} for documentation and examples.
   */
  on(
    lhs: ReferenceExpression<DB, TB>,
    op: FilterOperatorArg,
    rhs: ValueExpressionOrList<DB, TB>
  ): JoinBuilder<DB, TB>

  on(
    grouper: (qb: JoinBuilder<DB, TB>) => JoinBuilder<DB, TB>
  ): JoinBuilder<DB, TB>

  on(...args: any[]): JoinBuilder<DB, TB> {
    return new JoinBuilder(
      cloneJoinNodeWithOn(this.#joinNode, 'and', parseFilterArgs('On', args))
    )
  }

  /**
   * Just like {@link QueryBuilder.orWhere} but adds an item to the join's
   * `on` clause instead.
   *
   * See {@link QueryBuilder.orWhere} for documentation and examples.
   */
  orOn(
    lhs: ReferenceExpression<DB, TB>,
    op: FilterOperatorArg,
    rhs: ValueExpressionOrList<DB, TB>
  ): JoinBuilder<DB, TB>

  orOn(
    grouper: (qb: JoinBuilder<DB, TB>) => JoinBuilder<DB, TB>
  ): JoinBuilder<DB, TB>

  orOn(...args: any[]): JoinBuilder<DB, TB> {
    return new JoinBuilder(
      cloneJoinNodeWithOn(this.#joinNode, 'or', parseFilterArgs('On', args))
    )
  }

  /**
   * Just like {@link QueryBuilder.whereRef} but adds an item to the join's
   * `on` clause instead.
   *
   * See {@link QueryBuilder.whereRef} for documentation and examples.
   */
  onRef(
    lhs: ReferenceExpression<DB, TB>,
    op: FilterOperatorArg,
    rhs: ReferenceExpression<DB, TB>
  ): JoinBuilder<DB, TB> {
    return new JoinBuilder(
      cloneJoinNodeWithOn(
        this.#joinNode,
        'and',
        parseReferenceFilterArgs(lhs, op, rhs)
      )
    )
  }

  /**
   * Just like {@link QueryBuilder.orWhereRef} but adds an item to the join's
   * `on` clause instead.
   *
   * See {@link QueryBuilder.orWhereRef} for documentation and examples.
   */
  orOnRef(
    lhs: ReferenceExpression<DB, TB>,
    op: FilterOperatorArg,
    rhs: ReferenceExpression<DB, TB>
  ): JoinBuilder<DB, TB> {
    return new JoinBuilder(
      cloneJoinNodeWithOn(
        this.#joinNode,
        'or',
        parseReferenceFilterArgs(lhs, op, rhs)
      )
    )
  }

  /**
   * Just like {@link QueryBuilder.whereExists} but adds an item to the join's
   * `on` clause instead.
   *
   * See {@link QueryBuilder.whereExists} for documentation and examples.
   */
  onExists(arg: ExistsFilterArg<DB, TB>): JoinBuilder<DB, TB> {
    return new JoinBuilder(
      cloneJoinNodeWithOn(
        this.#joinNode,
        'and',
        parseExistsFilterArgs('exists', arg)
      )
    )
  }

  /**
   * Just like {@link JoinBuilder.onExists | onExists} but creates a `not exists` clause.
   */
  onNotExists(arg: ExistsFilterArg<DB, TB>): JoinBuilder<DB, TB> {
    return new JoinBuilder(
      cloneJoinNodeWithOn(
        this.#joinNode,
        'and',
        parseExistsFilterArgs('not exists', arg)
      )
    )
  }

  /**
   * Just like {@link JoinBuilder.onExists | onExists} but creates a `or exists` clause.
   */
  orOnExists(arg: ExistsFilterArg<DB, TB>): JoinBuilder<DB, TB> {
    return new JoinBuilder(
      cloneJoinNodeWithOn(
        this.#joinNode,
        'or',
        parseExistsFilterArgs('exists', arg)
      )
    )
  }

  /**
   * Just like {@link JoinBuilder.onExists | onExists} but creates a `or not exists` clause.
   */
  orOnNotExists(arg: ExistsFilterArg<DB, TB>): JoinBuilder<DB, TB> {
    return new JoinBuilder(
      cloneJoinNodeWithOn(
        this.#joinNode,
        'or',
        parseExistsFilterArgs('not exists', arg)
      )
    )
  }

  toOperationNode(): JoinNode {
    return this.#joinNode
  }
}

preventAwait(
  JoinBuilder,
  "don't await JoinBuilder instances. They are never executed directly and are always just a part of a query."
)
