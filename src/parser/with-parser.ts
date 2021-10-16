import { IdentifierNode } from '../operation-node/identifier-node.js'
import { CommonTableExpressionNode } from '../operation-node/common-table-expression-node.js'
import { QueryBuilder } from '../query-builder/query-builder.js'
import { QueryCreator } from '../query-creator.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'
import { AnyRawBuilder } from '../query-builder/type-utils.js'
import { NoopQueryExecutor } from '../query-executor/noop-query-executor.js'

export type CommonTableExpression<DB> = (
  creator: QueryCreator<DB>
) => QueryBuilder<DB, any> | AnyRawBuilder

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
  const builder = expression(new QueryCreator(new NoopQueryExecutor()))

  return CommonTableExpressionNode.create(
    IdentifierNode.create(name),
    builder.toOperationNode()
  )
}
