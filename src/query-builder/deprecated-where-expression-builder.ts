import { Expression } from '../expression/expression.js'
import { OperationNode } from '../operation-node/operation-node.js'
import {
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
} from '../parser/binary-operation-parser.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import { ExistsExpression } from '../parser/unary-operation-parser.js'
import { ExpressionBuilder } from '../expression/expression-builder.js'

/**
 * Temporary transitional wrapper type that contains the old `WhereGrouper` methods
 * and the new `ExpressionBuilder` interface. One we remove the deprecated methods,
 * this interface can be ditched in favor of just `ExpressionBuilder`.
 */
export interface WhereExpressionBuilder<DB, TB extends keyof DB>
  extends ExpressionBuilder<DB, TB> {
  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  where<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): WhereExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  where(grouper: WhereExpressionBuilder<DB, TB>): WhereExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  where(expression: Expression<any>): WhereExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  whereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): WhereExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orWhere<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): WhereExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orWhere(
    grouper: WhereExpressionBuilder<DB, TB>
  ): WhereExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orWhere(expression: Expression<any>): WhereExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orWhereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): WhereExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  whereExists(arg: ExistsExpression<DB, TB>): WhereExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  whereNotExists(arg: ExistsExpression<DB, TB>): WhereExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orWhereExists(arg: ExistsExpression<DB, TB>): WhereExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orWhereNotExists(
    arg: ExistsExpression<DB, TB>
  ): WhereExpressionBuilder<DB, TB>

  toOperationNode(): OperationNode
}
