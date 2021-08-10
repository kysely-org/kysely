import { identifierNode } from '../operation-node/identifier-node'
import {
  commonTableExpressionNode,
  CommonTableExpressionNode,
} from '../operation-node/common-table-expression-node'
import { QueryBuilder } from '../query-builder/query-builder'
import { QueryCreator } from '../query-creator'
import { RawBuilder } from '../raw-builder/raw-builder'
import { NeverExecutingQueryExecutor } from '../util/query-executor'

export type CommonTableExpression<DB> = (
  creator: QueryCreator<DB>
) => QueryBuilder<DB, any> | RawBuilder<any>

export type QueryCreatorWithCommonTableExpression<
  DB,
  N extends string,
  E extends CommonTableExpression<DB>
> = QueryCreator<DB & Record<N, ExtractRowTypeFromCommonTableExpression<E>>>

type ExtractRowTypeFromCommonTableExpression<E> = E extends (
  creator: QueryCreator<any>
) => infer Q
  ? Q extends QueryBuilder<any, any, infer QO>
    ? QO
    : Q extends RawBuilder<infer RO>
    ? RO
    : never
  : never

export function parseCommonTableExpression(
  name: string,
  expression: CommonTableExpression<any>
): CommonTableExpressionNode {
  const builder = expression(
    new QueryCreator(new NeverExecutingQueryExecutor())
  )

  return commonTableExpressionNode.create(
    identifierNode.create(name),
    builder.toOperationNode()
  )
}
