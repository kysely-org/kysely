import { Expression } from '../expression/expression.js'
import { ExpressionWrapper } from '../expression/expression-wrapper.js'
import { freeze } from '../util/object-utils.js'
import {
  ExtractTypeFromReferenceExpression,
  parseReferenceExpression,
  ReferenceExpression,
} from '../parser/reference-parser.js'
import { CaseNode } from '../operation-node/case-node.js'
import { WhenNode } from '../operation-node/when-node.js'
import {
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
  parseReferentialBinaryOperation,
  parseValueBinaryOperationOrExpression,
} from '../parser/binary-operation-parser.js'
import {
  ExtractTypeFromValueExpression,
  isSafeImmediateValue,
  parseSafeImmediateValue,
  parseValueExpression,
} from '../parser/value-parser.js'
import { KyselyTypeError } from '../util/type-error.js'

export class CaseBuilder<DB, TB extends keyof DB, W = unknown, O = never>
  implements Whenable<DB, TB, W, O>
{
  readonly #props: CaseBuilderProps

  constructor(props: CaseBuilderProps) {
    this.#props = freeze(props)
  }

  when<
    RE extends ReferenceExpression<DB, TB>,
    VE extends OperandValueExpressionOrList<DB, TB, RE>,
  >(
    lhs: unknown extends W
      ? RE
      : KyselyTypeError<'when(lhs, op, rhs) is not supported when using case(value)'>,
    op: ComparisonOperatorExpression,
    rhs: VE,
  ): CaseThenBuilder<DB, TB, W, O>

  when(expression: Expression<W>): CaseThenBuilder<DB, TB, W, O>

  when(
    value: unknown extends W
      ? KyselyTypeError<'when(value) is only supported when using case(value)'>
      : W,
  ): CaseThenBuilder<DB, TB, W, O>

  when(...args: any[]): any {
    return new CaseThenBuilder({
      ...this.#props,
      node: CaseNode.cloneWithWhen(
        this.#props.node,
        WhenNode.create(parseValueBinaryOperationOrExpression(args)),
      ),
    })
  }

  whenRef<RE extends ReferenceExpression<DB, TB>>(
    lhs: unknown extends W
      ? RE
      : KyselyTypeError<'whenRef(lhs, op, rhs) is not supported when using case(value)'>,
    op: ComparisonOperatorExpression,
    rhs: RE,
  ): CaseThenBuilder<DB, TB, W, O> {
    return new CaseThenBuilder({
      ...this.#props,
      node: CaseNode.cloneWithWhen(
        this.#props.node,
        WhenNode.create(parseReferentialBinaryOperation(lhs as RE, op, rhs)),
      ),
    })
  }
}

interface CaseBuilderProps {
  readonly node: CaseNode
}

export class CaseThenBuilder<DB, TB extends keyof DB, W, O> {
  readonly #props: CaseBuilderProps

  constructor(props: CaseBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Adds a `then` clause to the `case` statement.
   *
   * A `then` call can be followed by {@link Whenable.when}, {@link CaseWhenBuilder.else},
   * {@link CaseWhenBuilder.end} or {@link CaseWhenBuilder.endCase} call.
   */
  then<E extends Expression<unknown>>(
    expression: E,
  ): CaseWhenBuilder<DB, TB, W, O | ExtractTypeFromValueExpression<E>>

  then<V>(value: V): CaseWhenBuilder<DB, TB, W, O | V>

  then(valueExpression: any): any {
    return new CaseWhenBuilder({
      ...this.#props,
      node: CaseNode.cloneWithThen(
        this.#props.node,
        isSafeImmediateValue(valueExpression)
          ? parseSafeImmediateValue(valueExpression)
          : parseValueExpression(valueExpression),
      ),
    })
  }

  /**
   * Adds a `then` clause to the `case` statement where the value is a reference to a column.
   *
   * A `thenRef` call can be followed by {@link Whenable.when}, {@link CaseWhenBuilder.else},
   * {@link CaseWhenBuilder.end} or {@link CaseWhenBuilder.endCase} call.
   */
  thenRef<RE extends ReferenceExpression<DB, TB>>(
    expression: RE,
  ): CaseWhenBuilder<
    DB,
    TB,
    W,
    O | ExtractTypeFromReferenceExpression<DB, TB, RE>
  > {
    return new CaseWhenBuilder({
      ...this.#props,
      node: CaseNode.cloneWithThen(
        this.#props.node,
        parseReferenceExpression(expression),
      ),
    })
  }
}

export class CaseWhenBuilder<DB, TB extends keyof DB, W, O>
  implements Whenable<DB, TB, W, O>, Endable<DB, TB, O | null>
{
  readonly #props: CaseBuilderProps

  constructor(props: CaseBuilderProps) {
    this.#props = freeze(props)
  }

  when<
    RE extends ReferenceExpression<DB, TB>,
    VE extends OperandValueExpressionOrList<DB, TB, RE>,
  >(
    lhs: unknown extends W
      ? RE
      : KyselyTypeError<'when(lhs, op, rhs) is not supported when using case(value)'>,
    op: ComparisonOperatorExpression,
    rhs: VE,
  ): CaseThenBuilder<DB, TB, W, O>

  when(expression: Expression<W>): CaseThenBuilder<DB, TB, W, O>

  when(
    value: unknown extends W
      ? KyselyTypeError<'when(value) is only supported when using case(value)'>
      : W,
  ): CaseThenBuilder<DB, TB, W, O>

  when(...args: any[]): any {
    return new CaseThenBuilder({
      ...this.#props,
      node: CaseNode.cloneWithWhen(
        this.#props.node,
        WhenNode.create(parseValueBinaryOperationOrExpression(args)),
      ),
    })
  }

  whenRef<RE extends ReferenceExpression<DB, TB>>(
    lhs: unknown extends W
      ? RE
      : KyselyTypeError<'whenRef(lhs, op, rhs) is not supported when using case(value)'>,
    op: ComparisonOperatorExpression,
    rhs: RE,
  ): CaseThenBuilder<DB, TB, W, O> {
    return new CaseThenBuilder({
      ...this.#props,
      node: CaseNode.cloneWithWhen(
        this.#props.node,
        WhenNode.create(parseReferentialBinaryOperation(lhs as RE, op, rhs)),
      ),
    })
  }

  /**
   * Adds an `else` clause to the `case` statement.
   *
   * An `else` call must be followed by an {@link Endable.end} or {@link Endable.endCase} call.
   */
  else<E extends Expression<unknown>>(
    expression: E,
  ): CaseEndBuilder<DB, TB, O | ExtractTypeFromValueExpression<E>>

  else<V>(value: V): CaseEndBuilder<DB, TB, O | V>

  else(valueExpression: any): any {
    return new CaseEndBuilder({
      ...this.#props,
      node: CaseNode.cloneWith(this.#props.node, {
        else: isSafeImmediateValue(valueExpression)
          ? parseSafeImmediateValue(valueExpression)
          : parseValueExpression(valueExpression),
      }),
    })
  }

  /**
   * Adds an `else` clause to the `case` statement where the value is a reference to a column.
   *
   * An `elseRef` call must be followed by an {@link Endable.end} or {@link Endable.endCase} call.
   */
  elseRef<RE extends ReferenceExpression<DB, TB>>(
    expression: RE,
  ): CaseEndBuilder<
    DB,
    TB,
    O | ExtractTypeFromReferenceExpression<DB, TB, RE>
  > {
    return new CaseEndBuilder({
      ...this.#props,
      node: CaseNode.cloneWith(this.#props.node, {
        else: parseReferenceExpression(expression),
      }),
    })
  }

  end(): ExpressionWrapper<DB, TB, O | null> {
    return new ExpressionWrapper(
      CaseNode.cloneWith(this.#props.node, { isStatement: false }),
    )
  }

  endCase(): ExpressionWrapper<DB, TB, O | null> {
    return new ExpressionWrapper(
      CaseNode.cloneWith(this.#props.node, { isStatement: true }),
    )
  }
}

export class CaseEndBuilder<DB, TB extends keyof DB, O>
  implements Endable<DB, TB, O>
{
  readonly #props: CaseBuilderProps

  constructor(props: CaseBuilderProps) {
    this.#props = freeze(props)
  }

  end(): ExpressionWrapper<DB, TB, O> {
    return new ExpressionWrapper(
      CaseNode.cloneWith(this.#props.node, { isStatement: false }),
    )
  }

  endCase(): ExpressionWrapper<DB, TB, O> {
    return new ExpressionWrapper(
      CaseNode.cloneWith(this.#props.node, { isStatement: true }),
    )
  }
}

interface Whenable<DB, TB extends keyof DB, W, O> {
  /**
   * Adds a `when` clause to the case statement.
   *
   * A `when` call must be followed by either a {@link CaseThenBuilder.then} or {@link CaseThenBuilder.thenRef} call.
   */
  when<
    RE extends ReferenceExpression<DB, TB>,
    VE extends OperandValueExpressionOrList<DB, TB, RE>,
  >(
    lhs: unknown extends W
      ? RE
      : KyselyTypeError<'when(lhs, op, rhs) is not supported when using case(value)'>,
    op: ComparisonOperatorExpression,
    rhs: VE,
  ): CaseThenBuilder<DB, TB, W, O>

  when(expression: Expression<W>): CaseThenBuilder<DB, TB, W, O>

  when(
    value: unknown extends W
      ? KyselyTypeError<'when(value) is only supported when using case(value)'>
      : W,
  ): CaseThenBuilder<DB, TB, W, O>

  /**
   * Adds a `when` clause to the case statement, where both sides of the
   * operator are references to columns.
   *
   * See {@link Whenable.when} for value-first variant.
   * The normal `when` method treats the right hand side argument as a
   * value by default. `whenRef` treats it as a column reference.
   *
   * A `whenRef` call must be followed by either a {@link CaseThenBuilder.then} or {@link CaseThenBuilder.thenRef} call.
   */
  whenRef<RE extends ReferenceExpression<DB, TB>>(
    lhs: unknown extends W
      ? RE
      : KyselyTypeError<'whenRef(lhs, op, rhs) is not supported when using case(value)'>,
    op: ComparisonOperatorExpression,
    rhs: RE,
  ): CaseThenBuilder<DB, TB, W, O>
}

interface Endable<DB, TB extends keyof DB, O> {
  /**
   * Adds an `end` keyword to the case operator.
   *
   * `case` operators can only be used as part of a query.
   * For a `case` statement used as part of a stored program, use {@link endCase} instead.
   */
  end(): ExpressionWrapper<DB, TB, O>

  /**
   * Adds `end case` keywords to the case statement.
   *
   * `case` statements can only be used for flow control in stored programs.
   * For a `case` operator used as part of a query, use {@link end} instead.
   */
  endCase(): ExpressionWrapper<DB, TB, O>
}
