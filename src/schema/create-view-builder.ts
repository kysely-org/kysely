import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { CreateViewNode } from '../operation-node/create-view-node.js'
import { parseColumnName } from '../parser/reference-parser.js'
import { ImmediateValuePlugin } from '../plugin/immediate-value/immediate-value-plugin.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'
import { SelectQueryBuilder } from '../query-builder/select-query-builder.js'

export class CreateViewBuilder implements OperationNodeSource, Compilable {
  readonly #props: CreateViewBuilderProps

  constructor(props: CreateViewBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Adds the "temporary" modifier.
   *
   * Use this to create a temporary view.
   */
  temporary(): CreateViewBuilder {
    return new CreateViewBuilder({
      ...this.#props,
      node: CreateViewNode.cloneWith(this.#props.node, {
        temporary: true,
      }),
    })
  }

  materialized(): CreateViewBuilder {
    return new CreateViewBuilder({
      ...this.#props,
      node: CreateViewNode.cloneWith(this.#props.node, {
        materialized: true,
      }),
    })
  }

  /**
   * Only implemented on some dialects like SQLite. On most dialects, use {@link orReplace}.
   */
  ifNotExists(): CreateViewBuilder {
    return new CreateViewBuilder({
      ...this.#props,
      node: CreateViewNode.cloneWith(this.#props.node, {
        ifNotExists: true,
      }),
    })
  }

  orReplace(): CreateViewBuilder {
    return new CreateViewBuilder({
      ...this.#props,
      node: CreateViewNode.cloneWith(this.#props.node, {
        orReplace: true,
      }),
    })
  }

  columns(columns: string[]): CreateViewBuilder {
    return new CreateViewBuilder({
      ...this.#props,
      node: CreateViewNode.cloneWith(this.#props.node, {
        columns: columns.map(parseColumnName),
      }),
    })
  }

  /**
   * Sets the select query or a `values` statement that creates the view.
   *
   * WARNING!
   * Some dialects don't support parameterized queries in DDL statements and therefore
   * the query or raw {@link sql } expression passed here is interpolated into a single
   * string opening an SQL injection vulnerability. DO NOT pass unchecked user input
   * into the query or raw expression passed to this method!
   */
  as(
    query: SelectQueryBuilder<any, any, any> | RawBuilder<any>,
  ): CreateViewBuilder {
    const queryNode = query
      .withPlugin(new ImmediateValuePlugin())
      .toOperationNode()

    return new CreateViewBuilder({
      ...this.#props,
      node: CreateViewNode.cloneWith(this.#props.node, {
        as: queryNode,
      }),
    })
  }

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  toOperationNode(): CreateViewNode {
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
    await this.#props.executor.executeQuery(this.compile(), this.#props.queryId)
  }
}

export interface CreateViewBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: CreateViewNode
}
