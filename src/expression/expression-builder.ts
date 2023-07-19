import {
  SelectQueryBuilder,
  createSelectQueryBuilder,
} from '../query-builder/select-query-builder.js'
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
import {
  createFunctionModule,
  FunctionModule,
} from '../query-builder/function-module.js'
import {
  ExtractTypeFromReferenceExpression,
  parseJSONReference,
  parseReferenceExpression,
  parseStringReference,
  ReferenceExpression,
  SimpleReferenceExpression,
  StringReference,
} from '../parser/reference-parser.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import {
  BinaryOperatorExpression,
  ComparisonOperatorExpression,
  FilterObject,
  OperandValueExpression,
  OperandValueExpressionOrList,
  parseFilterList,
  parseFilterObject,
  parseValueBinaryOperation,
  parseValueBinaryOperationOrExpression,
} from '../parser/binary-operation-parser.js'
import { Expression } from './expression.js'
import { ParensNode } from '../operation-node/parens-node.js'
import { ExpressionWrapper } from './expression-wrapper.js'
import {
  ComparisonOperator,
  JSONOperatorWith$,
  OperatorNode,
  UnaryOperator,
} from '../operation-node/operator-node.js'
import { SqlBool } from '../util/type-utils.js'
import { parseUnaryOperation } from '../parser/unary-operation-parser.js'
import {
  ExtractTypeFromValueExpressionOrList,
  parseSafeImmediateValue,
  parseValueExpression,
  parseValueExpressionOrList,
} from '../parser/value-parser.js'
import { NOOP_QUERY_EXECUTOR } from '../query-executor/noop-query-executor.js'
import { CaseBuilder } from '../query-builder/case-builder.js'
import { CaseNode } from '../operation-node/case-node.js'
import { isReadonlyArray, isUndefined } from '../util/object-utils.js'
import { JSONPathBuilder } from '../query-builder/json-path-builder.js'
import { OperandExpression } from '../parser/expression-parser.js'
import { BinaryOperationNode } from '../operation-node/binary-operation-node.js'
import { AndNode } from '../operation-node/and-node.js'

export interface ExpressionBuilder<DB, TB extends keyof DB> {
  /**
   * Creates a binary expression.
   *
   * This function returns an {@link Expression} and can be used pretty much anywhere.
   * See the examples for a couple of possible use cases.
   *
   * ### Examples
   *
   * In the following example `eb` is used to increment an integer column:
   *
   * ```ts
   * db.updateTable('person')
   *   .set((eb) => ({
   *     age: eb('age', '+', 1)
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
   *     age: eb('age', '+', eb.ref('age'))
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
  <RE extends ReferenceExpression<DB, TB>, OP extends BinaryOperatorExpression>(
    lhs: RE,
    op: OP,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): ExpressionWrapper<
    DB,
    TB,
    OP extends ComparisonOperator
      ? SqlBool
      : ExtractTypeFromReferenceExpression<DB, TB, RE>
  >

  /**
   * Returns a copy of `this` expression builder, for destructuring purposes.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .where(({ eb, exists, selectFrom }) =>
   *     eb('first_name', '=', 'Jennifer').and(
   *       exists(selectFrom('pet').whereRef('owner_id', '=', 'person.id').select('pet.id'))
   *     )
   *   )
   *   .selectAll()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "person" where "first_name" = $1 and exists (
   *   select "pet.id" from "pet" where "owner_id" = "person.id"
   * )
   * ```
   */
  eb: ExpressionBuilder<DB, TB>

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
   *   .having((eb) => eb.fn.count('pet.id'), '>', 10)
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
   * Creates a `case` statement/operator.
   *
   * ### Examples
   *
   * Kitchen sink example with 2 flavors of `case` operator:
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * const { title, name } = await db
   *   .selectFrom('person')
   *   .where('id', '=', '123')
   *   .select((eb) => [
   *     eb.fn.coalesce('last_name', 'first_name').as('name'),
   *     eb
   *       .case()
   *       .when('gender', '=', 'male')
   *       .then('Mr.')
   *       .when('gender', '=', 'female')
   *       .then(
   *         eb
   *           .case('martialStatus')
   *           .when('single')
   *           .then('Ms.')
   *           .else('Mrs.')
   *           .end()
   *       )
   *       .end()
   *       .as('title'),
   *   ])
   *   .executeTakeFirstOrThrow()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select
   *   coalesce("last_name", "first_name") as "name",
   *   case
   *     when "gender" = $1 then $2
   *     when "gender" = $3 then
   *       case "martialStatus"
   *         when $4 then $5
   *         else $6
   *       end
   *   end as "title"
   * from "person"
   * where "id" = $7
   * ```
   */
  case(): CaseBuilder<DB, TB>

  case<C extends SimpleReferenceExpression<DB, TB>>(
    column: C
  ): CaseBuilder<DB, TB, ExtractTypeFromReferenceExpression<DB, TB, C>>

  case<O>(expression: Expression<O>): CaseBuilder<DB, TB, O>

  /**
   * This method can be used to reference columns within the query's context. For
   * a non-type-safe version of this method see {@link sql}'s version.
   *
   * Additionally, this method can be used to reference nested JSON properties or
   * array elements. See {@link JSONPathBuilder} for more information.
   *
   * ### Examples
   *
   * By default the third argument of binary expressions is a value.
   * This function can be used to pass in a column reference instead:
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll('person')
   *   .where((eb) => eb.or([
   *     eb('first_name', '=', eb.ref('last_name')),
   *     eb('first_name', '=', eb.ref('middle_name'))
   *   ]))
   * ```
   *
   * In the next example we use the `ref` method to reference columns of the virtual
   * table `excluded` in a type-safe way to create an upsert operation:
   *
   * ```ts
   * db.insertInto('person')
   *   .values(person)
   *   .onConflict((oc) => oc
   *     .column('id')
   *     .doUpdateSet(({ ref }) => ({
   *       first_name: ref('excluded.first_name'),
   *       last_name: ref('excluded.last_name')
   *     }))
   *   )
   * ```
   *
   * In the next example we use `ref` in a raw sql expression. Unless you want
   * to be as type-safe as possible, this is probably overkill:
   *
   * ```ts
   * db.update('pet').set((eb) => ({
   *   name: sql`concat(${eb.ref('pet.name')}, ${suffix})`
   * }))
   * ```
   *
   * In the next example we use `ref` to reference a nested JSON property:
   *
   * ```ts
   * db.selectFrom('person')
   *   .where(({ eb, ref }) => eb(
   *     ref('address', '->').key('state').key('abbr'),
   *     '=',
   *     'CA'
   *   ))
   *   .selectAll()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "person" where "address"->'state'->'abbr' = $1
   * ```
   *
   * You can also compile to a JSON path expression by using the `->$`or `->>$` operator:
   *
   * ```ts
   * db.selectFrom('person')
   *   .select(({ ref }) =>
   *     ref('experience', '->$')
   *       .at('last')
   *       .key('title')
   *       .as('current_job')
   *   )
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * select `experience`->'$[last].title' as `current_job` from `person`
   * ```
   */
  ref<RE extends StringReference<DB, TB>>(
    reference: RE
  ): ExpressionWrapper<DB, TB, ExtractTypeFromReferenceExpression<DB, TB, RE>>

  ref<RE extends StringReference<DB, TB>>(
    reference: RE,
    op: JSONOperatorWith$
  ): JSONPathBuilder<ExtractTypeFromReferenceExpression<DB, TB, RE>>

  /**
   * Returns a value expression.
   *
   * This can be used to pass in a value where a reference is taken by default.
   *
   * This function returns an {@link Expression} and can be used pretty much anywhere.
   *
   * ### Examples
   *
   * Binary expressions take a reference by default as the first argument. `val` could
   * be used to pass in a value instead:
   *
   * ```ts
   * eb(val(38), '=', ref('age'))
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
  ): ExpressionWrapper<DB, TB, ExtractTypeFromValueExpressionOrList<VE>>

  /**
   * Returns a literal value expression.
   *
   * Just like `val` but creates a literal value that gets merged in the SQL.
   * To prevent SQL injections, only `boolean`, `number` and `null` values
   * are accepted. If you need `string` or other literals, use `sql.lit` instead.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .select((eb) => eb.lit(1).as('one'))
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select 1 as "one" from "person"
   * ```
   */
  lit<VE extends number | boolean | null>(
    literal: VE
  ): ExpressionWrapper<DB, TB, VE>

  /**
   * @deprecated Use the expression builder as a function instead.
   *
   * Before:
   *
   * ```ts
   * where((eb) => eb.cmpr('first_name', '=', 'Jennifer'))
   * ```
   *
   * After:
   *
   * ```ts
   * where((eb) => eb('first_name', '=', 'Jennifer'))
   * ```
   *
   * or
   *
   * ```ts
   * where(({ eb }) => eb('first_name', '=', 'Jennifer'))
   * ```
   */
  cmpr<
    O extends SqlBool = SqlBool,
    RE extends ReferenceExpression<DB, TB> = ReferenceExpression<DB, TB>
  >(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): ExpressionWrapper<DB, TB, O>

  /**
   * @deprecated Use the expression builder as a function instead.
   *
   * Before:
   *
   * ```ts
   * set((eb) => ({
   *   age: eb.bxp('age', '+', 10)
   * }))
   * ```
   *
   * After:
   *
   * ```ts
   * set((eb) => ({
   *   age: eb('age', '+', 10)
   * }))
   * ```
   *
   * or
   *
   * ```ts
   * set(({ eb }) => ({
   *   age: eb('age', '+', 10)
   * }))
   * ```
   */
  bxp<
    RE extends ReferenceExpression<DB, TB>,
    OP extends BinaryOperatorExpression
  >(
    lhs: RE,
    op: OP,
    rhs: OperandValueExpression<DB, TB, RE>
  ): ExpressionWrapper<
    DB,
    TB,
    OP extends ComparisonOperator
      ? SqlBool
      : ExtractTypeFromReferenceExpression<DB, TB, RE>
  >

  /**
   * Creates an unary expression.
   *
   * This function returns an {@link Expression} and can be used pretty much anywhere.
   * See the examples for a couple of possible use cases.
   *
   * @see {@link not}, {@link exists} and {@link neg}.
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
  ): ExpressionWrapper<DB, TB, ExtractTypeFromReferenceExpression<DB, TB, RE>>

  /**
   * Creates a `not` operation.
   *
   * A shortcut for `unary('not', expr)`.
   *
   * @see {@link unary}
   */
  not<RE extends ReferenceExpression<DB, TB>>(
    expr: RE
  ): ExpressionWrapper<DB, TB, ExtractTypeFromReferenceExpression<DB, TB, RE>>

  /**
   * Creates an `exists` operation.
   *
   * A shortcut for `unary('exists', expr)`.
   *
   * @see {@link unary}
   */
  exists<RE extends ReferenceExpression<DB, TB>>(
    expr: RE
  ): ExpressionWrapper<DB, TB, SqlBool>

  /**
   * Creates a negation operation.
   *
   * A shortcut for `unary('-', expr)`.
   *
   * @see {@link unary}
   */
  neg<RE extends ReferenceExpression<DB, TB>>(
    expr: RE
  ): ExpressionWrapper<DB, TB, ExtractTypeFromReferenceExpression<DB, TB, RE>>

  /**
   * Creates a `between` expression.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll()
   *   .where((eb) => eb.between('age', 40, 60))
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "person" where "age" between $1 and $2
   * ```
   */
  between<RE extends ReferenceExpression<DB, TB>>(
    expr: RE,
    start: OperandValueExpression<DB, TB, RE>,
    end: OperandValueExpression<DB, TB, RE>
  ): ExpressionWrapper<DB, TB, SqlBool>

  /**
   * Combines two or more expressions using the logical `and` operator.
   *
   * This function returns an {@link Expression} and can be used pretty much anywhere.
   * See the examples for a couple of possible use cases.
   *
   * ### Examples
   *
   * In this example we use `and` to create a `WHERE expr1 AND expr2 AND expr3`
   * statement:
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll('person')
   *   .where((eb) => eb.and([
   *     eb('first_name', '=', 'Jennifer'),
   *     eb('fist_name', '=', 'Arnold'),
   *     eb('fist_name', '=', 'Sylvester')
   *   ]))
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person".*
   * from "person"
   * where (
   *   "first_name" = $1
   *   and "first_name" = $2
   *   and "first_name" = $3
   * )
   * ```
   *
   * Optionally you can use the simpler object notation if you only need
   * equality comparisons:
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll('person')
   *   .where((eb) => eb.and({
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   }))
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person".*
   * from "person"
   * where (
   *   "first_name" = $1
   *   and "last_name" = $2
   * )
   * ```
   */
  and(
    exprs: ReadonlyArray<OperandExpression<SqlBool>>
  ): ExpressionWrapper<DB, TB, SqlBool>

  and(exprs: Readonly<FilterObject<DB, TB>>): ExpressionWrapper<DB, TB, SqlBool>

  /**
   * Combines two or more expressions using the logical `or` operator.
   *
   * This function returns an {@link Expression} and can be used pretty much anywhere.
   * See the examples for a couple of possible use cases.
   *
   * ### Examples
   *
   * In this example we use `or` to create a `WHERE expr1 OR expr2 OR expr3`
   * statement:
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll('person')
   *   .where((eb) => eb.or([
   *     eb('first_name', '=', 'Jennifer'),
   *     eb('fist_name', '=', 'Arnold'),
   *     eb('fist_name', '=', 'Sylvester')
   *   ]))
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person".*
   * from "person"
   * where (
   *   "first_name" = $1
   *   or "first_name" = $2
   *   or "first_name" = $3
   * )
   * ```
   *
   * Optionally you can use the simpler object notation if you only need
   * equality comparisons:
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll('person')
   *   .where((eb) => eb.or({
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   }))
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person".*
   * from "person"
   * where (
   *   "first_name" = $1
   *   or "last_name" = $2
   * )
   * ```
   */
  or(
    exprs: ReadonlyArray<OperandExpression<SqlBool>>
  ): ExpressionWrapper<DB, TB, SqlBool>

  or(exprs: Readonly<FilterObject<DB, TB>>): ExpressionWrapper<DB, TB, SqlBool>

  /**
   * Wraps the expression in parentheses.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll('person')
   *   .where((eb) => eb(eb.parens('age', '+', 1), '/', 100), '<', 0.1))
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person".*
   * from "person"
   * where ("age" + $1) / $2 < $3
   * ```
   *
   * You can also pass in any expression as the only argument:
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll('person')
   *   .where((eb) => parens(
   *     eb('age', '=', 1).or('age', '=', 2))
   *   ).and(
   *     eb('first_name', '=', 'Jennifer').or('first_name', '=', 'Arnold')
   *   ))
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person".*
   * from "person"
   * where ("age" = $1 or "age" = $2) and ("first_name" = $3 or "first_name" = $4)
   * ```
   */
  parens<
    RE extends ReferenceExpression<DB, TB>,
    OP extends BinaryOperatorExpression
  >(
    lhs: RE,
    op: OP,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): ExpressionWrapper<
    DB,
    TB,
    OP extends ComparisonOperator
      ? SqlBool
      : ExtractTypeFromReferenceExpression<DB, TB, RE>
  >

  parens<T>(expr: Expression<T>): ExpressionWrapper<DB, TB, T>

  /**
   * See {@link QueryCreator.withSchema}
   *
   * @deprecated Will be removed in kysely 0.25.0.
   */
  withSchema(schema: string): ExpressionBuilder<DB, TB>
}

export function createExpressionBuilder<DB, TB extends keyof DB>(
  executor: QueryExecutor = NOOP_QUERY_EXECUTOR
): ExpressionBuilder<DB, TB> {
  function binary<
    RE extends ReferenceExpression<DB, TB>,
    OP extends BinaryOperatorExpression
  >(
    lhs: RE,
    op: OP,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): ExpressionWrapper<
    DB,
    TB,
    OP extends ComparisonOperator
      ? SqlBool
      : ExtractTypeFromReferenceExpression<DB, TB, RE>
  > {
    return new ExpressionWrapper(parseValueBinaryOperation(lhs, op, rhs))
  }

  function unary<RE extends ReferenceExpression<DB, TB>>(
    op: UnaryOperator,
    expr: RE
  ): ExpressionWrapper<DB, TB, ExtractTypeFromReferenceExpression<DB, TB, RE>> {
    return new ExpressionWrapper(parseUnaryOperation(op, expr))
  }

  const eb = Object.assign(binary, {
    fn: undefined! as FunctionModule<DB, TB>,
    eb: undefined! as ExpressionBuilder<DB, TB>,

    selectFrom(table: TableExpressionOrList<DB, TB>): any {
      return createSelectQueryBuilder({
        queryId: createQueryId(),
        executor: executor,
        queryNode: SelectQueryNode.create(parseTableExpressionOrList(table)),
      })
    },

    case<RE extends ReferenceExpression<DB, TB>>(
      reference?: RE
    ): CaseBuilder<DB, TB, ExtractTypeFromReferenceExpression<DB, TB, RE>> {
      return new CaseBuilder({
        node: CaseNode.create(
          isUndefined(reference)
            ? undefined
            : parseReferenceExpression(reference)
        ),
      })
    },

    ref<RE extends StringReference<DB, TB>>(
      reference: RE,
      op?: JSONOperatorWith$
    ): any {
      if (isUndefined(op)) {
        return new ExpressionWrapper(parseStringReference(reference))
      }

      return new JSONPathBuilder(parseJSONReference(reference, op))
    },

    val<VE>(
      value: VE
    ): ExpressionWrapper<DB, TB, ExtractTypeFromValueExpressionOrList<VE>> {
      return new ExpressionWrapper(parseValueExpressionOrList(value))
    },

    lit<VE extends number | boolean | null>(
      value: VE
    ): ExpressionWrapper<DB, TB, VE> {
      return new ExpressionWrapper(parseSafeImmediateValue(value))
    },

    // @deprecated
    cmpr<
      O extends SqlBool = SqlBool,
      RE extends ReferenceExpression<DB, TB> = ReferenceExpression<DB, TB>
    >(
      lhs: RE,
      op: ComparisonOperatorExpression,
      rhs: OperandValueExpressionOrList<DB, TB, RE>
    ): ExpressionWrapper<DB, TB, O> {
      return new ExpressionWrapper(parseValueBinaryOperation(lhs, op, rhs))
    },

    // @deprecated
    bxp<
      RE extends ReferenceExpression<DB, TB>,
      OP extends BinaryOperatorExpression
    >(
      lhs: RE,
      op: OP,
      rhs: OperandValueExpression<DB, TB, RE>
    ): ExpressionWrapper<
      DB,
      TB,
      OP extends ComparisonOperator
        ? SqlBool
        : ExtractTypeFromReferenceExpression<DB, TB, RE>
    > {
      return new ExpressionWrapper(parseValueBinaryOperation(lhs, op, rhs))
    },

    unary,

    not<RE extends ReferenceExpression<DB, TB>>(
      expr: RE
    ): ExpressionWrapper<
      DB,
      TB,
      ExtractTypeFromReferenceExpression<DB, TB, RE>
    > {
      return unary('not', expr)
    },

    exists<RE extends ReferenceExpression<DB, TB>>(
      expr: RE
    ): ExpressionWrapper<DB, TB, SqlBool> {
      return unary('exists', expr)
    },

    neg<RE extends ReferenceExpression<DB, TB>>(
      expr: RE
    ): ExpressionWrapper<
      DB,
      TB,
      ExtractTypeFromReferenceExpression<DB, TB, RE>
    > {
      return unary('-', expr)
    },

    between<RE extends ReferenceExpression<DB, TB>>(
      expr: RE,
      start: OperandValueExpression<DB, TB, RE>,
      end: OperandValueExpression<DB, TB, RE>
    ): ExpressionWrapper<DB, TB, SqlBool> {
      return new ExpressionWrapper(
        BinaryOperationNode.create(
          parseReferenceExpression(expr),
          OperatorNode.create('between'),
          AndNode.create(parseValueExpression(start), parseValueExpression(end))
        )
      )
    },

    and(
      exprs:
        | ReadonlyArray<OperandExpression<SqlBool>>
        | Readonly<FilterObject<DB, TB>>
    ): ExpressionWrapper<DB, TB, SqlBool> {
      if (isReadonlyArray(exprs)) {
        return new ExpressionWrapper(parseFilterList(exprs, 'and'))
      }

      return new ExpressionWrapper(parseFilterObject(exprs, 'and'))
    },

    or(
      exprs:
        | ReadonlyArray<OperandExpression<SqlBool>>
        | Readonly<FilterObject<DB, TB>>
    ): ExpressionWrapper<DB, TB, SqlBool> {
      if (isReadonlyArray(exprs)) {
        return new ExpressionWrapper(parseFilterList(exprs, 'or'))
      }

      return new ExpressionWrapper(parseFilterObject(exprs, 'or'))
    },

    parens(...args: any[]) {
      const node = parseValueBinaryOperationOrExpression(args)

      if (ParensNode.is(node)) {
        // No double wrapping.
        return new ExpressionWrapper(node)
      } else {
        return new ExpressionWrapper(ParensNode.create(node))
      }
    },

    withSchema(schema: string): ExpressionBuilder<DB, TB> {
      return createExpressionBuilder(
        executor.withPluginAtFront(new WithSchemaPlugin(schema))
      )
    },
  })

  eb.fn = createFunctionModule()
  eb.eb = eb

  return eb
}

export function expressionBuilder<DB, TB extends keyof DB>(
  _: SelectQueryBuilder<DB, TB, any>
): ExpressionBuilder<DB, TB>

export function expressionBuilder<DB, TB extends keyof DB>(): ExpressionBuilder<
  DB,
  TB
>

export function expressionBuilder<DB, TB extends keyof DB>(
  _?: unknown
): ExpressionBuilder<DB, TB> {
  return createExpressionBuilder()
}
