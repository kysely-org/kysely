import { DialectAdapter } from '../dialect/dialect-adapter.js'
import { JoinNode, JoinType } from '../operation-node/join-node.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { JoinBuilder } from '../query-builder/join-builder.js'
import { SelectQueryBuilder } from '../query-builder/select-query-builder.js'
import { ExpressionBuilder } from '../query-builder/expression-builder.js'
import { QueryCreator } from '../query-creator.js'
import { NoopQueryExecutor } from '../query-executor/noop-query-executor.js'
import { createQueryId } from '../util/query-id.js'
import {
  parseTableExpression,
  parseTableExpressionOrList,
  TableExpression,
} from './table-parser.js'

/**
 * This interface exposes everything the parsers need to be able to parse
 * method calls into {@link OperationNode} trees.
 */
export interface ParseContext {
  readonly adapter: DialectAdapter

  /**
   * Creates a select query builder with a {@link NoopQueryExecutor}.
   */
  createSelectQueryBuilder(): SelectQueryBuilder<any, any>

  /**
   * Creates an expression builder for building stuff like subqueries.
   * {@link NoopQueryExecutor} is used as the executor and the queries
   * built using the returned builder can never be executed.
   */
  createExpressionBuilder(): ExpressionBuilder<any, any>

  /**
   * Creates a query creator with a {@link NoopQueryExecutor}.
   */
  createQueryCreator(): QueryCreator<any>

  /**
   * Creates an instance of a join builder.
   */
  createJoinBuilder(
    joinType: JoinType,
    table: TableExpression<any, any>
  ): JoinBuilder<any, any>
}

export class DefaultParseContext implements ParseContext {
  readonly #adapter: DialectAdapter
  readonly #noopExecutor: NoopQueryExecutor

  constructor(adapter: DialectAdapter) {
    this.#adapter = adapter
    this.#noopExecutor = new NoopQueryExecutor()
  }

  get adapter(): DialectAdapter {
    return this.#adapter
  }

  createSelectQueryBuilder(): SelectQueryBuilder<any, any> {
    return new SelectQueryBuilder({
      queryId: createQueryId(),
      executor: this.#noopExecutor,
      parseContext: this,
      queryNode: SelectQueryNode.create(parseTableExpressionOrList(this, [])),
    })
  }

  createExpressionBuilder(): ExpressionBuilder<any, any> {
    return new ExpressionBuilder({
      executor: this.#noopExecutor,
      parseContext: this,
    })
  }

  createQueryCreator(): QueryCreator<any> {
    return new QueryCreator({
      executor: this.#noopExecutor,
      parseContext: this,
    })
  }

  createJoinBuilder(
    joinType: JoinType,
    table: TableExpression<any, any>
  ): JoinBuilder<any, any> {
    return new JoinBuilder({
      joinNode: JoinNode.create(joinType, parseTableExpression(this, table)),
      parseContext: this,
    })
  }
}
