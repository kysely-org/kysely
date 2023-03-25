import { Expression } from '../expression/expression.js'
import { OperationNode } from '../operation-node/operation-node.js'
import {
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
} from '../parser/binary-operation-parser.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import { ExistsExpression } from '../parser/unary-operation-parser.js'
import { ExpressionBuilder } from './expression-builder.js'

/**
 * Temporary transitional wrapper type that contains the old `HavingGrouper` methods
 * and the new `ExpressionBuilder` interface. One we remove the deprecated methods,
 * this interface can be ditched in favor of just `ExpressionBuilder`.
 */
export interface HavingExpressionBuilder<DB, TB extends keyof DB>
  extends ExpressionBuilder<DB, TB> {
  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  having<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): HavingExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  having(
    grouper: HavingExpressionBuilder<DB, TB>
  ): HavingExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  having(expression: Expression<any>): HavingExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  havingRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): HavingExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orHaving<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): HavingExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orHaving(
    grouper: HavingExpressionBuilder<DB, TB>
  ): HavingExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orHaving(expression: Expression<any>): HavingExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orHavingRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): HavingExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  havingExists(arg: ExistsExpression<DB, TB>): HavingExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  havingNotExists(
    arg: ExistsExpression<DB, TB>
  ): HavingExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orHavingExists(arg: ExistsExpression<DB, TB>): HavingExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orHavingNotExists(
    arg: ExistsExpression<DB, TB>
  ): HavingExpressionBuilder<DB, TB>

  toOperationNode(): OperationNode
}
