import { DialectAdapter } from '../dialect/dialect-adapter.js'
import { JoinNode, JoinType } from '../operation-node/join-node.js'
import { TableExpressionNode } from '../operation-node/operation-node-utils.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { JoinBuilder } from '../query-builder/join-builder.js'
import { QueryBuilder } from '../query-builder/query-builder.js'
import { SubQueryBuilder } from '../query-builder/sub-query-builder.js'
import { QueryCreator } from '../query-creator.js'
import { NoopQueryExecutor } from '../query-executor/noop-query-executor.js'
import { freeze } from '../util/object-utils.js'
import { createQueryId } from '../util/query-id.js'

export interface ParseContext {
  createEmptySelectQuery(): QueryBuilder<any, any>
  createSubQueryBuilder(): SubQueryBuilder<any, any>
  createQueryCreator(): QueryCreator<any>
  createJoinBuilder(
    joinType: JoinType,
    tableNode: TableExpressionNode
  ): JoinBuilder<any, any>
}

export function createParseContext(adapter: DialectAdapter): ParseContext {
  return freeze({
    createEmptySelectQuery(): QueryBuilder<any, any> {
      return new QueryBuilder({
        queryId: createQueryId(),
        executor: new NoopQueryExecutor(),
        queryNode: SelectQueryNode.create([]),
        adapter,
      })
    },

    createSubQueryBuilder(): SubQueryBuilder<any, any> {
      return new SubQueryBuilder({
        executor: new NoopQueryExecutor(),
        adapter,
      })
    },

    createQueryCreator(): QueryCreator<any> {
      return new QueryCreator({
        executor: new NoopQueryExecutor(),
        adapter,
      })
    },

    createJoinBuilder(
      joinType: JoinType,
      tableNode: TableExpressionNode
    ): JoinBuilder<any, any> {
      return new JoinBuilder({
        joinNode: JoinNode.create(joinType, tableNode),
        adapter,
      })
    },
  })
}
