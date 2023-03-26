import { SelectQueryBuilder } from '../query-builder/select-query-builder.js'
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
  parseStringReference,
  ReferenceExpression,
  StringReference,
} from '../parser/reference-parser.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import {
  BinaryOperatorExpression,
  ComparisonOperatorExpression,
  OperandValueExpression,
  OperandValueExpressionOrList,
  parseValueBinaryOperation,
} from '../parser/binary-operation-parser.js'
import { Expression } from './expression.js'
import { AndNode } from '../operation-node/and-node.js'
import { OrNode } from '../operation-node/or-node.js'
import { ParensNode } from '../operation-node/parens-node.js'
import { ExpressionWrapper } from './expression-wrapper.js'
import {
  ComparisonOperator,
  UnaryOperator,
} from '../operation-node/operator-node.js'
import { SqlBool } from '../util/type-utils.js'
import { parseUnaryOperation } from '../parser/unary-operation-parser.js'
import {
  ExtractTypeFromValueExpressionOrList,
  parseValueExpressionOrList,
} from '../parser/value-parser.js'
import { NOOP_QUERY_EXECUTOR } from '../query-executor/noop-query-executor.js'
import { ValueNode } from '../operation-node/value-node.js'

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
   *   .where(({ or, cmp, ref }) => or([
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
   * This can be used to add literal values to SQL snippets.
   *
   * WARNING! Using this with unchecked inputs WILL lead to SQL injection
   * vulnerabilities. The input is not checked or escaped by Kysely in any way.
   * You almost always want to use normal substitutions that get sent to the
   * db as parameters.
   *
   * ```ts
   * const firstName = 'first_name'
   *
   * db.selectFrom('dela')
   *   .where(({ cmp, literal, ref }) => cmp(literal(3), '=', ref('magic_number')))
   *   .selectAll()
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "dela" where 3 = "magic_number"
   * ```
   *
   * As you can see from the example above, the value was added directly to
   * the SQL string instead of as a parameter. Only use this function when
   * something can't be sent as a parameter.
   */
  literal<V>(value: V): ExpressionWrapper<V>

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
  bin<
    RE extends ReferenceExpression<DB, TB>,
    OP extends BinaryOperatorExpression
  >(
    lhs: RE,
    op: OP,
    rhs: OperandValueExpression<DB, TB, RE>
  ): ExpressionWrapper<
    OP extends ComparisonOperator
      ? SqlBool
      : ExtractTypeFromReferenceExpression<DB, TB, RE>
  >

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
  and(expres: ReadonlyArray<Expression<SqlBool>>): ExpressionWrapper<SqlBool>

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
  or(expres: ReadonlyArray<Expression<SqlBool>>): ExpressionWrapper<SqlBool>

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
  function unary<RE extends ReferenceExpression<DB, TB>>(
    op: UnaryOperator,
    expr: RE
  ): ExpressionWrapper<ExtractTypeFromReferenceExpression<DB, TB, RE>> {
    return new ExpressionWrapper(parseUnaryOperation(op, expr))
  }

  return {
    get fn(): FunctionModule<DB, TB> {
      return createFunctionModule()
    },

    selectFrom(table: TableExpressionOrList<DB, TB>): any {
      return new SelectQueryBuilder({
        queryId: createQueryId(),
        executor: executor,
        queryNode: SelectQueryNode.create(parseTableExpressionOrList(table)),
      })
    },

    ref<RE extends StringReference<DB, TB>>(
      reference: RE
    ): ExpressionWrapper<ExtractTypeFromReferenceExpression<DB, TB, RE>> {
      return new ExpressionWrapper(parseStringReference(reference))
    },

    val<VE>(
      value: VE
    ): ExpressionWrapper<ExtractTypeFromValueExpressionOrList<VE>> {
      return new ExpressionWrapper(parseValueExpressionOrList(value))
    },

    literal<V>(value: V): ExpressionWrapper<V> {
      return new ExpressionWrapper(ValueNode.createImmediate(value))
    },

    cmp<
      O extends SqlBool = SqlBool,
      RE extends ReferenceExpression<DB, TB> = ReferenceExpression<DB, TB>
    >(
      lhs: RE,
      op: ComparisonOperatorExpression,
      rhs: OperandValueExpressionOrList<DB, TB, RE>
    ): ExpressionWrapper<O> {
      return new ExpressionWrapper(parseValueBinaryOperation(lhs, op, rhs))
    },

    bin<
      RE extends ReferenceExpression<DB, TB>,
      OP extends BinaryOperatorExpression
    >(
      lhs: RE,
      op: OP,
      rhs: OperandValueExpression<DB, TB, RE>
    ): ExpressionWrapper<
      OP extends ComparisonOperator
        ? SqlBool
        : ExtractTypeFromReferenceExpression<DB, TB, RE>
    > {
      return new ExpressionWrapper(parseValueBinaryOperation(lhs, op, rhs))
    },

    unary,

    not<RE extends ReferenceExpression<DB, TB>>(
      expr: RE
    ): ExpressionWrapper<ExtractTypeFromReferenceExpression<DB, TB, RE>> {
      return unary('not', expr)
    },

    exists<RE extends ReferenceExpression<DB, TB>>(
      expr: RE
    ): ExpressionWrapper<SqlBool> {
      return unary('exists', expr)
    },

    neg<RE extends ReferenceExpression<DB, TB>>(
      expr: RE
    ): ExpressionWrapper<ExtractTypeFromReferenceExpression<DB, TB, RE>> {
      return unary('-', expr)
    },

    and(exprs: ReadonlyArray<Expression<SqlBool>>): ExpressionWrapper<SqlBool> {
      if (exprs.length === 0) {
        return new ExpressionWrapper(ValueNode.createImmediate(true))
      } else if (exprs.length === 1) {
        return new ExpressionWrapper(exprs[0].toOperationNode())
      }

      let node = AndNode.create(
        exprs[0].toOperationNode(),
        exprs[1].toOperationNode()
      )

      for (let i = 2; i < exprs.length; ++i) {
        node = AndNode.create(node, exprs[i].toOperationNode())
      }

      return new ExpressionWrapper(ParensNode.create(node))
    },

    or(exprs: ReadonlyArray<Expression<SqlBool>>): ExpressionWrapper<SqlBool> {
      if (exprs.length === 0) {
        return new ExpressionWrapper(ValueNode.createImmediate(false))
      } else if (exprs.length === 1) {
        return new ExpressionWrapper(exprs[0].toOperationNode())
      }

      let node = OrNode.create(
        exprs[0].toOperationNode(),
        exprs[1].toOperationNode()
      )

      for (let i = 2; i < exprs.length; ++i) {
        node = OrNode.create(node, exprs[i].toOperationNode())
      }

      return new ExpressionWrapper(ParensNode.create(node))
    },

    withSchema(schema: string): ExpressionBuilder<DB, TB> {
      return createExpressionBuilder(
        executor.withPluginAtFront(new WithSchemaPlugin(schema))
      )
    },
  }
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
