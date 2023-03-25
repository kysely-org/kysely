import { SelectQueryBuilder } from './select-query-builder.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import {
  parseTableExpressionOrList,
  TableExpression,
  From,
  TableExpressionOrList,
  FromTables,
  ExtractTableAlias,
  AnyAliasedTable,
  PickTableWithAlias,
} from '../parser/table-parser.js'
import { WithSchemaPlugin } from '../plugin/with-schema/with-schema-plugin.js'
import { createQueryId } from '../util/query-id.js'
import { FunctionModule } from './function-module.js'
import {
  ExtractTypeFromReferenceExpression,
  parseStringReference,
  ReferenceExpression,
  StringReference,
} from '../parser/reference-parser.js'
import { freeze } from '../util/object-utils.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import {
  BinaryOperatorExpression,
  ComparisonOperatorExpression,
  OperandValueExpression,
  OperandValueExpressionOrList,
  parseBinaryOperation,
} from '../parser/binary-operation-parser.js'
import { Expression } from '../expression/expression.js'
import { AndNode } from '../operation-node/and-node.js'
import { OrNode } from '../operation-node/or-node.js'
import { ParensNode } from '../operation-node/parens-node.js'
import { ExpressionWrapper } from '../expression/expression-wrapper.js'
import {
  ComparisonOperator,
  UnaryOperator,
} from '../operation-node/operator-node.js'
import { SqlBool } from '../util/type-utils.js'
import { bindAllMethods } from '../util/bind.js'
import { parseUnaryOperation } from '../parser/unary-operation-parser.js'
import {
  ExtractTypeFromValueExpressionOrList,
  parseValueExpressionOrList,
} from '../parser/value-parser.js'

export interface ExpressionBuilder<DB, TB extends keyof DB> {
  /**
   * Returns a {@link FunctionModule} that can be used to write type safe function
   * calls.
   *
   * The difference between this and {@link Kysely.fn} is that this one is more
   * type safe. You can only refer to columns visible to the part of the query
   * you are building. {@link Kysely.fn} allows you to refer to columns in any
   * table of the database even if it doesn't produce valid SQL.
   *
   * ```ts
   * await db.selectFrom('person')
   *   .innerJoin('pet', 'pet.owner_id', 'person.id')
   *   .select((eb) => [
   *     'person.id',
   *     eb.fn.count('pet.id').as('pet_count')
   *   ])
   *   .groupBy('person.id')
   *   .having(count('pet.id'), '>', 10)
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person"."id", count("pet"."id") as "pet_count"
   * from "person"
   * inner join "pet" on "pet"."owner_id" = "person"."id"
   * group by "person"."id"
   * having count("pet"."id") > $1
   * ```
   */
  get fn(): FunctionModule<DB, TB>

  /**
   * Creates a subquery.
   *
   * The query builder returned by this method is typed in a way that you can refer to
   * all tables of the parent query in addition to the subquery's tables.
   *
   * This method accepts all the same inputs as {@link QueryCreator.selectFrom}.
   *
   * ### Examples
   *
   * This example shows that you can refer to both `pet.owner_id` and `person.id`
   * columns from the subquery. This is needed to be able to create correlated
   * subqueries:
   *
   * ```ts
   * const result = await db.selectFrom('pet')
   *   .select((eb) => [
   *     'pet.name',
   *     eb.selectFrom('person')
   *       .whereRef('person.id', '=', 'pet.owner_id')
   *       .select('person.first_name')
   *       .as('owner_name')
   *   ])
   *   .execute()
   *
   * console.log(result[0].owner_name)
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select
   *   "pet"."name",
   *   ( select "person"."first_name"
   *     from "person"
   *     where "person"."id" = "pet"."owner_id"
   *   ) as "owner_name"
   * from "pet"
   * ```
   *
   * You can use a normal query in place of `(qb) => qb.selectFrom(...)` but in
   * that case Kysely typings wouldn't allow you to reference `pet.owner_id`
   * because `pet` is not joined to that query.
   */
  selectFrom<TE extends keyof DB & string>(
    from: TE[]
  ): SelectQueryBuilder<DB, TB | ExtractTableAlias<DB, TE>, {}>

  selectFrom<TE extends TableExpression<DB, TB>>(
    from: TE[]
  ): SelectQueryBuilder<From<DB, TE>, FromTables<DB, TB, TE>, {}>

  selectFrom<TE extends keyof DB & string>(
    from: TE
  ): SelectQueryBuilder<DB, TB | ExtractTableAlias<DB, TE>, {}>

  selectFrom<TE extends AnyAliasedTable<DB>>(
    from: TE
  ): SelectQueryBuilder<
    DB & PickTableWithAlias<DB, TE>,
    TB | ExtractTableAlias<DB, TE>,
    {}
  >

  selectFrom<TE extends TableExpression<DB, TB>>(
    from: TE
  ): SelectQueryBuilder<From<DB, TE>, FromTables<DB, TB, TE>, {}>

  /**
   * This can be used to reference columns.
   *
   * ### Examples
   *
   * By default the third argument of {@link bin} and {@link cmp} is a value.
   * This function can be used to pass in a column reference instead:
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll('person')
   *   .where(({ or, cmp, ref}) => or([
   *     cmp('first_name', '=', ref('last_name')),
   *     cmp('first_name', '=', ref('middle_name'))
   *   ]))
   * ```
   *
   * In the next example we use the `ref` method to reference
   * columns of the virtual table `excluded` in a type-safe way
   * to create an upsert operation:
   *
   * ```ts
   * db.insertInto('person')
   *   .values(person)
   *   .onConflict((oc) => oc
   *     .column('id')
   *     .doUpdateSet((eb) => ({
   *       first_name: eb.ref('excluded.first_name'),
   *       last_name: eb.ref('excluded.last_name')
   *     }))
   *   )
   * ```
   *
   * In the next example we use `ref` in a raw sql expression. Unless you
   * want to be as type-safe as possible, this is probably overkill:
   *
   * ```ts
   * db.update('pet').set((eb) => ({
   *   name: sql`concat(${eb.ref('pet.name')}, ${suffix})`
   * }))
   * ```
   */
  ref<RE extends StringReference<DB, TB>>(
    reference: RE
  ): ExpressionWrapper<ExtractTypeFromReferenceExpression<DB, TB, RE>>

  /**
   * Returns a value expression.
   *
   * This can be used to pass in a value where a reference is taken by default.
   *
   * This function returns an {@link Expression} and can be used pretty much anywhere.
   *
   * ### Examples
   *
   * The {@link cmp} function takes a reference by default as the first argument `val` could
   * be used to pass in a value instead:
   *
   * ```ts
   * cmp(val(38), '=', ref('age'))
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * $1 = "age"
   * ```
   */
  val<VE>(
    value: VE
  ): ExpressionWrapper<ExtractTypeFromValueExpressionOrList<VE>>

  /**
   * Creates a binary comparison operation.
   *
   * This function returns an {@link Expression} and can be used pretty much anywhere.
   * See the examples for a couple of possible use cases.
   *
   * @see {@link bin}
   *
   * ### Examples
   *
   * In this example we use `cmp` to create a `WHERE expr1 OR expr2 OR expr3`
   * statement:
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll('person')
   *   .where(({ cmp, or }) => or([
   *     cmp('first_name', '=', 'Jennifer'),
   *     cmp('fist_name', '=', 'Arnold'),
   *     cmp('fist_name', '=', 'Sylvester')
   *   ]))
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person".*
   * from "person"
   * where "first_name" = $1
   * or "first_name" = $2
   * or "first_name" = $3
   * ```
   *
   * By default the third argument is a value. {@link ref} can be used to
   * pass in a column reference instead:
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll('person')
   *   .where(({ or, cmp, ref}) => or([
   *     cmp('first_name', '=', ref('last_name')),
   *     cmp('first_name', '=', ref('middle_name'))
   *   ]))
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person".*
   * from "person"
   * where "first_name" = "last_name"
   * or "first_name" = "middle_name"
   * ```
   */
  cmp<
    O extends SqlBool = SqlBool,
    RE extends ReferenceExpression<DB, TB> = ReferenceExpression<DB, TB>
  >(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): ExpressionWrapper<O>

  /**
   * Creates a binary operation.
   *
   * See {@link cmp} for creating comparison operations.
   *
   * This function returns an {@link Expression} and can be used pretty much anywhere.
   * See the examples for a couple of possible use cases.
   *
   * @see {@link cmp}
   *
   * ### Examples
   *
   * In the following example `bin` is used to increment an integer column:
   *
   * ```ts
   * db.updateTable('person')
   *   .set((eb) => ({
   *     age: eb.bin('age', '+', 1)
   *   }))
   *   .where('id', '=', id)
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * update "person"
   * set "age" = "age" + $1
   * where "id" = $2
   * ```
   *
   * By default the third argument is a value. {@link ref} can be used to
   * pass in a column reference instead:
   *
   * ```ts
   * db.updateTable('person')
   *   .set((eb) => ({
   *     age: eb.bin('age', '+', ref('age'))
   *   }))
   *   .where('id', '=', id)
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * update "person"
   * set "age" = "age" + "age"
   * where "id" = $1
   * ```
   */
  bin<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: Exclude<BinaryOperatorExpression, ComparisonOperator>,
    rhs: OperandValueExpression<DB, TB, RE>
  ): ExpressionWrapper<ExtractTypeFromReferenceExpression<DB, TB, RE>>

  /**
   * Creates a unary operation.
   *
   * This function returns an {@link Expression} and can be used pretty much anywhere.
   * See the examples for a couple of possible use cases.
   *
   * @see {@link not}, {@link exists} and {@link neg}
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .select((eb) => [
   *     'first_name',
   *     eb.unary('-', 'age').as('negative_age')
   *   ])
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "first_name", -"age"
   * from "person"
   * ```
   */
  unary<RE extends ReferenceExpression<DB, TB>>(
    op: UnaryOperator,
    expr: RE
  ): ExpressionWrapper<ExtractTypeFromReferenceExpression<DB, TB, RE>>

  /**
   * Creates a `not` operation.
   *
   * A shortcut for `unary('not', expr)`.
   *
   * @see {@link unary}
   */
  not<RE extends ReferenceExpression<DB, TB>>(
    expr: RE
  ): ExpressionWrapper<ExtractTypeFromReferenceExpression<DB, TB, RE>>

  /**
   * Creates an `exists` operation.
   *
   * A shortcut for `unary('exists', expr)`.
   *
   * @see {@link unary}
   */
  exists<RE extends ReferenceExpression<DB, TB>>(
    expr: RE
  ): ExpressionWrapper<SqlBool>

  /**
   * Creates a negation operation.
   *
   * A shortcut for `unary('-', expr)`.
   *
   * @see {@link unary}
   */
  neg<RE extends ReferenceExpression<DB, TB>>(
    expr: RE
  ): ExpressionWrapper<ExtractTypeFromReferenceExpression<DB, TB, RE>>

  /**
   * Combines two or more comparison expressions using the logical `and` operator.
   *
   * This function returns an {@link Expression} and can be used pretty much anywhere.
   * See the examples for a couple of possible use cases.
   *
   * ### Examples
   *
   * In this example we use `and` with `cmp` to create an `WHERE expr1 AND expr2 AND expr3`
   * statement:
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll('person')
   *   .where(({ cmp, and }) => and([
   *     cmp('first_name', '=', 'Jennifer'),
   *     cmp('fist_name', '=', 'Arnold'),
   *     cmp('fist_name', '=', 'Sylvester')
   *   ]))
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person".*
   * from "person"
   * where "first_name" = $1
   * and "first_name" = $2
   * and "first_name" = $3
   * ```
   */
  and([expr1, expr2, ...rest]: [
    Expression<SqlBool>,
    Expression<SqlBool>,
    ...ReadonlyArray<Expression<SqlBool>>
  ]): ExpressionWrapper<SqlBool>

  /**
   * Combines two or more comparison expressions using the logical `or` operator.
   *
   * This function returns an {@link Expression} and can be used pretty much anywhere.
   * See the examples for a couple of possible use cases.
   *
   * ### Examples
   *
   * In this example we use `or` with `cmp` to create an `WHERE expr1 OR expr2 OR expr3`
   * statement:
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll('person')
   *   .where(({ cmp, and }) => or([
   *     cmp('first_name', '=', 'Jennifer'),
   *     cmp('fist_name', '=', 'Arnold'),
   *     cmp('fist_name', '=', 'Sylvester')
   *   ]))
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person".*
   * from "person"
   * where "first_name" = $1
   * or "first_name" = $2
   * or "first_name" = $3
   * ```
   */
  or([expr1, expr2, ...rest]: [
    Expression<SqlBool>,
    Expression<SqlBool>,
    ...ReadonlyArray<Expression<SqlBool>>
  ]): ExpressionWrapper<SqlBool>

  /**
   * See {@link QueryCreator.withSchema}
   *
   * @deprecated Will be removed in kysely 0.25.0.
   */
  withSchema(schema: string): ExpressionBuilder<DB, TB>
}

export class ExpressionBuilderImpl<DB, TB extends keyof DB>
  implements ExpressionBuilder<DB, TB>
{
  #props: ExpressionBuilderProps

  constructor(props: ExpressionBuilderProps) {
    this.#props = freeze(props)
    bindAllMethods(this)
  }

  get fn(): FunctionModule<DB, TB> {
    return new FunctionModule()
  }

  selectFrom<TE extends keyof DB & string>(
    from: TE[]
  ): SelectQueryBuilder<DB, TB | ExtractTableAlias<DB, TE>, {}>

  selectFrom<TE extends TableExpression<DB, TB>>(
    from: TE[]
  ): SelectQueryBuilder<From<DB, TE>, FromTables<DB, TB, TE>, {}>

  selectFrom<TE extends keyof DB & string>(
    from: TE
  ): SelectQueryBuilder<DB, TB | ExtractTableAlias<DB, TE>, {}>

  selectFrom<TE extends AnyAliasedTable<DB>>(
    from: TE
  ): SelectQueryBuilder<
    DB & PickTableWithAlias<DB, TE>,
    TB | ExtractTableAlias<DB, TE>,
    {}
  >

  selectFrom<TE extends TableExpression<DB, TB>>(
    from: TE
  ): SelectQueryBuilder<From<DB, TE>, FromTables<DB, TB, TE>, {}>

  selectFrom(table: TableExpressionOrList<DB, TB>): any {
    return new SelectQueryBuilder({
      queryId: createQueryId(),
      executor: this.#props.executor,
      queryNode: SelectQueryNode.create(parseTableExpressionOrList(table)),
    })
  }

  ref<RE extends StringReference<DB, TB>>(
    reference: RE
  ): ExpressionWrapper<ExtractTypeFromReferenceExpression<DB, TB, RE>> {
    return new ExpressionWrapper(parseStringReference(reference))
  }

  val<VE>(
    value: VE
  ): ExpressionWrapper<ExtractTypeFromValueExpressionOrList<VE>> {
    return new ExpressionWrapper(parseValueExpressionOrList(value))
  }

  cmp<
    O extends SqlBool = SqlBool,
    RE extends ReferenceExpression<DB, TB> = ReferenceExpression<DB, TB>
  >(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): ExpressionWrapper<O> {
    return new ExpressionWrapper(parseBinaryOperation(lhs, op, rhs))
  }

  bin<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: Exclude<BinaryOperatorExpression, ComparisonOperator>,
    rhs: OperandValueExpression<DB, TB, RE>
  ): ExpressionWrapper<ExtractTypeFromReferenceExpression<DB, TB, RE>> {
    return new ExpressionWrapper(parseBinaryOperation(lhs, op, rhs))
  }

  unary<RE extends ReferenceExpression<DB, TB>>(
    op: UnaryOperator,
    expr: RE
  ): ExpressionWrapper<ExtractTypeFromReferenceExpression<DB, TB, RE>> {
    return new ExpressionWrapper(parseUnaryOperation(op, expr))
  }

  not<RE extends ReferenceExpression<DB, TB>>(
    expr: RE
  ): ExpressionWrapper<ExtractTypeFromReferenceExpression<DB, TB, RE>> {
    return this.unary('not', expr)
  }

  exists<RE extends ReferenceExpression<DB, TB>>(
    expr: RE
  ): ExpressionWrapper<SqlBool> {
    return this.unary('exists', expr)
  }

  neg<RE extends ReferenceExpression<DB, TB>>(
    expr: RE
  ): ExpressionWrapper<ExtractTypeFromReferenceExpression<DB, TB, RE>> {
    return this.unary('-', expr)
  }

  and([expr1, expr2, ...rest]: [
    Expression<SqlBool>,
    Expression<SqlBool>,
    ...ReadonlyArray<Expression<SqlBool>>
  ]): ExpressionWrapper<SqlBool> {
    let node = AndNode.create(expr1.toOperationNode(), expr2.toOperationNode())

    for (const ex of rest) {
      node = AndNode.create(node, ex.toOperationNode())
    }

    return new ExpressionWrapper(ParensNode.create(node))
  }

  or([expr1, expr2, ...rest]: [
    Expression<SqlBool>,
    Expression<SqlBool>,
    ...ReadonlyArray<Expression<SqlBool>>
  ]): ExpressionWrapper<SqlBool> {
    let node = OrNode.create(expr1.toOperationNode(), expr2.toOperationNode())

    for (const ex of rest) {
      node = OrNode.create(node, ex.toOperationNode())
    }

    return new ExpressionWrapper(ParensNode.create(node))
  }

  withSchema(schema: string): ExpressionBuilder<DB, TB> {
    return new ExpressionBuilderImpl({
      ...this.#props,
      executor: this.#props.executor.withPluginAtFront(
        new WithSchemaPlugin(schema)
      ),
    })
  }
}

export interface ExpressionBuilderProps {
  readonly executor: QueryExecutor
}
