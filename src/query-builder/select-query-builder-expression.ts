import { AliasableExpression } from '../expression/expression.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'

export interface SelectQueryBuilderExpression<O>
  extends AliasableExpression<O> {
  get isSelectQueryBuilder(): true
  toOperationNode(): SelectQueryNode
}
