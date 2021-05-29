import { cloneJoinNodeWithOn, JoinNode } from '../operation-node/join-node'
import { OperationNodeSource } from '../operation-node/operation-node-source'
import {
  parseTableExpressionOrList,
  TableExpression,
  QueryBuilderWithTable,
} from '../parser/table-parser'
import {
  FilterOperatorArg,
  parseFilterArgs,
  parseReferenceFilterArgs,
} from '../parser/filter-parser'
import { QueryBuilder } from './query-builder'
import { ReferenceExpression } from '../parser/reference-parser'
import { createSelectQueryNodeWithFromItems } from '../operation-node/select-query-node'
import { ValueExpressionOrList } from '../parser/value-parser'

export class JoinBuilder<DB, TB extends keyof DB>
  implements OperationNodeSource {
  readonly #joinNode: JoinNode

  constructor(joinNode: JoinNode) {
    this.#joinNode = joinNode
  }

  /**
   * This method can be used to start a subquery.
   *
   * Works just like {@link QueryBuilder.subQuery}.
   */
  subQuery<F extends TableExpression<DB, TB>>(
    from: F[]
  ): QueryBuilderWithTable<DB, TB, {}, F>

  subQuery<F extends TableExpression<DB, TB>>(
    from: F
  ): QueryBuilderWithTable<DB, TB, {}, F>

  subQuery(table: any): any {
    return new QueryBuilder({
      queryNode: createSelectQueryNodeWithFromItems(
        parseTableExpressionOrList(table)
      ),
    })
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
  ): JoinBuilder<DB, TB> {
    return new JoinBuilder(
      cloneJoinNodeWithOn(
        this.#joinNode,
        'and',
        parseFilterArgs([lhs, op, rhs])
      )
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

  toOperationNode(): JoinNode {
    return this.#joinNode
  }
}
