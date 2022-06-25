import {
  JoinCallbackExpression,
  JoinReferenceExpression,
} from '../parser/join-parser.js'
import { TableExpression } from '../parser/table-parser.js'
import { AliasedRawBuilder } from '../raw-builder/raw-builder.js'
import { Nullable, NullableValues } from '../util/type-utils.js'
import { AliasedQueryBuilder } from './select-query-builder.js'

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
  ): JoinInterfaceWithInnerJoin<DB, TB, TE>

  innerJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(
    table: TE,
    callback: FN
  ): JoinInterfaceWithInnerJoin<DB, TB, TE>

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
  ): JoinInterfaceWithLeftJoin<DB, TB, TE>

  leftJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(
    table: TE,
    callback: FN
  ): JoinInterfaceWithLeftJoin<DB, TB, TE>

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
  ): JoinInterfaceWithRightJoin<DB, TB, TE>

  rightJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(
    table: TE,
    callback: FN
  ): JoinInterfaceWithRightJoin<DB, TB, TE>

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
  ): JoinInterfaceWithFullJoin<DB, TB, TE>

  fullJoin<
    TE extends TableExpression<DB, TB>,
    FN extends JoinCallbackExpression<DB, TB, TE>
  >(
    table: TE,
    callback: FN
  ): JoinInterfaceWithFullJoin<DB, TB, TE>
}

export type JoinInterfaceWithInnerJoin<
  DB,
  TB extends keyof DB,
  TE extends TableExpression<DB, TB>
> = TE extends `${infer T} as ${infer A}`
  ? T extends keyof DB
    ? JoinInterface<Omit<DB, A> & Record<A, DB[T]>, Exclude<TB, A> | A>
    : never
  : TE extends keyof DB
  ? JoinInterface<DB, TB | TE>
  : TE extends AliasedQueryBuilder<any, any, infer QO, infer QA>
  ? JoinInterface<Omit<DB, QA> & Record<QA, QO>, Exclude<TB, QA> | QA>
  : TE extends (qb: any) => AliasedQueryBuilder<any, any, infer QO, infer QA>
  ? JoinInterface<Omit<DB, QA> & Record<QA, QO>, Exclude<TB, QA> | QA>
  : TE extends AliasedRawBuilder<infer RO, infer RA>
  ? JoinInterface<Omit<DB, RA> & Record<RA, RO>, Exclude<TB, RA> | RA>
  : TE extends (qb: any) => AliasedRawBuilder<infer RO, infer RA>
  ? JoinInterface<Omit<DB, RA> & Record<RA, RO>, Exclude<TB, RA> | RA>
  : never

export type JoinInterfaceWithLeftJoin<
  DB,
  TB extends keyof DB,
  TE extends TableExpression<DB, TB>
> = TE extends `${infer T} as ${infer A}`
  ? T extends keyof DB
    ? JoinInterface<
        Omit<DB, A> & Record<A, Nullable<DB[T]>>,
        Exclude<TB, A> | A
      >
    : never
  : TE extends keyof DB
  ? JoinInterface<
      Omit<DB, TE> & Record<TE, Nullable<DB[TE]>>,
      Exclude<TB, TE> | TE
    >
  : TE extends AliasedQueryBuilder<any, any, infer QO, infer QA>
  ? JoinInterface<Omit<DB, QA> & Record<QA, Nullable<QO>>, Exclude<TB, QA> | QA>
  : TE extends (qb: any) => AliasedQueryBuilder<any, any, infer QO, infer QA>
  ? JoinInterface<Omit<DB, QA> & Record<QA, Nullable<QO>>, Exclude<TB, QA> | QA>
  : TE extends AliasedRawBuilder<infer RO, infer RA>
  ? JoinInterface<Omit<DB, RA> & Record<RA, Nullable<RO>>, Exclude<TB, RA> | RA>
  : TE extends (qb: any) => AliasedRawBuilder<infer RO, infer RA>
  ? JoinInterface<Omit<DB, RA> & Record<RA, Nullable<RO>>, Exclude<TB, RA> | RA>
  : never

export type JoinInterfaceWithRightJoin<
  DB,
  TB extends keyof DB,
  TE extends TableExpression<DB, TB>
> = TE extends `${infer T} as ${infer A}`
  ? T extends keyof DB
    ? JoinInterface<
        Omit<DB, TB | A> & NullableValues<Pick<DB, TB>> & Record<A, DB[T]>,
        TB | A
      >
    : never
  : TE extends keyof DB
  ? JoinInterface<
      Omit<DB, TB | TE> & NullableValues<Pick<DB, TB>> & Pick<DB, TE>,
      TB | TE
    >
  : TE extends AliasedQueryBuilder<any, any, infer QO, infer QA>
  ? JoinInterface<
      Omit<DB, TB | QA> & NullableValues<Pick<DB, TB>> & Record<QA, QO>,
      TB | QA
    >
  : TE extends (qb: any) => AliasedQueryBuilder<any, any, infer QO, infer QA>
  ? JoinInterface<
      Omit<DB, TB | QA> & NullableValues<Pick<DB, TB>> & Record<QA, QO>,
      TB | QA
    >
  : TE extends AliasedRawBuilder<infer RO, infer RA>
  ? JoinInterface<
      Omit<DB, TB | RA> & NullableValues<Pick<DB, TB>> & Record<RA, RO>,
      TB | RA
    >
  : TE extends (qb: any) => AliasedRawBuilder<infer RO, infer RA>
  ? JoinInterface<
      Omit<DB, TB | RA> & NullableValues<Pick<DB, TB>> & Record<RA, RO>,
      TB | RA
    >
  : never

export type JoinInterfaceWithFullJoin<
  DB,
  TB extends keyof DB,
  TE extends TableExpression<DB, TB>
> = TE extends `${infer T} as ${infer A}`
  ? T extends keyof DB
    ? JoinInterface<
        Omit<DB, TB | A> &
          NullableValues<Pick<DB, TB>> &
          Record<A, Nullable<DB[T]>>,
        TB | A
      >
    : never
  : TE extends keyof DB
  ? JoinInterface<
      Omit<DB, TB | TE> &
        NullableValues<Pick<DB, TB>> &
        NullableValues<Pick<DB, TE>>,
      TB | TE
    >
  : TE extends AliasedQueryBuilder<any, any, infer QO, infer QA>
  ? JoinInterface<
      Omit<DB, TB | QA> &
        NullableValues<Pick<DB, TB>> &
        Record<QA, Nullable<QO>>,
      TB | QA
    >
  : TE extends (qb: any) => AliasedQueryBuilder<any, any, infer QO, infer QA>
  ? JoinInterface<
      Omit<DB, TB | QA> &
        NullableValues<Pick<DB, TB>> &
        Record<QA, Nullable<QO>>,
      TB | QA
    >
  : TE extends AliasedRawBuilder<infer RO, infer RA>
  ? JoinInterface<
      Omit<DB, TB | RA> &
        NullableValues<Pick<DB, TB>> &
        Record<RA, Nullable<RO>>,
      TB | RA
    >
  : TE extends (qb: any) => AliasedRawBuilder<infer RO, infer RA>
  ? JoinInterface<
      Omit<DB, TB | RA> &
        NullableValues<Pick<DB, TB>> &
        Record<RA, Nullable<RO>>,
      TB | RA
    >
  : never
