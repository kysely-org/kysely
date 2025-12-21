import {
  CreateIndexNode,
  type IndexType,
} from '../operation-node/create-index-node.js'
import type { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
import {
  type ExtractColumnNameFromOrderedColumnName,
  type OrderedColumnName,
  parseOrderedColumnName,
} from '../parser/reference-parser.js'
import { parseTable } from '../parser/table-parser.js'
import type { CompiledQuery } from '../query-compiler/compiled-query.js'
import type { Compilable } from '../util/compilable.js'
import type { QueryExecutor } from '../query-executor/query-executor.js'
import type { QueryId } from '../util/query-id.js'
import { freeze, isString } from '../util/object-utils.js'
import type { Expression } from '../expression/expression.js'
import {
  type ComparisonOperatorExpression,
  parseValueBinaryOperationOrExpression,
} from '../parser/binary-operation-parser.js'
import { QueryNode } from '../operation-node/query-node.js'
import type { ExpressionBuilder } from '../expression/expression-builder.js'
import type { ShallowRecord, SqlBool } from '../util/type-utils.js'
import { ImmediateValueTransformer } from '../plugin/immediate-value/immediate-value-transformer.js'

export class CreateIndexBuilder<C = never>
  implements OperationNodeSource, Compilable
{
  readonly #props: CreateIndexBuilderProps

  constructor(props: CreateIndexBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Adds the "if not exists" modifier.
   *
   * If the index already exists, no error is thrown if this method has been called.
   */
  ifNotExists(): CreateIndexBuilder<C> {
    return new CreateIndexBuilder({
      ...this.#props,
      node: CreateIndexNode.cloneWith(this.#props.node, {
        ifNotExists: true,
      }),
    })
  }

  /**
   * Makes the index unique.
   */
  unique(): CreateIndexBuilder<C> {
    return new CreateIndexBuilder({
      ...this.#props,
      node: CreateIndexNode.cloneWith(this.#props.node, {
        unique: true,
      }),
    })
  }

  /**
   * Adds `nulls not distinct` specifier to index.
   * This only works on some dialects like PostgreSQL.
   *
   * ### Examples
   *
   * ```ts
   * db.schema.createIndex('person_first_name_index')
   *  .on('person')
   *  .column('first_name')
   *  .nullsNotDistinct()
   *  .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * create index "person_first_name_index"
   * on "test" ("first_name")
   * nulls not distinct;
   * ```
   */
  nullsNotDistinct(): CreateIndexBuilder<C> {
    return new CreateIndexBuilder({
      ...this.#props,
      node: CreateIndexNode.cloneWith(this.#props.node, {
        nullsNotDistinct: true,
      }),
    })
  }

  /**
   * Specifies the table for the index.
   */
  on(table: string): CreateIndexBuilder<C> {
    return new CreateIndexBuilder({
      ...this.#props,
      node: CreateIndexNode.cloneWith(this.#props.node, {
        table: parseTable(table),
      }),
    })
  }

  /**
   * Adds a column to the index.
   *
   * Also see {@link columns} for adding multiple columns at once.
   *
   * ### Examples
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * await db.schema
   *   .createIndex('person_first_name_and_age_index')
   *   .on('person')
   *   .column('first_name')
   *   .column<'last_name'>(sql`left(lower("last_name"), 1)`)
   *   .column('age desc')
   *   .where('last_name', 'is not', null)
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * create index "person_first_name_and_age_index"
   * on "person" ("first_name", left(lower("last_name"), 1), "age" desc)
   * where "last_name" is not null
   * ```
   */
  column<CL extends string>(
    column: OrderedColumnName<CL>,
  ): CreateIndexBuilder<C | ExtractColumnNameFromOrderedColumnName<CL>>

  column<CL extends string = never>(
    expression: Expression<any>,
  ): CreateIndexBuilder<C | CL>

  column(arg: any): any {
    return new CreateIndexBuilder({
      ...this.#props,
      node: CreateIndexNode.cloneWithColumns(this.#props.node, [
        isString(arg) ? parseOrderedColumnName(arg) : arg.toOperationNode(),
      ]),
    })
  }

  /**
   * Adds a list of columns to the index.
   *
   * Also see {@link column} for adding a single column.
   *
   * ### Examples
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * await db.schema
   *   .createIndex('person_first_name_and_age_index')
   *   .on('person')
   *   .columns(['first_name', sql`left(lower("last_name"), 1)`, 'age desc'])
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * create index "person_first_name_and_age_index"
   * on "person" ("first_name", left(lower("last_name"), 1), "age" desc)
   * ```
   */
  columns<CL extends string>(
    columns: (OrderedColumnName<CL> | Expression<any>)[],
  ): CreateIndexBuilder<C | ExtractColumnNameFromOrderedColumnName<CL>> {
    return new CreateIndexBuilder({
      ...this.#props,
      node: CreateIndexNode.cloneWithColumns(
        this.#props.node,
        columns.map((item) =>
          isString(item)
            ? parseOrderedColumnName(item)
            : item.toOperationNode(),
        ),
      ),
    })
  }

  /**
   * Adds an arbitrary expression as a column to the index.
   *
   * ### Examples
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * await db.schema
   *   .createIndex('person_first_name_index')
   *   .on('person')
   *   .expression(sql`first_name COLLATE "fi_FI"`)
   *   .column('gender')
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * create index "person_first_name_index"
   * on "person" (first_name COLLATE "fi_FI", "gender")
   * ```
   *
   * @deprecated Use {@link column} or {@link columns} with an {@link Expression} instead.
   */
  // TODO: remove in v0.30
  expression(expression: Expression<any>): CreateIndexBuilder<C> {
    return new CreateIndexBuilder({
      ...this.#props,
      node: CreateIndexNode.cloneWithColumns(this.#props.node, [
        expression.toOperationNode(),
      ]),
    })
  }

  /**
   * Specifies the index type.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .createIndex('person_first_name_index')
   *   .on('person')
   *   .column('first_name')
   *   .using('hash')
   *   .execute()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * create index `person_first_name_index` on `person` (`first_name`) using hash
   * ```
   */
  using(indexType: IndexType): CreateIndexBuilder<C>
  using(indexType: string): CreateIndexBuilder<C>
  using(indexType: string): CreateIndexBuilder<C> {
    return new CreateIndexBuilder({
      ...this.#props,
      node: CreateIndexNode.cloneWith(this.#props.node, {
        using: RawNode.createWithSql(indexType),
      }),
    })
  }

  /**
   * Adds a where clause to the query. This Effectively turns the index partial.
   *
   * This is only supported by some dialects like PostgreSQL and MS SQL Server.
   *
   * ### Examples
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * await db.schema
   *    .createIndex('orders_unbilled_index')
   *    .on('orders')
   *    .column('order_nr')
   *    .where(sql.ref('billed'), 'is not', true)
   *    .where('order_nr', 'like', '123%')
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * create index "orders_unbilled_index" on "orders" ("order_nr") where "billed" is not true and "order_nr" like '123%'
   * ```
   *
   * Column names specified in {@link column} or {@link columns} are known at compile-time
   * and can be referred to in the current query and context.
   *
   * Sometimes you may want to refer to columns that exist in the table but are not
   * part of the current index. In that case you can refer to them using {@link sql}
   * expressions.
   *
   * Parameters are always sent as literals due to database restrictions.
   */
  where(
    lhs: C | Expression<any>,
    op: ComparisonOperatorExpression,
    rhs: unknown,
  ): CreateIndexBuilder<C>

  where(
    factory: (
      qb: ExpressionBuilder<
        ShallowRecord<string, ShallowRecord<C & string, any>>,
        string
      >,
    ) => Expression<SqlBool>,
  ): CreateIndexBuilder<C>

  where(expression: Expression<SqlBool>): CreateIndexBuilder<C>

  where(...args: any[]): any {
    const transformer = new ImmediateValueTransformer()

    return new CreateIndexBuilder({
      ...this.#props,
      node: QueryNode.cloneWithWhere(
        this.#props.node,
        transformer.transformNode(
          parseValueBinaryOperationOrExpression(args),
          this.#props.queryId,
        ),
      ),
    })
  }

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  toOperationNode(): CreateIndexNode {
    return this.#props.executor.transformQuery(
      this.#props.node,
      this.#props.queryId,
    )
  }

  compile(): CompiledQuery {
    return this.#props.executor.compileQuery(
      this.toOperationNode(),
      this.#props.queryId,
    )
  }

  async execute(): Promise<void> {
    await this.#props.executor.executeQuery(this.compile())
  }
}

export interface CreateIndexBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: CreateIndexNode
}
