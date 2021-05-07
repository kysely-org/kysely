import { cloneJoinNodeWithOn, JoinNode } from '../operation-node/join-node'
import { OperationNodeSource } from '../operation-node/operation-node-source'
import { RawBuilder } from '../raw-builder/raw-builder'
import {
  parseFromArgs,
  TableArg,
  FromQueryBuilder,
} from './parsers/from-parser'
import {
  FilterOperatorArg,
  parseReferenceFilterArgs,
} from './parsers/filter-parser'
import { QueryBuilder } from './query-builder'
import { createQueryNodeWithSelectFromItems } from '../operation-node/query-node'
import { ReferenceExpression } from './parsers/reference-parser'

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
  subQuery<F extends TableArg<DB, TB, O>>(
    from: F[]
  ): FromQueryBuilder<DB, TB, O, F>

  /**
   *
   */
  subQuery<F extends TableArg<DB, TB, O>>(
    from: F
  ): FromQueryBuilder<DB, TB, O, F>

  subQuery(table: any): any {
    return new QueryBuilder({
      queryNode: createQueryNodeWithSelectFromItems(parseFromArgs(table)),
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
