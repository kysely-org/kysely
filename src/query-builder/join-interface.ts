import {
  JoinCallbackExpression,
  JoinReferenceExpression,
} from '../parser/join-parser.js'
import {
  FullJoinTableExpressionDatabase,
  LeftJoinTableExpressionDatabase,
  RightJoinTableExpressionDatabase,
  TableExpression,
  TableExpressionDatabase,
  TableExpressionTables,
} from '../parser/table-parser.js'

export interface JoinInterface<DB, TB extends keyof DB> {
  /**
   * Joins another table to the query using an inner join.
   *
   * ### Examples
   *
   * Simple usage by providing a table name and two columns to join:
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .innerJoin('pet', 'pet.owner_id', 'person.id')
   *   // `select` needs to come after the call to `innerJoin` so
   *   // that you can select from the joined table.
   *   .select('person.id', 'pet.name')
   *   .execute()
   *
   * result[0].id
   * result[0].name
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select "person"."id", "pet"."name"
   * from "person"
   * inner join "pet"
   * on "pet"."owner_id" = "person"."id"
   * ```
   *
   * You can give an alias for the joined table like this:
   *
   * ```ts
   * await db.selectFrom('person')
   *   .innerJoin('pet as p', 'p.owner_id', 'person.id')
   *   .where('p.name', '=', 'Doggo')
   *   .selectAll()
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select *
   * from "person"
   * inner join "pet" as "p"
   * on "p"."owner_id" = "person"."id"
   * where "p".name" = $1
   * ```
   *
   * You can provide a function as the second argument to get a join
   * builder for creating more complex joins. The join builder has a
   * bunch of `on*` methods for building the `on` clause of the join.
   * There's basically an equivalent for every `where` method
   * (`on`, `onRef`, `onExists` etc.). You can do all the same things
   * with the `on` method that you can with the corresponding `where`
   * method. See the `where` method documentation for more examples.
   *
   * ```ts
   * await db.selectFrom('person')
   *   .innerJoin(
   *     'pet',
   *     (join) => join
   *       .onRef('pet.owner_id', '=', 'person.id')
   *       .on('pet.name', '=', 'Doggo')
   *   )
   *   .selectAll()
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select *
   * from "person"
   * inner join "pet"
   * on "pet"."owner_id" = "person"."id"
   * and "pet"."name" = $1
   * ```
   *
   * You can join a subquery by providing a select query (or a callback)
   * as the first argument:
   *
   * ```ts
   * await db.selectFrom('person')
   *   .innerJoin(
   *     qb.selectFrom('pet')
   *       .select(['owner_id', 'name'])
   *       .where('name', '=', 'Doggo')
   *       .as('doggos'),
   *     'doggos.owner_id',
   *     'person.id',
   *   )
   *   .selectAll()
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * select *
   * from "person"
   * inner join (
   *   select "owner_id", "name"
   *   from "pet"
   *   where "name" = $1
   * ) as "doggos"
   * on "doggos"."owner_id" = "person"."id"
   * ```
   */
  innerJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): JoinInterface<
    TableExpressionDatabase<DB, TE>,
    TableExpressionTables<DB, TB, TE>
  >

  innerJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(
    table: TE,
    callback: FN
  ): JoinInterface<
    TableExpressionDatabase<DB, TE>,
    TableExpressionTables<DB, TB, TE>
  >

  /**
   * Just like {@link innerJoin} but adds a left join nstead of an inner join.
   */
  leftJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): JoinInterface<
    LeftJoinTableExpressionDatabase<DB, TE>,
    TableExpressionTables<DB, TB, TE>
  >

  leftJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(
    table: TE,
    callback: FN
  ): JoinInterface<
    LeftJoinTableExpressionDatabase<DB, TE>,
    TableExpressionTables<DB, TB, TE>
  >

  /**
   * Just like {@link innerJoin} but adds a right join instead of an inner join.
   */
  rightJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): JoinInterface<
    RightJoinTableExpressionDatabase<DB, TB, TE>,
    TableExpressionTables<DB, TB, TE>
  >

  rightJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(
    table: TE,
    callback: FN
  ): JoinInterface<
    RightJoinTableExpressionDatabase<DB, TB, TE>,
    TableExpressionTables<DB, TB, TE>
  >

  /**
   * Just like {@link innerJoin} but adds a full join instead of an inner join.
   */
  fullJoin<
    TE extends TableExpression<DB, TB>,
    K1 extends JoinReferenceExpression<DB, TB, TE>,
    K2 extends JoinReferenceExpression<DB, TB, TE>
  >(
    table: TE,
    k1: K1,
    k2: K2
  ): JoinInterface<
    FullJoinTableExpressionDatabase<DB, TB, TE>,
    TableExpressionTables<DB, TB, TE>
  >

  fullJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(
    table: TE,
    callback: FN
  ): JoinInterface<
    FullJoinTableExpressionDatabase<DB, TB, TE>,
    TableExpressionTables<DB, TB, TE>
  >
}
