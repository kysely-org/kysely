import { SelectQueryBuilder } from '../query-builder/select-query-builder.js'
import { UpdateQueryBuilder } from '../query-builder/update-query-builder.js'
import { DeleteQueryBuilder } from '../query-builder/delete-query-builder.js'
import { InsertQueryBuilder } from '../query-builder/insert-query-builder.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { CommonTableExpressionNode } from '../operation-node/common-table-expression-node.js'
import { QueryCreator } from '../query-creator.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'
import { AnyRawBuilder } from '../util/type-utils.js'
import { ParseContext } from './parse-context.js'

export type CommonTableExpression<DB> = (
  creator: QueryCreator<DB>
) =>
  | SelectQueryBuilder<DB, any, any>
  | InsertQueryBuilder<DB, any, any>
  | UpdateQueryBuilder<DB, any, any>
  | DeleteQueryBuilder<DB, any, any>
  | AnyRawBuilder

export type QueryCreatorWithCommonTableExpression<
  DB,
  N extends string,
  E extends CommonTableExpression<DB>
> = QueryCreator<DB & Record<N, ExtractRowTypeFromCommonTableExpression<E>>>

type ExtractRowTypeFromCommonTableExpression<E> = E extends (
  creator: QueryCreator<any>
) => infer Q
  ? Q extends SelectQueryBuilder<any, any, infer QO>
    ? QO
    : Q extends InsertQueryBuilder<any, any, infer QO>
    ? QO
    : Q extends UpdateQueryBuilder<any, any, infer QO>
    ? QO
    : Q extends DeleteQueryBuilder<any, any, infer QO>
    ? QO
    : Q extends RawBuilder<infer RO>
    ? RO
    : never
  : never

export function parseCommonTableExpression(
  ctx: ParseContext,
  name: string,
  expression: CommonTableExpression<any>
): CommonTableExpressionNode {
  const builder = expression(ctx.createQueryCreator())

  return CommonTableExpressionNode.create(
    IdentifierNode.create(name),
    builder.toOperationNode()
  )
}
