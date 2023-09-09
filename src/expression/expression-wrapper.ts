import { AliasNode } from '../operation-node/alias-node.js'
import { AndNode } from '../operation-node/and-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { OrNode } from '../operation-node/or-node.js'
import { ParensNode } from '../operation-node/parens-node.js'
import {
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
  parseValueBinaryOperationOrExpression,
} from '../parser/binary-operation-parser.js'
import { OperandExpression } from '../parser/expression-parser.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import { KyselyTypeError } from '../util/type-error.js'
import { SqlBool } from '../util/type-utils.js'
import {
  AliasableExpression,
  AliasedExpression,
  Expression,
} from './expression.js'

export class ExpressionWrapper<DB, TB extends keyof DB, T>
  implements AliasableExpression<T>
{
  readonly #node: OperationNode

  constructor(node: OperationNode) {
    this.#node = node
  }

  /** @private */
  get expressionType(): T | undefined {
    return undefined
  }

  /**
   * Returns an aliased version of the expression.
   *
   * In addition to slapping `as "the_alias"` to the end of the SQL,
   * this method also provides strict typing:
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select((eb) =>
   *     eb('first_name', '=', 'Jennifer').as('is_jennifer')
   *   )
   *   .executeTakeFirstOrThrow()
   *
   * // `is_jennifer: SqlBool` field exists in the result type.
   * console.log(result.is_jennifer)
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```ts
   * select "first_name" = $1 as "is_jennifer"
   * from "person"
   * ```
   */
  as<A extends string>(alias: A): AliasedExpression<T, A>

  as<A extends string>(alias: Expression<unknown>): AliasedExpression<T, A>

  as(alias: string | Expression<any>): AliasedExpression<T, string> {
    return new AliasedExpressionWrapper(this, alias)
  }

  /**
   * Combines `this` and another expression using `OR`.
   *
   * Also see {@link ExpressionBuilder.or}
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll()
   *   .where(eb => eb('first_name', '=', 'Jennifer')
   *     .or('first_name', '=', 'Arnold')
   *     .or('first_name', '=', 'Sylvester')
   *   )
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```ts
   * select *
   * from "person"
   * where (
   *   "first_name" = $1
   *   or "first_name" = $2
   *   or "first_name" = $3
   * )
   * ```
   *
   * You can also pass any expression as the only argument to
   * this method:
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll()
   *   .where(eb => eb('first_name', '=', 'Jennifer')
   *     .or(eb('first_name', '=', 'Sylvester').and('last_name', '=', 'Stallone'))
   *     .or(eb.exists(
   *       eb.selectFrom('pet')
   *         .select('id')
   *         .whereRef('pet.owner_id', '=', 'person.id')
   *     )
   *   )
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```ts
   * select *
   * from "person"
   * where (
   *   "first_name" = $1
   *   or ("first_name" = $2 and "last_name" = $3)
   *   or exists (
   *     select "id"
   *     from "pet"
   *     where "pet"."owner_id" = "person"."id"
   *   )
   * )
   * ```
   */
  or<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): T extends SqlBool
    ? OrWrapper<DB, TB, SqlBool>
    : KyselyTypeError<'or() method can only be called on boolean expressions'>

  or(
    expression: OperandExpression<SqlBool>
  ): T extends SqlBool
    ? OrWrapper<DB, TB, SqlBool>
    : KyselyTypeError<'or() method can only be called on boolean expressions'>

  or(...args: any[]): any {
    return new OrWrapper(
      OrNode.create(this.#node, parseValueBinaryOperationOrExpression(args))
    )
  }

  /**
   * Combines `this` and another expression using `AND`.
   *
   * Also see {@link ExpressionBuilder.and}
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll()
   *   .where(eb => eb('first_name', '=', 'Jennifer')
   *     .and('last_name', '=', 'Aniston')
   *     .and('age', '>', 40)
   *   )
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```ts
   * select *
   * from "person"
   * where (
   *   "first_name" = $1
   *   and "last_name" = $2
   *   and "age" > $3
   * )
   * ```
   *
   * You can also pass any expression as the only argument to
   * this method:
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll()
   *   .where(eb => eb('first_name', '=', 'Jennifer')
   *     .and(eb('first_name', '=', 'Sylvester').or('last_name', '=', 'Stallone'))
   *     .and(eb.exists(
   *       eb.selectFrom('pet')
   *         .select('id')
   *         .whereRef('pet.owner_id', '=', 'person.id')
   *     )
   *   )
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```ts
   * select *
   * from "person"
   * where (
   *   "first_name" = $1
   *   and ("first_name" = $2 or "last_name" = $3)
   *   and exists (
   *     select "id"
   *     from "pet"
   *     where "pet"."owner_id" = "person"."id"
   *   )
   * )
   * ```
   */
  and<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): T extends SqlBool
    ? AndWrapper<DB, TB, SqlBool>
    : KyselyTypeError<'and() method can only be called on boolean expressions'>

  and(
    expression: OperandExpression<SqlBool>
  ): T extends SqlBool
    ? AndWrapper<DB, TB, SqlBool>
    : KyselyTypeError<'and() method can only be called on boolean expressions'>

  and(...args: any[]): any {
    return new AndWrapper(
      AndNode.create(this.#node, parseValueBinaryOperationOrExpression(args))
    )
  }

  /**
   * Change the output type of the expression.
   *
   * This method call doesn't change the SQL in any way. This methods simply
   * returns a copy of this `ExpressionWrapper` with a new output type.
   */
  $castTo<T>(): ExpressionWrapper<DB, TB, T> {
    return new ExpressionWrapper(this.#node)
  }

  toOperationNode(): OperationNode {
    return this.#node
  }
}

export class AliasedExpressionWrapper<T, A extends string>
  implements AliasedExpression<T, A>
{
  readonly #expr: Expression<T>
  readonly #alias: A | Expression<unknown>

  constructor(expr: Expression<T>, alias: A | Expression<unknown>) {
    this.#expr = expr
    this.#alias = alias
  }

  /** @private */
  get expression(): Expression<T> {
    return this.#expr
  }

  /** @private */
  get alias(): A | Expression<unknown> {
    return this.#alias
  }

  toOperationNode(): AliasNode {
    return AliasNode.create(
      this.#expr.toOperationNode(),
      isOperationNodeSource(this.#alias)
        ? this.#alias.toOperationNode()
        : IdentifierNode.create(this.#alias)
    )
  }
}

export class OrWrapper<DB, TB extends keyof DB, T extends SqlBool>
  implements AliasableExpression<T>
{
  readonly #node: OrNode

  constructor(node: OrNode) {
    this.#node = node
  }

  /** @private */
  get expressionType(): T | undefined {
    return undefined
  }

  /**
   * Returns an aliased version of the expression.
   *
   * In addition to slapping `as "the_alias"` to the end of the SQL,
   * this method also provides strict typing:
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select(eb =>
   *     eb('first_name', '=', 'Jennifer')
   *       .or('first_name', '=', 'Sylvester')
   *       .as('is_jennifer_or_sylvester')
   *   )
   *   .executeTakeFirstOrThrow()
   *
   * // `is_jennifer_or_sylvester: SqlBool` field exists in the result type.
   * console.log(result.is_jennifer_or_sylvester)
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```ts
   * select "first_name" = $1 or "first_name" = $2 as "is_jennifer_or_sylvester"
   * from "person"
   * ```
   */
  as<A extends string>(alias: A): AliasedExpression<T, A>

  as<A extends string>(alias: Expression<unknown>): AliasedExpression<T, A>

  as(alias: string | Expression<any>): AliasedExpression<T, string> {
    return new AliasedExpressionWrapper(this, alias)
  }

  /**
   * Combines `this` and another expression using `OR`.
   *
   * See {@link ExpressionWrapper.or} for examples.
   */
  or<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): OrWrapper<DB, TB, T>

  or(expression: OperandExpression<SqlBool>): OrWrapper<DB, TB, T>

  or(...args: any[]): any {
    return new OrWrapper(
      OrNode.create(this.#node, parseValueBinaryOperationOrExpression(args))
    )
  }

  /**
   * Change the output type of the expression.
   *
   * This method call doesn't change the SQL in any way. This methods simply
   * returns a copy of this `OrWrapper` with a new output type.
   */
  $castTo<T extends SqlBool>(): OrWrapper<DB, TB, T> {
    return new OrWrapper(this.#node)
  }

  toOperationNode(): ParensNode {
    return ParensNode.create(this.#node)
  }
}

export class AndWrapper<DB, TB extends keyof DB, T extends SqlBool>
  implements AliasableExpression<T>
{
  readonly #node: AndNode

  constructor(node: AndNode) {
    this.#node = node
  }

  /** @private */
  get expressionType(): T | undefined {
    return undefined
  }

  /**
   * Returns an aliased version of the expression.
   *
   * In addition to slapping `as "the_alias"` to the end of the SQL,
   * this method also provides strict typing:
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select(eb =>
   *     eb('first_name', '=', 'Jennifer')
   *       .and('last_name', '=', 'Aniston')
   *       .as('is_jennifer_aniston')
   *   )
   *   .executeTakeFirstOrThrow()
   *
   * // `is_jennifer_aniston: SqlBool` field exists in the result type.
   * console.log(result.is_jennifer_or_sylvester)
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```ts
   * select "first_name" = $1 and "first_name" = $2 as "is_jennifer_aniston"
   * from "person"
   * ```
   */
  as<A extends string>(alias: A): AliasedExpression<T, A>

  as<A extends string>(alias: Expression<unknown>): AliasedExpression<T, A>

  as(alias: string | Expression<any>): AliasedExpression<T, string> {
    return new AliasedExpressionWrapper(this, alias)
  }

  /**
   * Combines `this` and another expression using `AND`.
   *
   * See {@link ExpressionWrapper.and} for examples.
   */
  and<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): AndWrapper<DB, TB, T>

  and(expression: OperandExpression<SqlBool>): AndWrapper<DB, TB, T>

  and(...args: any[]): any {
    return new AndWrapper(
      AndNode.create(this.#node, parseValueBinaryOperationOrExpression(args))
    )
  }

  /**
   * Change the output type of the expression.
   *
   * This method call doesn't change the SQL in any way. This methods simply
   * returns a copy of this `AndWrapper` with a new output type.
   */
  $castTo<T extends SqlBool>(): AndWrapper<DB, TB, T> {
    return new AndWrapper(this.#node)
  }

  toOperationNode(): ParensNode {
    return ParensNode.create(this.#node)
  }
}
