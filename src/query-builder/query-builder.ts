import { AliasNode, createAliasNode } from '../operation-node/alias-node'
import { OperationNodeSource } from '../operation-node/operation-node-source'
import { CompiledQuery } from '../query-compiler/compiled-query'
import { QueryCompiler } from '../query-compiler/query-compiler'
import {
  JoinCallbackArg,
  JoinReferenceArg,
  parseJoinArgs,
} from './methods/join-method'

import {
  QueryNode,
  createQueryNode,
  cloneQueryNodeWithWhere,
  cloneQueryNodeWithJoin,
  cloneQueryNodeWithDistinctOnSelections,
  cloneQueryNodeWithFroms,
  cloneQueryNodeWithSelections,
  cloneQueryNodeWithModifier,
  cloneQueryNodeWithSelectModifier,
} from '../operation-node/query-node'

import {
  parseFromArgs,
  TableArg,
  FromQueryBuilder,
} from './methods/from-method'

import {
  parseSelectArgs,
  parseSelectAllArgs,
  SelectArg,
  SelectQueryBuilder,
  SelectAllQueryBuiler,
} from './methods/select-method'

import {
  parseFilterArgs,
  parseFilterReferenceArgs,
  FilterReferenceArg,
  FilterValueArg,
  ExistsFilterArg,
  parseExistsFilterArgs,
  FilterOperatorArg,
} from './methods/filter-method'

/**
 * The main query builder class.
 *
 * @typeParam DB - A type whose keys are table names/aliases and values are interfaces that
 *    define the table's columns and their typs. This type defines the tables, subqueries
 *    etc. that are avaialable to the query. This type contains all tables, even the ones
 *    that have not actually been joined to the query. the `TB` parameter defines the
 *    table names/aliases that have been joined to the query.
 *
 * @typeParam TB - The names/aliases of the tables that have been joined to the query
 *    using `from`, `with` any join method and so on. This type is a union of `DB`
 *    type's keys. For example `'person' | 'pet'`.
 *
 * @typePAram O - The query output row type.
 */
export class QueryBuilder<DB, TB extends keyof DB, O = {}>
  implements OperationNodeSource {
  readonly #queryNode: QueryNode

  constructor(queryNode: QueryNode = createQueryNode()) {
    this.#queryNode = queryNode
  }

  /**
   * Creates a subquery.
   *
   * The query builder returned by this method is typed in a way that you can refer to
   * all tables of the parent query in addition to the subquery's tables.
   *
   * @example
   * This example shows that you can refer to both `pet.owner_id` and `person.id`
   * columns from the subquery. This is needed to be able to create correlated
   * subqueries:
   *
   * ```ts
   * const result = await db.query('pet')
   *   .select([
   *     'pet.name',
   *     (qb) => qb.subQuery('person')
   *       .whereRef('person.id', '=', 'pet.owner_id')
   *       .select('person.first_name')
   *       .as('owner_name')
   *   ])
   *   .execute()
   *
   * console.log(result[0].owner_name)
   * ```
   *
   * The generated SQL (postgresql):
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
   * You can use a normal query in place of `(qb) => qb.subQuery(...)` but in
   * that case Kysely typings wouldn't allow you to reference `pet.owner_id`
   * because `pet` is not joined to that query.
   */
  subQuery<F extends TableArg<DB, TB, O>>(
    from: F[]
  ): FromQueryBuilder<DB, TB, O, F>

  subQuery<F extends TableArg<DB, TB, O>>(
    from: F
  ): FromQueryBuilder<DB, TB, O, F>

  subQuery(table: any): any {
    return new QueryBuilder(
      cloneQueryNodeWithFroms(createQueryNode(), parseFromArgs(this, table))
    )
  }

  /**
   * Adds a `where` clause to the query.
   *
   * Also see {@link QueryBuilder.whereExists | whereExists} and {@link QueryBuilder.whereRef | whereRef}
   *
   * @example
   * Find a row by column value:
   *
   * ```ts
   * db.query('person')
   *   .where('id', '=', 100)
   *   .selectAll()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person" where "id" = $1
   * ```
   *
   * @example
   * Operator can be any supported operator or if the typings don't support it
   * you can always use `db.raw('your operator')`.
   *
   * ```ts
   * db.query('person')
   *   .where('id', '>', 100)
   *   .selectAll()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person" where "id" > $1
   * ```
   *
   * @example
   * A `where in` query. The first argument can contain
   * the table name, but it's not mandatory.
   *
   * ```ts
   * db.query('person')
   *   .where('person.id', 'in', [100, 200, 300])
   *   .selectAll()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person" where "id" in ($1, $2, $3)
   * ```
   *
   * @example
   * Both the first and third argument can also be a subquery.
   * A subquery is defined by passing a function:
   *
   * ```ts
   * db.query('person')
   *   .where(
   *     (qb) => qb.subQuery('pet')
   *       .select('pet.id')
   *       .whereRef('pet.owner_id', '=', 'person.id'),
   *     'in',
   *     [100, 200, 300]
   *   )
   *   .selectAll()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select *
   * from "person"
   * where (
   *   select "pet"."id"
   *   from "pet"
   *   where "pet"."owner_id" = "person"."id"
   * ) in ($1, $2, $3)
   * ```
   *
   * @example
   * If everything else fails, you can always pass {@link Kysely.raw | raw}
   * as any of the arguments, including the operator:
   *
   * ```ts
   * db.query('person')
   *   .where(
   *     db.raw('coalesce(first_name, last_name)'),
   *     'like',
   *     '%' + name + '%',
   *   )
   *   .selectAll()
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select *
   * from "person"
   * where coalesce(first_name, last_name) like $1
   * ```
   *
   * @example
   * If you only pass one function argument to this method, it can be
   * used to create parentheses around other where clauses:
   *
   * ```ts
   * db.query('person')
   *   .selectAll()
   *   .where((qb) => qb
   *     .where('id', '=', 1)
   *     .orWhere('id', '=', 2)
   *   )
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person" (where "id" = 1 or "id" = 2)
   * ```
   */
  where(
    lhs: FilterReferenceArg<DB, TB, O>,
    op: FilterOperatorArg,
    rhs: FilterValueArg<DB, TB, O>
  ): QueryBuilder<DB, TB, O>

  where(
    grouper: (qb: QueryBuilder<DB, TB, O>) => QueryBuilder<DB, TB, O>
  ): QueryBuilder<DB, TB, O>

  where(...args: any[]): any {
    return new QueryBuilder(
      cloneQueryNodeWithWhere(
        this.#queryNode,
        'and',
        parseFilterArgs(this, args)
      )
    )
  }

  /**
   *
   */
  whereRef(
    lhs: FilterReferenceArg<DB, TB, O>,
    op: FilterOperatorArg,
    rhs: FilterReferenceArg<DB, TB, O>
  ): QueryBuilder<DB, TB, O> {
    return new QueryBuilder(
      cloneQueryNodeWithWhere(
        this.#queryNode,
        'and',
        parseFilterReferenceArgs(this, lhs, op, rhs)
      )
    )
  }

  /**
   * Adds an `or where` clause to the query. Otherwise works just like
   * {@link QueryBuilder.where}.
   *
   * It's often necessary to wrap `or where` clauses in parentheses to control
   * precendence. You can use the one argument version of the `where` method
   * for that. See the examples.
   *
   * @example
   * ```ts
   * db.query('person')
   *   .selectAll()
   *   .where('id', '=', 1)
   *   .orWhere('id', '=', 2)
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person" where "id" = 1 or "id" = 2
   * ```
   *
   * @example
   * Grouping with parentheses:
   *
   * ```ts
   * db.query('person')
   *   .selectAll()
   *   .where((qb) => qb
   *     .where('id', '=', 1)
   *     .orWhere('id', '=', 2)
   *   )
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person" (where "id" = 1 or "id" = 2)
   * ```
   *
   * @example
   * Even the first `where` can be an `orWhere`. This is useful
   * if you are looping through a set of conditions:
   *
   * ```ts
   * db.query('person')
   *   .selectAll()
   *   .where((qb) => qb
   *     .orWhere('id', '=', 1)
   *     .orWhere('id', '=', 2)
   *   )
   * ```
   *
   * The generated SQL (postgresql):
   *
   * ```sql
   * select * from "person" (where "id" = 1 or "id" = 2)
   * ```
   */
  orWhere(
    lhs: FilterReferenceArg<DB, TB, O>,
    op: FilterOperatorArg,
    rhs: FilterValueArg<DB, TB, O>
  ): QueryBuilder<DB, TB, O>

  orWhere(
    grouper: (qb: QueryBuilder<DB, TB, O>) => QueryBuilder<DB, TB, O>
  ): QueryBuilder<DB, TB, O>

  orWhere(...args: any[]): any {
    return new QueryBuilder(
      cloneQueryNodeWithWhere(
        this.#queryNode,
        'or',
        parseFilterArgs(this, args)
      )
    )
  }

  /**
   *
   */
  orWhereRef(
    lhs: FilterReferenceArg<DB, TB, O>,
    op: FilterOperatorArg,
    rhs: FilterReferenceArg<DB, TB, O>
  ): QueryBuilder<DB, TB, O> {
    return new QueryBuilder(
      cloneQueryNodeWithWhere(
        this.#queryNode,
        'or',
        parseFilterReferenceArgs(this, lhs, op, rhs)
      )
    )
  }

  /**
   *
   */
  whereExists(arg: ExistsFilterArg<DB, TB, O>): QueryBuilder<DB, TB, O> {
    return new QueryBuilder(
      cloneQueryNodeWithWhere(
        this.#queryNode,
        'and',
        parseExistsFilterArgs(this, 'exists', arg)
      )
    )
  }

  /**
   *
   */
  whereNotExists(arg: ExistsFilterArg<DB, TB, O>): QueryBuilder<DB, TB, O> {
    return new QueryBuilder(
      cloneQueryNodeWithWhere(
        this.#queryNode,
        'and',
        parseExistsFilterArgs(this, 'not exists', arg)
      )
    )
  }

  /**
   *
   */
  orWhereExists(arg: ExistsFilterArg<DB, TB, O>): QueryBuilder<DB, TB, O> {
    return new QueryBuilder(
      cloneQueryNodeWithWhere(
        this.#queryNode,
        'or',
        parseExistsFilterArgs(this, 'exists', arg)
      )
    )
  }

  /**
   *
   */
  orWhereNotExists(arg: ExistsFilterArg<DB, TB, O>): QueryBuilder<DB, TB, O> {
    return new QueryBuilder(
      cloneQueryNodeWithWhere(
        this.#queryNode,
        'or',
        parseExistsFilterArgs(this, 'not exists', arg)
      )
    )
  }

  /**
   *
   */
  select<S extends SelectArg<DB, TB, O>>(
    selections: S[]
  ): SelectQueryBuilder<DB, TB, O, S>

  /**
   *
   */
  select<S extends SelectArg<DB, TB, O>>(
    selection: S
  ): SelectQueryBuilder<DB, TB, O, S>

  select(selection: any): any {
    return new QueryBuilder(
      cloneQueryNodeWithSelections(
        this.#queryNode,
        parseSelectArgs(this, selection)
      )
    )
  }

  /**
   *
   */
  distinctOn<S extends SelectArg<DB, TB, O>>(
    selections: S[]
  ): QueryBuilder<DB, TB, O>

  /**
   *
   */
  distinctOn<S extends SelectArg<DB, TB, O>>(
    selection: S
  ): QueryBuilder<DB, TB, O>

  distinctOn(selection: any): any {
    return new QueryBuilder(
      cloneQueryNodeWithDistinctOnSelections(
        this.#queryNode,
        parseSelectArgs(this, selection)
      )
    )
  }

  /**
   *
   */
  distinct(): QueryBuilder<DB, TB, O> {
    return new QueryBuilder(
      cloneQueryNodeWithSelectModifier(this.#queryNode, 'Distinct')
    )
  }

  /**
   *
   */
  forUpdate(): QueryBuilder<DB, TB, O> {
    return new QueryBuilder(
      cloneQueryNodeWithModifier(this.#queryNode, 'ForUpdate')
    )
  }

  /**
   *
   */
  forShare(): QueryBuilder<DB, TB, O> {
    return new QueryBuilder(
      cloneQueryNodeWithModifier(this.#queryNode, 'ForShare')
    )
  }

  /**
   *
   */
  forKeyShare(): QueryBuilder<DB, TB, O> {
    return new QueryBuilder(
      cloneQueryNodeWithModifier(this.#queryNode, 'ForKeyShare')
    )
  }

  /**
   *
   */
  forNoKeyUpdate(): QueryBuilder<DB, TB, O> {
    return new QueryBuilder(
      cloneQueryNodeWithModifier(this.#queryNode, 'ForNoKeyUpdate')
    )
  }

  /**
   *
   */
  skipLocked(): QueryBuilder<DB, TB, O> {
    return new QueryBuilder(
      cloneQueryNodeWithModifier(this.#queryNode, 'SkipLocked')
    )
  }

  /**
   *
   */
  noWait(): QueryBuilder<DB, TB, O> {
    return new QueryBuilder(
      cloneQueryNodeWithModifier(this.#queryNode, 'NoWait')
    )
  }

  /**
   *
   */
  selectAll<T extends TB>(table: T[]): SelectAllQueryBuiler<DB, TB, O, T>

  /**
   *
   */
  selectAll<T extends TB>(table: T): SelectAllQueryBuiler<DB, TB, O, T>

  /**
   *
   */
  selectAll<T extends TB>(): SelectAllQueryBuiler<DB, TB, O, T>

  selectAll(table?: any): any {
    return new QueryBuilder(
      cloneQueryNodeWithSelections(this.#queryNode, parseSelectAllArgs(table))
    )
  }

  /**
   *
   */
  innerJoin<
    F extends TableArg<DB, TB, O>,
    K1 extends JoinReferenceArg<DB, TB, F>,
    K2 extends JoinReferenceArg<DB, TB, F>
  >(table: F, k1: K1, k2: K2): FromQueryBuilder<DB, TB, O, F>

  innerJoin<
    F extends TableArg<DB, TB, O>,
    FN extends JoinCallbackArg<DB, TB, F>
  >(table: F, callback: FN): FromQueryBuilder<DB, TB, O, F>

  innerJoin(...args: any): any {
    return new QueryBuilder(
      cloneQueryNodeWithJoin(
        this.#queryNode,
        parseJoinArgs(this, 'InnerJoin', args)
      )
    )
  }

  /**
   *
   */
  as<A extends string>(alias: A): AliasedQueryBuilder<DB, TB, O, A> {
    return new AliasedQueryBuilder(this, alias)
  }

  toOperationNode(): QueryNode {
    return this.#queryNode
  }

  compile(compiler: QueryCompiler): CompiledQuery {
    return compiler.compile(this.#queryNode)
  }

  castTo<T>(): QueryBuilder<DB, TB, T> {
    return new QueryBuilder(this.#queryNode)
  }

  async execute(): Promise<O[]> {
    return [{} as any]
  }
}

/**
 * {@link QueryBuilder} with an alias. The result of calling {@link QueryBuilder.as}.
 */
export class AliasedQueryBuilder<
  DB,
  TB extends keyof DB,
  O = undefined,
  A extends string = never
> {
  #queryBuilder: QueryBuilder<DB, TB, O>
  #alias: A

  /**
   * @private
   *
   * This needs to be here just so that the typings work. Without this
   * the generated .d.ts file contains no reference to the type param A
   * which causes this type to be equal to AliasedQueryBuilder with any A
   * as long as D, TB and O are the same.
   */
  protected get alias(): A {
    return this.#alias
  }

  toOperationNode(): AliasNode {
    return createAliasNode(this.#queryBuilder.toOperationNode(), this.#alias)
  }

  constructor(queryBuilder: QueryBuilder<DB, TB, O>, alias: A) {
    this.#queryBuilder = queryBuilder
    this.#alias = alias
  }
}
