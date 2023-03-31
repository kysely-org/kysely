import { Expression } from '../expression/expression.js'
import { ExpressionWrapper } from '../expression/expression-wrapper.js'
import { freeze } from '../util/object-utils.js'
import {
  ExtractTypeFromReferenceExpression,
  SimpleReferenceExpression,
  parseReferenceExpression,
} from '../parser/reference-parser.js'
import { CaseNode } from '../operation-node/case-node.js'
import { parseExpression } from '../parser/expression-parser.js'
import { WhenNode } from '../operation-node/when-node.js'

export class CaseBuilder<DB, TB extends keyof DB, W = unknown, O = never>
  implements Whenable<DB, TB, W, O>
{
  readonly #props: CaseBuilderProps

  constructor(props: CaseBuilderProps) {
    this.#props = freeze(props)
  }

  when(expression: Expression<W>): CaseThenBuilder<DB, TB, W, O> {
    return new CaseThenBuilder({
      ...this.#props,
      node: CaseNode.cloneWithWhen(
        this.#props.node,
        WhenNode.create(parseExpression(expression))
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
  then<C extends SimpleReferenceExpression<DB, TB>>(
    column: C
  ): CaseWhenBuilder<
    DB,
    TB,
    W,
    O | ExtractTypeFromReferenceExpression<DB, TB, C>
  >
  then<O2>(expression: Expression<O2>): CaseWhenBuilder<DB, TB, W, O | O2>

  then(columnOrExpression: any): any {
    return new CaseWhenBuilder({
      ...this.#props,
      node: CaseNode.cloneWithThen(
        this.#props.node,
        parseReferenceExpression(columnOrExpression)
      ),
    })
  }
}

export class CaseWhenBuilder<DB, TB extends keyof DB, W, O>
  implements Whenable<DB, TB, W, O>, Endable<O | null>
{
  readonly #props: CaseBuilderProps

  constructor(props: CaseBuilderProps) {
    this.#props = freeze(props)
  }

  when(expression: Expression<W>): CaseThenBuilder<DB, TB, W, O> {
    return new CaseThenBuilder({
      ...this.#props,
      node: CaseNode.cloneWithWhen(
        this.#props.node,
        WhenNode.create(parseExpression(expression))
      ),
    })
  }

  /**
   * Adds an `else` clause to the `case` statement.
   *
   * An `else` call must be followed by an {@link Endable.end} or {@link Endable.endCase} call.
   */
  else<O2>(expression: Expression<O2>): CaseEndBuilder<O | O2> {
    return new CaseEndBuilder({
      ...this.#props,
      node: CaseNode.cloneWith(this.#props.node, {
        else: parseExpression(expression),
      }),
    })
  }

  end(): ExpressionWrapper<O | null> {
    return new ExpressionWrapper(
      CaseNode.cloneWith(this.#props.node, { isStatement: false })
    )
  }

  endCase(): ExpressionWrapper<O | null> {
    return new ExpressionWrapper(
      CaseNode.cloneWith(this.#props.node, { isStatement: true })
    )
  }
}

export class CaseEndBuilder<O> implements Endable<O> {
  readonly #props: CaseBuilderProps

  constructor(props: CaseBuilderProps) {
    this.#props = freeze(props)
  }

  end(): ExpressionWrapper<O> {
    return new ExpressionWrapper(
      CaseNode.cloneWith(this.#props.node, { isStatement: false })
    )
  }

  endCase(): ExpressionWrapper<O> {
    return new ExpressionWrapper(
      CaseNode.cloneWith(this.#props.node, { isStatement: true })
    )
  }
}

interface Whenable<DB, TB extends keyof DB, W, O> {
  /**
   * Adds a `when` clause to the case statement.
   *
   * A `when` call must be followed by a {@link CaseThenBuilder.then} call.
   */
  when(expression: Expression<W>): CaseThenBuilder<DB, TB, W, O>
}

interface Endable<O> {
  /**
   * Adds an `end` keyword to the case operator.
   *
   * `case` operators can only be used as part of a query.
   * For a `case` statement used as part of a stored program, use {@link endCase} instead.
   */
  end(): ExpressionWrapper<O>

  /**
   * Adds `end case` keywords to the case statement.
   *
   * `case` statements can only be used for flow control in stored programs.
   * For a `case` operator used as part of a query, use {@link end} instead.
   */
  endCase(): ExpressionWrapper<O>
}
