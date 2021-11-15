import { QueryBuilder } from './query-builder.js'
import { SelectQueryNode } from '../operation-node/select-query-node.js'
import {
  parseTableExpressionOrList,
  TableExpression,
  QueryBuilderWithTable,
} from '../parser/table-parser.js'
import { NoopQueryExecutor } from '../query-executor/noop-query-executor.js'
import { WithSchemaPlugin } from '../plugin/with-schema/with-schema-plugin.js'
import { createQueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { ParseContext } from '../parser/parse-context.js'
import { FunctionBuilder } from './function-builder.js'

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
   * The generated SQL (postgresql):
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
   * @example
   * This example shows that you can refer to both `pet.owner_id` and `person.id`
   * columns from the subquery. This is needed to be able to create correlated
   * subqueries:
   *
   * ```ts
   * const result = await db.selectFrom('pet')
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
  subQuery<F extends TableExpression<DB, TB>>(
    from: F[]
  ): QueryBuilderWithTable<DB, TB, {}, F>

  subQuery<F extends TableExpression<DB, TB>>(
    from: F
  ): QueryBuilderWithTable<DB, TB, {}, F>

  subQuery(table: any): any {
    return new QueryBuilder({
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
}

export interface ExpressionBuilderProps {
  readonly executor: NoopQueryExecutor
  readonly parseContext: ParseContext
}
