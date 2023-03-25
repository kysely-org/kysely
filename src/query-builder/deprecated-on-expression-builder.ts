import { Expression } from '../expression/expression.js'
import { OperationNode } from '../operation-node/operation-node.js'
import {
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
} from '../parser/binary-operation-parser.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import { ExistsExpression } from '../parser/unary-operation-parser.js'
import { ExpressionBuilder } from './expression-builder.js'

// Temporary transitional wrapper type that contains the old `OnGrouper` methods
// and the new `ExpressionBuilder` interface. One we remove the deprecated methods,
// this interface can be ditched in favor of just `ExpressionBuilder`.
export interface OnExpressionBuilder<DB, TB extends keyof DB>
  extends ExpressionBuilder<DB, TB> {
  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  on<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): OnExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  on(grouper: OnExpressionBuilder<DB, TB>): OnExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  on(expression: Expression<any>): OnExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  onRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): OnExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orOn<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): OnExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orOn(grouper: OnExpressionBuilder<DB, TB>): OnExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orOn(expression: Expression<any>): OnExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orOnRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): OnExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  onExists(arg: ExistsExpression<DB, TB>): OnExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  onNotExists(arg: ExistsExpression<DB, TB>): OnExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orOnExists(arg: ExistsExpression<DB, TB>): OnExpressionBuilder<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orOnNotExists(arg: ExistsExpression<DB, TB>): OnExpressionBuilder<DB, TB>

  toOperationNode(): OperationNode
}
