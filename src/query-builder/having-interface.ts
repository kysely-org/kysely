import {
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
} from '../parser/binary-operation-parser.js'
import { ExpressionOrFactory } from '../parser/expression-parser.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import { SqlBool, TableNames } from '../util/type-utils.js'

export interface HavingInterface<DB extends TB, TB extends TableNames> {
  /**
   * Just like {@link WhereInterface.where | where} but adds a `having` statement
   * instead of a `where` statement.
   */
  having<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): HavingInterface<DB, TB>

  having(
    expression: ExpressionOrFactory<DB, TB, SqlBool>
  ): HavingInterface<DB, TB>

  /**
   * Just like {@link WhereInterface.whereRef | whereRef} but adds a `having` statement
   * instead of a `where` statement.
   */
  havingRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): HavingInterface<DB, TB>
}
