import { cloneJoinNodeWithOn, JoinNode } from '../operation-node/join-node'
import { OperationNodeSource } from '../operation-node/operation-node-source'
import { RawBuilder } from '../raw-builder/raw-builder'
import {
  parseTableExpressionOrList,
  TableExpression,
  QueryBuilderWithTable,
} from './parsers/table-parser'
import {
  FilterOperatorArg,
  parseReferenceFilterArgs,
} from './parsers/filter-parser'
import { QueryBuilder } from './query-builder'
import { ReferenceExpression } from './parsers/reference-parser'
import { createSelectQueryNodeWithFromItems } from '../operation-node/select-query-node'

export class JoinBuilder<DB, TB extends keyof DB, O = {}>
  implements OperationNodeSource {
  readonly #joinNode: JoinNode

  constructor(joinNode: JoinNode) {
    this.#joinNode = joinNode
  }

  /**
   *
   */
  raw<T = unknown>(sql: string, args?: any[]): RawBuilder<T> {
    return new RawBuilder(sql, args)
  }

  /**
   *
   */
  subQuery<F extends TableExpression<DB, TB, O>>(
    from: F[]
  ): QueryBuilderWithTable<DB, TB, O, F>

  /**
   *
   */
  subQuery<F extends TableExpression<DB, TB, O>>(
    from: F
  ): QueryBuilderWithTable<DB, TB, O, F>

  subQuery(table: any): any {
    return new QueryBuilder({
      queryNode: createSelectQueryNodeWithFromItems(
        parseTableExpressionOrList(table)
      ),
    })
  }

  /**
   *
   */
  on(
    lhs: ReferenceExpression<DB, TB, O>,
    op: FilterOperatorArg,
    rhs: ReferenceExpression<DB, TB, O>
  ): JoinBuilder<DB, TB, O> {
    return new JoinBuilder(
      cloneJoinNodeWithOn(
        this.#joinNode,
        'and',
        parseReferenceFilterArgs(lhs, op, rhs)
      )
    )
  }

  toOperationNode(): JoinNode {
    return this.#joinNode
  }
}
