import {
  ExistsExpression,
  FilterOperator,
  FilterValueExpressionOrList,
  WhereGrouper,
} from '../parser/filter-parser.js'
import { ReferenceExpression } from '../parser/reference-parser.js'
import { AnyRawBuilder } from '../util/type-utils.js'

export interface WhereInterface<DB, TB extends keyof DB> {
  /**
   * Adds a `where` clause to the query.
   *
   * Also see {@link WhereInterface.whereExists | whereExists}, {@link WhereInterface.whereRef | whereRef}
   * and {@link WhereInterface.whereRef | orWhere}.
   *
   * ### Examples
   *
   * Find a row by column value:
   *
   * ```ts
   * const person = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where('id', '=', 100)
   *   .executeTakeFirst()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "person" where "id" = $1
   * ```
   *
   * Operator can be any supported operator or if the typings don't support it
   * you can always use `db.raw('your operator')`.
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where('id', '>', 100)
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "person" where "id" > $1
   * ```
   *
   * The `where` methods don't change the type of the query. You can add
   * conditional `where`s easily by doing something like this:
   *
   * ```ts
   * let query = db
   *   .selectFrom('person')
   *   .selectAll()
   *
   * if (firstName) {
   *   query = query.where('first_name', '=', firstName)
   * }
   *
   * const persons = await query.execute()
   * ```
   *
   * This is true for basically all methods execpt the `select` and
   * `returning` methods, which DO change the return type of the
   * query.
   *
   * Both the first and third argument can also be subqueries.
   * A subquery is defined by passing a function and calling
   * the `selectFrom` method of the object passed into the
   * function:
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
   * of values. The values in the array can also be subqueries or raw
   * instances.
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
   * If everything else fails, you can always pass {@link Kysely.raw | raw}
   * as any of the arguments, including the operator:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where(
   *     db.raw('coalesce(first_name, last_name)'),
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
   * If you only pass one function argument to this method, it can be
   * used to create parentheses around other where statements:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where((qb) => qb
   *     .where('id', '=', 1)
   *     .orWhere('id', '=', 2)
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "person" (where "id" = 1 or "id" = 2)
   * ```
   *
   * In all examples above the columns were known at compile time
   * (except for the `raw` expressions). By default kysely only allows
   * you to refer to columns that exist in the database **and** can be
   * referred to in the current query and context.
   *
   * Sometimes you may want to refer to columns that come from the user
   * input and thus are not available at compile time.
   *
   * You have two options, `db.raw` or `db.dynamic`. The example below
   * uses both:
   *
   * ```ts
   * const { ref } = db.dynamic
   *
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where(ref(columnFromUserInput), '=', 1)
   *   .orWhere(db.raw('??', [columnFromUserInput]), '=', 2)
   *   .execute()
   * ```
   */
  where<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: FilterOperator,
    rhs: FilterValueExpressionOrList<DB, TB, RE>
  ): WhereInterface<DB, TB>

  where(grouper: WhereGrouper<DB, TB>): WhereInterface<DB, TB>

  where(raw: AnyRawBuilder): WhereInterface<DB, TB>

  /**
   * Adds a `where` clause where both sides of the operator are references
   * to columns.
   *
   * The normal `where` method treats the right hand side argument as a
   * value by default. `whereRef` treats it as a column reference. This method is
   * expecially useful with joins and correclated subqueries.
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
   *   .select((qb) => qb
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
    op: FilterOperator,
    rhs: ReferenceExpression<DB, TB>
  ): WhereInterface<DB, TB>

  /**
   * Adds an `or where` clause to the query. Otherwise works just like
   * {@link WhereInterface.where | where}.
   *
   * It's often necessary to wrap `or where` clauses in parentheses to control
   * precendence. You can use the one argument version of the `where` method
   * for that. See the examples.
   *
   * ### Examples
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where('id', '=', 1)
   *   .orWhere('id', '=', 2)
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "person" where "id" = 1 or "id" = 2
   * ```
   *
   * Grouping with parentheses:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where((qb) => qb
   *     .where('id', '=', 1)
   *     .orWhere('id', '=', 2)
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "person" (where "id" = 1 or "id" = 2)
   * ```
   *
   * Even the first `where` can be an `orWhere`. This is useful
   * if you are looping through a set of conditions:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .where((qb) => qb
   *     .orWhere('id', '=', 1)
   *     .orWhere('id', '=', 2)
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "person" (where "id" = 1 or "id" = 2)
   * ```
   */
  orWhere<RE extends ReferenceExpression<DB, TB>>(
    lhs: RE,
    op: FilterOperator,
    rhs: FilterValueExpressionOrList<DB, TB, RE>
  ): WhereInterface<DB, TB>

  orWhere(grouper: WhereGrouper<DB, TB>): WhereInterface<DB, TB>

  orWhere(raw: AnyRawBuilder): WhereInterface<DB, TB>

  /**
   * Adds an `or where` clause to the query. Otherwise works just like
   * {@link WhereInterface.whereRef | whereRef}.
   *
   * Also see {@link WhereInterface.orWhere | orWhere} and {@link WhereInterface.where | where}.
   */
  orWhereRef(
    lhs: ReferenceExpression<DB, TB>,
    op: FilterOperator,
    rhs: ReferenceExpression<DB, TB>
  ): WhereInterface<DB, TB>

  /**
   * Adds a `where exists` clause to the query.
   *
   * You can either use a subquery or a raw instance.
   *
   * ### Examples
   *
   * The query below selets all persons that own a pet named Catto:
   *
   * ```ts
   * const persons = await db
   *   .selectFrom('person')
   *   .selectAll()
   *   .whereExists((qb) => qb
   *     .selectFrom('pet')
   *     .select('pet.id')
   *     .whereRef('person.id', '=', 'pet.owner_id')
   *     .where('pet.name', '=', 'Catto')
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "person"
   * where exists (
   *   select "pet"."id"
   *   from "pet"
   *   where "person"."id" = "pet"."owner_id"
   *   and "pet"."name" = $1
   * )
   * ```
   *
   * The same query as in the previous example but with using raw:
   *
   * ```ts
   * db.selectFrom('person')
   *   .selectAll()
   *   .whereExists(
   *     db.raw(
   *       '(select pet.id from pet where person.id = pet.owner_id and pet.name = ?)',
   *       ['Catto']
   *     )
   *   )
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select * from "person"
   * where exists (
   *   select pet.id
   *   from pet
   *   where person.id = pet.owner_id
   *   and pet.name = $1
   * )
   * ```
   */
  whereExists(arg: ExistsExpression<DB, TB>): WhereInterface<DB, TB>

  /**
   * Just like {@link WhereInterface.whereExists | whereExists} but creates a `not exists` clause.
   */
  whereNotExists(arg: ExistsExpression<DB, TB>): WhereInterface<DB, TB>

  /**
   * Just like {@link WhereInterface.whereExists | whereExists} but creates a `or exists` clause.
   */
  orWhereExists(arg: ExistsExpression<DB, TB>): WhereInterface<DB, TB>

  /**
   * Just like {@link WhereInterface.whereExists | whereExists} but creates a `or not exists` clause.
   */
  orWhereNotExists(arg: ExistsExpression<DB, TB>): WhereInterface<DB, TB>
}
