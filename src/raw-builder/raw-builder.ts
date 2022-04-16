import { QueryResult } from '../driver/database-connection.js'
import { AliasNode } from '../operation-node/alias-node.js'
import {
  isOperationNodeSource,
  OperationNodeSource,
} from '../operation-node/operation-node-source.js'
import { RawNode } from '../operation-node/raw-node.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { freeze } from '../util/object-utils.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { NOOP_QUERY_EXECUTOR } from '../query-executor/noop-query-executor.js'
import { QueryExecutorProvider } from '../query-executor/query-executor-provider.js'
import { QueryId } from '../util/query-id.js'
import { AnyRawBuilder } from '../util/type-utils.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'

/**
 * An instance of this class can be used to create raw SQL snippets or queries.
 *
 * You shouldn't need to create `RawBuilder` instances directly. Instead you should
 * use the {@link sql} template tag.
 */
export class RawBuilder<O = unknown, B = false> implements OperationNodeSource {
  readonly #props: RawBuilderProps
  readonly #executor: B extends true ? QueryExecutor : undefined;

  constructor(
    props: RawBuilderProps,
    executor?: (B extends true ? QueryExecutor : undefined)
  ) {
    this.#props = freeze(props)
    this.#executor = executor as (B extends true ? QueryExecutor : undefined)
  }

  /**
   * Returns an aliased version of the SQL expression.
   *
   * In addition to slapping `as "the_alias"` to the end of the SQL,
   * this method also provides strict typing:
   *
   * ```ts
   * const result = await db
   *   .selectFrom('person')
   *   .select(
   *     sql<string>`concat(first_name, ' ', last_name)`.as('full_name')
   *   )
   *   .executeTakeFirstOrThrow()
   *
   * // `full_name: string` field exists in the result type.
   * console.log(result.full_name)
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```ts
   * select concat(first_name, ' ', last_name) as "full_name"
   * from "person"
   * ```
   *
   * You can also pass in a raw SQL snippet but in that case you must
   * provide the alias as the only type argument:
   *
   * ```ts
   * const values = sql<{ a: number, b: string }>`(values (1, 'foo'))`
   *
   * // The alias is `t(a, b)` which specifies the column names
   * // in addition to the table name. We must tell kysely that
   * // columns of the table can be referenced through `t`
   * // by providing an explicit type argument.
   * const aliasedValues = values.as<'t'>(sql`t(a, b)`)
   *
   * await db
   *   .insertInto('person')
   *   .columns(['first_name', 'last_name'])
   *   .expression(
   *     db.selectFrom(aliasedValues).select(['t.a', 't.b'])
   *   )
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```ts
   * insert into "person" ("first_name", "last_name")
   * from (values (1, 'foo')) as t(a, b)
   * select "t"."a", "t"."b"
   * ```
   */
  as<A extends string>(alias: A): AliasedRawBuilder<O, A, B>
  as<A extends string = never>(alias: AnyRawBuilder): AliasedRawBuilder<O, A, B>
  as(alias: string | AnyRawBuilder): AliasedRawBuilder<O, string, B> {
    return new AliasedRawBuilder(this, alias)
  }

  /**
   * Change the output type of the raw expression.
   *
   * This method call doesn't change the SQL in any way. This methods simply
   * returns a copy of this `RawBuilder` with a new output type.
   */
  castTo<T>(): RawBuilder<T, B> {
    return new RawBuilder({ ...this.#props }, this.#executor)
  }

  /**
   * Adds a plugin for this SQL snippet.
   */
  withPlugin(plugin: KyselyPlugin): RawBuilder<O, B> {
    return new RawBuilder({
      ...this.#props,
      plugins:
        this.#props.plugins !== undefined
          ? freeze([...this.#props.plugins, plugin])
          : freeze([plugin]),
    }, this.#executor)
  }

  toOperationNode(): RawNode {
    const executor =
      this.#props.plugins !== undefined
        ? NOOP_QUERY_EXECUTOR.withPlugins(this.#props.plugins)
        : NOOP_QUERY_EXECUTOR

    return this.#toOperationNode(executor)
  }

  async execute(
    ...executorProvider: B extends true ? [undefined?] : [QueryExecutorProvider]
  ): Promise<QueryResult<O>> {
    let executor = (executorProvider[0]?.getExecutor()) ?? this.#executor;

    if (executor === undefined) {
      throw new Error('Unreachable code')
    }

    if (this.#props.plugins !== undefined) {
      executor = executor.withPlugins(this.#props.plugins)
    }

    return executor.executeQuery<O>(
      this.#compile(executor),
      this.#props.queryId
    )
  }

  #toOperationNode(executor: QueryExecutor): RawNode {
    return executor.transformQuery(this.#props.rawNode, this.#props.queryId)
  }

  #compile(executor: QueryExecutor): CompiledQuery {
    return executor.compileQuery(
      this.#toOperationNode(executor),
      this.#props.queryId
    )
  }
}

preventAwait(
  RawBuilder,
  "don't await RawBuilder instances directly. To execute the query you need to call `execute`"
)

/**
 * {@link RawBuilder} with an alias. The result of calling {@link RawBuilder.as}.
 */
export class AliasedRawBuilder<O = unknown, A extends string = never, B = false>
  implements OperationNodeSource {
  readonly #rawBuilder: RawBuilder<O, B>
  readonly #alias: A | AnyRawBuilder

  /**
   * @private
   *
   * This needs to be here just so that the typings work. Without this
   * the generated .d.ts file contains no reference to the type param A
   * which causes this type to be equal to AliasedRawBuilder with any A
   * as long as O is the same.
   */
  protected get alias(): A | AnyRawBuilder {
    return this.#alias
  }

  toOperationNode(): AliasNode {
    return AliasNode.create(
      this.#rawBuilder.toOperationNode(),
      isOperationNodeSource(this.#alias)
        ? this.#alias.toOperationNode()
        : IdentifierNode.create(this.#alias)
    )
  }

  constructor(rawBuilder: RawBuilder<O, B>, alias: A | AnyRawBuilder) {
    this.#rawBuilder = rawBuilder
    this.#alias = alias
  }
}

export interface RawBuilderProps {
  readonly queryId: QueryId
  readonly rawNode: RawNode
  readonly plugins?: ReadonlyArray<KyselyPlugin>
}
