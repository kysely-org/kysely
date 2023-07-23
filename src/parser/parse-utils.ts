import { JoinNode, JoinType } from '../operation-node/join-node.js'
import { OverNode } from '../operation-node/over-node.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import { JoinBuilder } from '../query-builder/join-builder.js'
import { OverBuilder } from '../query-builder/over-builder.js'
import {
  SelectQueryBuilder,
  createSelectQueryBuilder as newSelectQueryBuilder,
} from '../query-builder/select-query-builder.js'
import { QueryCreator } from '../query-creator.js'
import { NOOP_QUERY_EXECUTOR } from '../query-executor/noop-query-executor.js'
import { createQueryId } from '../util/query-id.js'
import {
  parseTableExpression,
  parseTableExpressionOrList,
  TableExpression,
} from './table-parser.js'

export function createSelectQueryBuilder(): SelectQueryBuilder<any, any, any> {
  return newSelectQueryBuilder({
    queryId: createQueryId(),
    executor: NOOP_QUERY_EXECUTOR,
    queryNode: SelectQueryNode.createFrom(parseTableExpressionOrList([])),
  })
}

export function createQueryCreator(): QueryCreator<any> {
  return new QueryCreator({
    executor: NOOP_QUERY_EXECUTOR,
  })
}

export function createJoinBuilder(
  joinType: JoinType,
  table: TableExpression<any, any>
): JoinBuilder<any, any> {
  return new JoinBuilder({
    joinNode: JoinNode.create(joinType, parseTableExpression(table)),
  })
}

export function createOverBuilder(): OverBuilder<any, any> {
  return new OverBuilder({
    overNode: OverNode.create(),
  })
}
