import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import {
  InsertObject,
  InsertObjectOrList,
  parseInsertObjectOrList,
} from '../parser/insert-values-parser.js'
import { InsertQueryNode } from '../operation-node/insert-query-node.js'
import { MergePartial, SingleResultType } from '../util/type-utils.js'
import { preventAwait } from '../util/prevent-await.js'
import { Compilable } from '../util/compilable.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { InsertResult } from './insert-result.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { NoResultError, NoResultErrorConstructor } from './no-result-error.js'
import {
  ComplexExpression,
  parseComplexExpression,
} from '../parser/complex-expression-parser.js'
import { ColumnNode } from '../operation-node/column-node.js'

export class ReplaceQueryBuilder<DB, TB extends keyof DB, O>
  implements OperationNodeSource, Compilable
{
  readonly #props: ReplaceQueryBuilderProps

  constructor(props: ReplaceQueryBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Sets the values to insert/replace for a {@link Kysely.replaceInto | replace} query.
   *
   * This method takes an object whose keys are column names and values are
   * values to insert/replace. In addition to the column's type, the values can be
   * raw {@link sql} snippets or select queries.
   *
   * You must provide all fields you haven't explicitly marked as nullable
   * or optional using {@link Generated} or {@link ColumnType}.
   *
   * The return value of an `replace` query is an instance of {@link InsertResult}. The
   * {@link InsertResult.insertId | insertId} field holds the auto incremented primary
   * key if the database returned one.
   *
   * Also see the {@link expression} method for inserting/replacing the result of a select
   * query or any other expression.
   *
   * ### Examples
   *
   * Insert/replace a row into `person`:
   * ```ts
   * const id = await db
   *   .replaceInto('person')
   *   .values({
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   })
   *   .executeTakeFirstOrThrow()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * replace into `person` (`first_name`, `last_name`) values (?, ?)
   * ```
   *
   * You can insert/replace multiple rows by providing an array.
   *
   * ```ts
   * await db
   *   .replaceInto('person')
   *   .values([{
   *     first_name: 'Jennifer',
   *     last_name: 'Aniston'
   *   }, {
   *     first_name: 'Arnold',
   *     last_name: 'Schwarzenegger',
   *   }])
   *   .execute()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * replace into `person` (`first_name`, `last_name`) values ((?, ?), (?, ?))
   * ```
   *
   * In addition to primitives, the values can also be raw sql expressions or
   * select queries:
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * const result = await db
   *   .replaceInto('person')
   *   .values({
   *     first_name: 'Jennifer',
   *     age: db.selectFrom('person').select(sql`avg(age)`),
   *     updated_at: sql`CURRENT_TIMESTAMP()`,
   *   })
   *   .executeTakeFirst()
   *
   * console.log(result.insertId)
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * replace into `person` (`first_name`, `age`, `updated_at`)
   * values (?, (select avg(age) from `person`))
   * ```
   *
   * You can also use the callback version of subqueries or raw expressions:
   *
   * ```ts
   * db.with('jennifer', (db) => db
   *   .selectFrom('person')
   *   .where('first_name', '=', 'Jennifer')
   *   .select(['id', 'first_name', 'gender'])
   *   .limit(1)
   * ).replaceInto('pet').values({
   *   owner_id: (eb) => eb.selectFrom('jennifer').select('id'),
   *   name: (eb) => eb.selectFrom('jennifer').select('first_name'),
   *   species: 'cat',
   * })
   * ```
   */
  values(row: InsertObject<DB, TB>): ReplaceQueryBuilder<DB, TB, O>

  values(
    row: ReadonlyArray<InsertObject<DB, TB>>
  ): ReplaceQueryBuilder<DB, TB, O>

  values(args: InsertObjectOrList<DB, TB>): any {
    const [columns, values] = parseInsertObjectOrList(args)

    return new ReplaceQueryBuilder({
      ...this.#props,
      queryNode: InsertQueryNode.cloneWith(this.#props.queryNode, {
        columns,
        values,
        replace: true,
      }),
    })
  }

  /**
   * Sets the columns to insert/replace.
   *
   * The {@link values} method sets both the columns and the values and this method
   * is not needed. But if you are using the {@link expression} method, you can use
   * this method to set the columns to insert/replace.
   *
   * ### Examples
   *
   * ```ts
   * db.replaceInto('person')
   *   .columns(['first_name'])
   *   .expression((eb) => eb.selectFrom('pet').select('pet.name'))
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * replace into `person` (`first_name`)
   * select `pet`.`name` from `pet`
   * ```
   */
  columns(
    columns: ReadonlyArray<keyof DB[TB] & string>
  ): ReplaceQueryBuilder<DB, TB, O> {
    return new ReplaceQueryBuilder({
      ...this.#props,
      queryNode: InsertQueryNode.cloneWith(this.#props.queryNode, {
        columns: freeze(columns.map(ColumnNode.create)),
      }),
    })
  }

  /**
   * Insert/replace an arbitrary expression. For example the result of a select query.
   *
   * ### Examples
   *
   * ```ts
   * db.replaceInto('person')
   *   .columns(['first_name'])
   *   .expression((eb) => eb.selectFrom('pet').select('pet.name'))
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * replace into `person` (`first_name`)
   * select `pet`.`name` from `pet`
   * ```
   */
  expression(
    expression: ComplexExpression<DB, TB>
  ): ReplaceQueryBuilder<DB, TB, O> {
    return new ReplaceQueryBuilder({
      ...this.#props,
      queryNode: InsertQueryNode.cloneWith(this.#props.queryNode, {
        values: parseComplexExpression(expression),
        replace: true,
      }),
    })
  }

  /**
   * Simply calls the given function passing `this` as the only argument.
   *
   * If you want to conditionally call a method on `this`, see
   * the {@link if} method.
   *
   * ### Examples
   *
   * The next example uses a helper funtion `log` to log a query:
   *
   * ```ts
   * function log<T extends Compilable>(qb: T): T {
   *   console.log(qb.compile())
   *   return qb
   * }
   *
   * db.updateTable('person')
   *   .set(values)
   *   .call(log)
   *   .execute()
   * ```
   */
  call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  /**
   * Call `func(this)` if `condition` is true.
   *
   * This method is especially handy with optional selects. Any `returning` or `returningAll`
   * method calls add columns as optional fields to the output type when called inside
   * the `func` callback. This is because we can't know if those selections were actually
   * made before running the code.
   *
   * You can also call any other methods inside the callback.
   *
   * ### Examples
   *
   * ```ts
   * async function insertPerson(values: InsertablePerson, returnLastName: boolean) {
   *   return await db
   *     .insertInto('person')
   *     .values(values)
   *     .returning(['id', 'first_name'])
   *     .if(returnLastName, (qb) => qb.returning('last_name'))
   *     .executeTakeFirstOrThrow()
   * }
   * ```
   *
   * Any selections added inside the `if` callback will be added as optional fields to the
   * output type since we can't know if the selections were actually made before running
   * the code. In the example above the return type of the `insertPerson` function is:
   *
   * ```ts
   * {
   *   id: number
   *   first_name: string
   *   last_name?: string
   * }
   * ```
   */
  if<O2>(
    condition: boolean,
    func: (qb: this) => ReplaceQueryBuilder<DB, TB, O2>
  ): ReplaceQueryBuilder<
    DB,
    TB,
    O2 extends InsertResult
      ? InsertResult
      : O extends InsertResult
      ? Partial<O2>
      : MergePartial<O, O2>
  > {
    if (condition) {
      return func(this) as any
    }

    return new ReplaceQueryBuilder({
      ...this.#props,
    })
  }

  /**
   * Change the output type of the query.
   *
   * You should only use this method as the last resort if the types
   * don't support your use case.
   */
  castTo<T>(): ReplaceQueryBuilder<DB, TB, T> {
    return new ReplaceQueryBuilder(this.#props)
  }

  /**
   * Returns a copy of this InsertQueryBuilder instance with the given plugin installed.
   */
  withPlugin(plugin: KyselyPlugin): ReplaceQueryBuilder<DB, TB, O> {
    return new ReplaceQueryBuilder({
      ...this.#props,
      executor: this.#props.executor.withPlugin(plugin),
    })
  }

  toOperationNode(): InsertQueryNode {
    return this.#props.executor.transformQuery(
      this.#props.queryNode,
      this.#props.queryId
    )
  }

  compile(): CompiledQuery {
    return this.#props.executor.compileQuery(
      this.toOperationNode(),
      this.#props.queryId
    )
  }

  /**
   * Executes the query and returns an array of rows.
   *
   * Also see the {@link executeTakeFirst} and {@link executeTakeFirstOrThrow} methods.
   */
  async execute(): Promise<O[]> {
    const compildQuery = this.compile()

    const result = await this.#props.executor.executeQuery<O>(
      compildQuery,
      this.#props.queryId
    )

    return [new InsertResult(result.insertId) as unknown as O]
  }

  /**
   * Executes the query and returns the first result or undefined if
   * the query returned no result.
   */
  async executeTakeFirst(): Promise<SingleResultType<O>> {
    const [result] = await this.execute()
    return result as SingleResultType<O>
  }

  /**
   * Executes the query and returns the first result or throws if
   * the query returned no result.
   *
   * By default an instance of {@link NoResultError} is thrown, but you can
   * provide a custom error class as the only argument to throw a different
   * error.
   */
  async executeTakeFirstOrThrow(
    errorConstructor: NoResultErrorConstructor = NoResultError
  ): Promise<O> {
    const result = await this.executeTakeFirst()

    if (result === undefined) {
      throw new errorConstructor(this.toOperationNode())
    }

    return result as O
  }
}

preventAwait(
  ReplaceQueryBuilder,
  "don't await ReplaceQueryBuilder instances directly. To execute the query you need to call `execute` or `executeTakeFirst`."
)

export interface ReplaceQueryBuilderProps {
  readonly queryId: QueryId
  readonly queryNode: InsertQueryNode
  readonly executor: QueryExecutor
}
