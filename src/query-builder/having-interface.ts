import { Expression } from '../expression/expression.js'
import {
  BinaryOperatorExpression,
  HavingGrouper,
  OperandValueExpressionOrList,
} from '../parser/binary-operation-parser.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import { ExistsExpression } from '../parser/unary-operation-parser.js'

export interface HavingInterface<DB, TB extends keyof DB> {
  /**
   * Just like {@link WhereInterface.where | where} but adds a `having` statement
   * instead of a `where` statement.
   */
  having<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: BinaryOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): HavingInterface<DB, TB>

  having(grouper: HavingGrouper<DB, TB>): HavingInterface<DB, TB>
  having(expression: Expression<any>): HavingInterface<DB, TB>

  /**
   * Just like {@link WhereInterface.whereRef | whereRef} but adds a `having` statement
   * instead of a `where` statement.
   */
  havingRef(
    lhs: ReferenceExpression<DB, TB>,
    op: BinaryOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): HavingInterface<DB, TB>

  /**
   * Just like {@link WhereInterface.orWhere | orWhere} but adds a `having` statement
   * instead of a `where` statement.
   */
  orHaving<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: BinaryOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): HavingInterface<DB, TB>

  orHaving(grouper: HavingGrouper<DB, TB>): HavingInterface<DB, TB>
  orHaving(expression: Expression<any>): HavingInterface<DB, TB>

  /**
   * Just like {@link WhereInterface.orWhereRef | orWhereRef} but adds a `having` statement
   * instead of a `where` statement.
   */
  orHavingRef(
    lhs: ReferenceExpression<DB, TB>,
    op: BinaryOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): HavingInterface<DB, TB>

  /**
   * Just like {@link WhereInterface.whereExists | whereExists} but adds a `having` statement
   * instead of a `where` statement.
   */
  havingExists(arg: ExistsExpression<DB, TB>): HavingInterface<DB, TB>

  /**
   * Just like {@link WhereInterface.whereNotExists | whereNotExists} but adds a `having` statement
   * instead of a `where` statement.
   */
  havingNotExist(arg: ExistsExpression<DB, TB>): HavingInterface<DB, TB>

  /**
   * Just like {@link WhereInterface.orWhereExists | orWhereExists} but adds a `having` statement
   * instead of a `where` statement.
   */
  orHavingExists(arg: ExistsExpression<DB, TB>): HavingInterface<DB, TB>

  /**
   * Just like {@link WhereInterface.orWhereNotExists | orWhereNotExists} but adds a `having` statement
   * instead of a `where` statement.
   */
  orHavingNotExists(arg: ExistsExpression<DB, TB>): HavingInterface<DB, TB>
}
