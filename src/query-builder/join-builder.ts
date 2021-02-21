import { cloneJoinNodeWithOn, JoinNode } from '../operation-node/join-node'
import { OperationNodeSource } from '../operation-node/operation-node-source'
import { cloneQueryNodeWithFroms } from '../operation-node/query-node'
import { RawBuilder } from '../raw-builder/raw-builder'
import {
  parseFromArgs,
  TableArg,
  FromQueryBuilder,
} from './methods/from-method'
import {
  parseFilterReferenceArgs,
  FilterReferenceArg,
  FilterOperatorArg,
} from './methods/filter-method'
import { QueryBuilder } from './query-builder'

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
    const query = new QueryBuilder<DB, TB, O>()

    return new QueryBuilder(
      cloneQueryNodeWithFroms(
        query.toOperationNode(),
        parseFromArgs(query, table)
      )
    )
  }

  /**
   *
   */
  on(
    lhs: FilterReferenceArg<DB, TB, O>,
    op: FilterOperatorArg,
    rhs: FilterReferenceArg<DB, TB, O>
  ): JoinBuilder<DB, TB, O> {
    const query = new QueryBuilder<DB, TB, O>()

    return new JoinBuilder(
      cloneJoinNodeWithOn(
        this.#joinNode,
        'and',
        parseFilterReferenceArgs(query, lhs, op, rhs)
      )
    )
  }

  toOperationNode(): JoinNode {
    return this.#joinNode
  }
}
