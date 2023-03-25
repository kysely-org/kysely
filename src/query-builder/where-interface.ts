import { Expression } from '../expression/expression.js'
import {
  ComparisonOperatorExpression,
  OperandValueExpressionOrList,
} from '../parser/binary-operation-parser.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import { ExistsExpression } from '../parser/unary-operation-parser.js'
import { SqlBool } from '../util/type-utils.js'
import { ExpressionBuilder } from './expression-builder.js'
import { WhereExpressionBuilder } from './deprecated-where-expression-builder.js'

export interface WhereInterface<DB, TB extends keyof DB> {
  /**
   * Adds a `where` expression to the query.
   *
   * Calling this method multiple times will combine the expressions using `and`.
   *
   * Also see {@link whereRef}
   *
   * ### Examples
   *
   * ```ts
   * const person = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where('first_name', '=', 'Jennifer')
   *   .where('age', '>', 40)
   *   .executeTakeFirst()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "person" where "first_name" = $1 and "age" > $2
   * ```
   *
   * Operator can be any supported operator or if the typings don't support it
   * you can always use:
   *
   * ```ts
   * sql`your operator`
   * ```
   *
   * You can add expressions conditionally like this:
   *
   * ```ts
   * let query = db
   *   .selectFrom('person')
   *   .selectAll()
   *
   * if (firstName) {
   *   // The query builder is immutable. Remember to reassign
   *   // the result back to the query variable.
   *   query = query.where('first_name', '=', firstName)
   * }
   *
   * if (lastName) {
   *   query = query.where('last_name', '=', lastName)
   * }
   *
   * const persons = await query.execute()
   * ```
   *
   * Both the first and third argument can also be arbitrary expressions like
   * subqueries. An expression can defined by passing a function and calling
   * the methods of the {@link ExpressionBuilder} passed to the callback:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where(
   *     (qb) => qb.selectFrom('pet')
   *       .select('pet.name')
   *       .whereRef('pet.owner_id', '=', 'person.id')
   *       .limit(1),
   *     '=',
   *     'Fluffy'
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select *
   * from "person"
   * where (
   *   select "pet"."name"
   *   from "pet"
   *   where "pet"."owner_id" = "person"."id"
   *   limit $1
   * ) = $2
   * ```
   *
   * A `where in` query can be built by using the `in` operator and an array
   * of values. The values in the array can also be expressions:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where('person.id', 'in', [100, 200, 300])
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "person" where "id" in ($1, $2, $3)
   * ```
   *
   * For complex `where` expressions you can pass in a single callback and
   * use the {@link ExpressionBuilder} to build your expression:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll('person')
   *   .where(({ cmp, or, and, not, exists, selectFrom, val }) => and([
   *     or([
   *       cmp('first_name', '=', firstName),
   *       cmp('age', '<', maxAge)
   *     ]),
   *     not(exists(
   *       selectFrom('pet').select('pet.id').whereRef('pet.owner_id', '=', 'person.id')
   *     ))
   *   ]))
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person".*
   * from "person"
   * where (
   *   (
   *     "first_name" = $1
   *     or "age" < $2
   *   )
   *   and not exists (
   *     select "pet"."id" from "pet" where "pet"."owner_id" = "person"."id"
   *   )
   * )
   * ```
   *
   * If everything else fails, you can always use the {@link sql} tag
   * as any of the arguments, including the operator:
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where(
   *     sql`coalesce(first_name, last_name)`,
   *     'like',
   *     '%' + name + '%',
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "person"
   * where coalesce(first_name, last_name) like $1
   * ```
   *
   * In all examples above the columns were known at compile time
   * (except for the raw {@link sql} expressions). By default kysely only
   * allows you to refer to columns that exist in the database **and**
   * can be referred to in the current query and context.
   *
   * Sometimes you may want to refer to columns that come from the user
   * input and thus are not available at compile time.
   *
   * You have two options, the {@link sql} tag or `db.dynamic`. The example below
   * uses both:
   *
   * ```ts
   * import { sql } from 'kysely'
   * const { ref } = db.dynamic
   *
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where(ref(columnFromUserInput), '=', 1)
   *   .where(sql.id(columnFromUserInput), '=', 2)
   *   .execute()
   * ```
   */
  where<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): WhereInterface<DB, TB>

  where(factory: WhereExpressionFactory<DB, TB>): WhereInterface<DB, TB>

  where(expression: Expression<any>): WhereInterface<DB, TB>

  /**
   * Adds a `where` clause where both sides of the operator are references
   * to columns.
   *
   * The normal `where` method treats the right hand side argument as a
   * value by default. `whereRef` treats it as a column reference. This method is
   * expecially useful with joins and correlated subqueries.
   *
   * ### Examples
   *
   * Usage with a join:
   *
   * ```ts
   * db.selectFrom(['person', 'pet'])
   *   .selectAll()
   *   .whereRef('person.first_name', '=', 'pet.name')
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "person", "pet" where "person"."first_name" = "pet"."name"
   * ```
   *
   * Usage in a subquery:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll('person')
   *   .select((eb) => eb
   *     .selectFrom('pet')
   *     .select('name')
   *     .whereRef('pet.owner_id', '=', 'person.id')
   *     .limit(1)
   *     .as('pet_name')
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person".*, (
   *   select "name"
   *   from "pet"
   *   where "pet"."owner_id" = "person"."id"
   *   limit $1
   * ) as "pet_name"
   * from "person"
   */
  whereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): WhereInterface<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orWhere<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: ComparisonOperatorExpression,
    rhs: OperandValueExpressionOrList<DB, TB, RE>
  ): WhereInterface<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orWhere(factory: WhereExpressionFactory<DB, TB>): WhereInterface<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orWhere(expression: Expression<any>): WhereInterface<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orWhereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: ComparisonOperatorExpression,
    rhs: ReferenceExpression<DB, TB>
  ): WhereInterface<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  whereExists(arg: ExistsExpression<DB, TB>): WhereInterface<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  whereNotExists(arg: ExistsExpression<DB, TB>): WhereInterface<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orWhereExists(arg: ExistsExpression<DB, TB>): WhereInterface<DB, TB>

  /**
   * @deprecated Follow [these](https://github.com/koskimas/kysely/releases/tag/0.24.0) instructions to migrate
   */
  orWhereNotExists(arg: ExistsExpression<DB, TB>): WhereInterface<DB, TB>

  /**
   * Clears all where expressions from the query.
   *
   * ### Examples
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll()
   *   .where('id','=',42)
   *   .clearWhere()
   * ```
   *
   * The generated SQL(PostgreSQL):
   *
   * ```sql
   * select * from "person"
   * ```
   */
  clearWhere(): WhereInterface<DB, TB>
}

export type WhereExpressionFactory<DB, TB extends keyof DB> = (
  eb: WhereExpressionBuilder<DB, TB>
) => Expression<SqlBool> | WhereExpressionBuilder<DB, TB>
