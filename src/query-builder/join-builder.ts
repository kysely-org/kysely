import { JoinNode, joinNode } from '../operation-node/join-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import {
  ExistsExpression,
  FilterOperator,
  parseExistExpression,
  parseFilter,
  parseReferenceFilter,
} from '../parser/filter-parser.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import { ValueExpressionOrList } from '../parser/value-parser.js'
import { preventAwait } from '../util/prevent-await.js'

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
  on<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: FilterOperator,
    rhs: ValueExpressionOrList<DB, TB, RE>
  ): JoinBuilder<DB, TB>

  on(
    grouper: (qb: JoinBuilder<DB, TB>) => JoinBuilder<DB, TB>
  ): JoinBuilder<DB, TB>

  on(...args: any[]): JoinBuilder<DB, TB> {
    return new JoinBuilder(
      joinNode.cloneWithOn(this.#joinNode, 'and', parseFilter('On', args))
    )
  }

  /**
   * Just like {@link QueryBuilder.orWhere} but adds an item to the join's
   * `on` clause instead.
   *
   * See {@link QueryBuilder.orWhere} for documentation and examples.
   */
  orOn<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: FilterOperator,
    rhs: ValueExpressionOrList<DB, TB, RE>
  ): JoinBuilder<DB, TB>

  orOn(
    grouper: (qb: JoinBuilder<DB, TB>) => JoinBuilder<DB, TB>
  ): JoinBuilder<DB, TB>

  orOn(...args: any[]): JoinBuilder<DB, TB> {
    return new JoinBuilder(
      joinNode.cloneWithOn(this.#joinNode, 'or', parseFilter('On', args))
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
    op: FilterOperator,
    rhs: ReferenceExpression<DB, TB>
  ): JoinBuilder<DB, TB> {
    return new JoinBuilder(
      joinNode.cloneWithOn(
        this.#joinNode,
        'and',
        parseReferenceFilter(lhs, op, rhs)
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
    op: FilterOperator,
    rhs: ReferenceExpression<DB, TB>
  ): JoinBuilder<DB, TB> {
    return new JoinBuilder(
      joinNode.cloneWithOn(
        this.#joinNode,
        'or',
        parseReferenceFilter(lhs, op, rhs)
      )
    )
  }

  /**
   * Just like {@link QueryBuilder.whereExists} but adds an item to the join's
   * `on` clause instead.
   *
   * See {@link QueryBuilder.whereExists} for documentation and examples.
   */
  onExists(arg: ExistsExpression<DB, TB>): JoinBuilder<DB, TB> {
    return new JoinBuilder(
      joinNode.cloneWithOn(
        this.#joinNode,
        'and',
        parseExistExpression('exists', arg)
      )
    )
  }

  /**
   * Just like {@link QueryBuilder.whereNotExists} but adds an item to the join's
   * `on` clause instead.
   *
   * See {@link QueryBuilder.whereNotExists} for documentation and examples.
   */
  onNotExists(arg: ExistsExpression<DB, TB>): JoinBuilder<DB, TB> {
    return new JoinBuilder(
      joinNode.cloneWithOn(
        this.#joinNode,
        'and',
        parseExistExpression('not exists', arg)
      )
    )
  }

  /**
   * Just like {@link QueryBuilder.orWhereExists} but adds an item to the join's
   * `on` clause instead.
   *
   * See {@link QueryBuilder.orWhereExists} for documentation and examples.
   */
  orOnExists(arg: ExistsExpression<DB, TB>): JoinBuilder<DB, TB> {
    return new JoinBuilder(
      joinNode.cloneWithOn(
        this.#joinNode,
        'or',
        parseExistExpression('exists', arg)
      )
    )
  }

  /**
   * Just like {@link QueryBuilder.orWhereNotExists} but adds an item to the join's
   * `on` clause instead.
   *
   * See {@link QueryBuilder.orWhereNotExists} for documentation and examples.
   */
  orOnNotExists(arg: ExistsExpression<DB, TB>): JoinBuilder<DB, TB> {
    return new JoinBuilder(
      joinNode.cloneWithOn(
        this.#joinNode,
        'or',
        parseExistExpression('not exists', arg)
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
