import type { AliasableExpression } from '../expression/expression.js'
import type { SelectQueryNode } from '../operation-node/select-query-node.js'

export interface SelectQueryBuilderExpression<
  out O,
> extends AliasableExpression<O> {
  get isSelectQueryBuilder(): true
  toOperationNode(): SelectQueryNode
}
