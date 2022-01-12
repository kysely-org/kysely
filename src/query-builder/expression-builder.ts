import { SelectQueryBuilder } from './select-query-builder.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import {
  parseTableExpressionOrList,
  TableExpression,
  TableExpressionDatabase,
  TableExpressionOrList,
  TableExpressionTables,
} from '../parser/table-parser.js'
import { NoopQueryExecutor } from '../query-executor/noop-query-executor.js'
import { WithSchemaPlugin } from '../plugin/with-schema/with-schema-plugin.js'
import { createQueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { ParseContext } from '../parser/parse-context.js'
import { FunctionBuilder } from './function-builder.js'
import {
  ExtractTypeFromReferenceExpression,
  StringReference,
} from '../parser/reference-parser.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'

export class ExpressionBuilder<DB, TB extends keyof DB> {
  readonly #props: ExpressionBuilderProps

  constructor(props: ExpressionBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Returns a {@link FunctionBuilder} that can be used to write type safe function
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
   *   .select([
   *     'person.id',
   *     (qb) => qb.fn.count('pet.id').as('pet_count')
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
  get fn(): FunctionBuilder<DB, TB> {
    return new FunctionBuilder({ executor: this.#props.executor })
  }

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
   *   .select([
   *     'pet.name',
   *     (qb) => qb.selectFrom('person')
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
  selectFrom<TE extends TableExpression<DB, TB>>(
    from: TE[]
  ): SelectQueryBuilder<
    TableExpressionDatabase<DB, TE>,
    TableExpressionTables<DB, TB, TE>,
    {}
  >

  selectFrom<TE extends TableExpression<DB, TB>>(
    from: TE
  ): SelectQueryBuilder<
    TableExpressionDatabase<DB, TE>,
    TableExpressionTables<DB, TB, TE>,
    {}
  >

  selectFrom(table: TableExpressionOrList<DB, TB>): any {
    return new SelectQueryBuilder({
      queryId: createQueryId(),
      executor: this.#props.executor,
      parseContext: this.#props.parseContext,
      queryNode: SelectQueryNode.create(
        parseTableExpressionOrList(this.#props.parseContext, table)
      ),
    })
  }

  /**
   * See {@link QueryCreator.withSchema}
   */
  withSchema(schema: string): ExpressionBuilder<DB, TB> {
    return new ExpressionBuilder({
      ...this.#props,
      executor: this.#props.executor.withPluginAtFront(
        new WithSchemaPlugin(schema)
      ),
    })
  }

  /**
   * See {@link QueryCreator.raw}.
   */
  raw<T = unknown>(sql: string, parameters?: unknown[]): RawBuilder<T> {
    return new RawBuilder({
      queryId: createQueryId(),
      executor: this.#props.executor,
      sql,
      parameters,
    })
  }

  /**
   * This can be used to reference columns.
   *
   * ### Examples
   *
   * In the next example we use the `ref` method to reference
   * columns of the virtual table `excluded` in a type-safe way
   * to create an upsert operation:
   *
   * ```ts
   * db.insertInto('person')
   *   .values(person)
   *   .onConflict(oc => oc
   *     .column('id')
   *     .doUpdateSet({
   *       first_name: (eb) => eb.ref('excluded.first_name'),
   *       last_name: (eb) => eb.ref('excluded.last_name')
   *     })
   *   )
   * ```
   *
   * In the next example we use `ref` in a raw expression. Unless you
   * want to be as type-safe as possible, this is probably overkill:
   *
   * ```ts
   * db.update('pet').set({
   *   name: (eb) => eb.raw('concat(?, ?)', [
   *     eb.ref('pet.name'),
   *     suffix,
   *   ])
   * })
   * ```
   */
  ref<RE extends StringReference<DB, TB>>(
    reference: RE
  ): RawBuilder<ExtractTypeFromReferenceExpression<DB, TB, RE>> {
    return this.raw('??', [reference])
  }
}

export interface ExpressionBuilderProps {
  readonly executor: NoopQueryExecutor
  readonly parseContext: ParseContext
}
