import { JoinNode } from '../operation-node/join-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import {
  ExistsExpression,
  FilterOperator,
  parseExistFilter,
  parseNotExistFilter,
  parseOnFilter,
  parseReferenceFilter,
} from '../parser/filter-parser.js'
import { ParseContext } from '../parser/parse-context.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import { ValueExpressionOrList } from '../parser/value-parser.js'
import { freeze } from '../util/object-utils.js'
import { preventAwait } from '../util/prevent-await.js'
import { AnyRawBuilder } from '../util/type-utils.js'

export class JoinBuilder<DB, TB extends keyof DB>
  implements OperationNodeSource
{
  readonly #props: JoinBuilderProps

  constructor(props: JoinBuilderProps) {
    this.#props = freeze(props)
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

  on(raw: AnyRawBuilder): JoinBuilder<DB, TB>

  on(...args: any[]): JoinBuilder<DB, TB> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOn(
        this.#props.joinNode,
        parseOnFilter(this.#props.parseContext, args)
      ),
    })
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

  orOn(raw: AnyRawBuilder): JoinBuilder<DB, TB>

  orOn(...args: any[]): JoinBuilder<DB, TB> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOrOn(
        this.#props.joinNode,
        parseOnFilter(this.#props.parseContext, args)
      ),
    })
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
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOn(
        this.#props.joinNode,
        parseReferenceFilter(this.#props.parseContext, lhs, op, rhs)
      ),
    })
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
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOrOn(
        this.#props.joinNode,
        parseReferenceFilter(this.#props.parseContext, lhs, op, rhs)
      ),
    })
  }

  /**
   * Just like {@link QueryBuilder.whereExists} but adds an item to the join's
   * `on` clause instead.
   *
   * See {@link QueryBuilder.whereExists} for documentation and examples.
   */
  onExists(arg: ExistsExpression<DB, TB>): JoinBuilder<DB, TB> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOn(
        this.#props.joinNode,
        parseExistFilter(this.#props.parseContext, arg)
      ),
    })
  }

  /**
   * Just like {@link QueryBuilder.whereNotExists} but adds an item to the join's
   * `on` clause instead.
   *
   * See {@link QueryBuilder.whereNotExists} for documentation and examples.
   */
  onNotExists(arg: ExistsExpression<DB, TB>): JoinBuilder<DB, TB> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOn(
        this.#props.joinNode,
        parseNotExistFilter(this.#props.parseContext, arg)
      ),
    })
  }

  /**
   * Just like {@link QueryBuilder.orWhereExists} but adds an item to the join's
   * `on` clause instead.
   *
   * See {@link QueryBuilder.orWhereExists} for documentation and examples.
   */
  orOnExists(arg: ExistsExpression<DB, TB>): JoinBuilder<DB, TB> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOrOn(
        this.#props.joinNode,
        parseExistFilter(this.#props.parseContext, arg)
      ),
    })
  }

  /**
   * Just like {@link QueryBuilder.orWhereNotExists} but adds an item to the join's
   * `on` clause instead.
   *
   * See {@link QueryBuilder.orWhereNotExists} for documentation and examples.
   */
  orOnNotExists(arg: ExistsExpression<DB, TB>): JoinBuilder<DB, TB> {
    return new JoinBuilder({
      ...this.#props,
      joinNode: JoinNode.cloneWithOrOn(
        this.#props.joinNode,
        parseNotExistFilter(this.#props.parseContext, arg)
      ),
    })
  }

  toOperationNode(): JoinNode {
    return this.#props.joinNode
  }
}

preventAwait(
  JoinBuilder,
  "don't await JoinBuilder instances. They are never executed directly and are always just a part of a query."
)

export interface JoinBuilderProps {
  readonly joinNode: JoinNode
  readonly parseContext: ParseContext
}
