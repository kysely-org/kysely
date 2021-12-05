import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { CreateViewNode } from '../operation-node/create-view-node.js'
import { parseColumnName } from '../parser/reference-parser.js'
import { AnyQueryBuilder, QueryNode } from '../index.js'
import { AnyRawBuilder } from '../util/type-utils.js'
import { ImmediateValuePlugin } from '../plugin/immediate-value.ts/immediate-value-plugin.js'

export class CreateViewBuilder implements OperationNodeSource, Compilable {
  readonly #props: CreateViewBuilderProps

  constructor(props: CreateViewBuilderProps) {
    this.#props = freeze({
      ...props,
      // The select statement (defined using the `as` method) can't have parameters on some
      // dialects. We add the `ImmediateValuePlugin` to make all parameters "immediate"
      // meaning they are interpolated into the SQL instead of added as parameters.
      //
      // The values are therefore not escaped at all, which leads to SQL injection
      // vulnerabilities if user input is passed into the query. However, the use
      // case where user input is passed into a `create view` statement is a weird
      // one, and we can pretty safely just ignore it.
      executor: props.executor.withPlugin(new ImmediateValuePlugin()),
    })
  }

  materialized(): CreateViewBuilder {
    return new CreateViewBuilder({
      ...this.#props,
      createViewNode: CreateViewNode.cloneWith(this.#props.createViewNode, {
        materialized: true,
      }),
    })
  }

  orReplace(): CreateViewBuilder {
    return new CreateViewBuilder({
      ...this.#props,
      createViewNode: CreateViewNode.cloneWith(this.#props.createViewNode, {
        orReplace: true,
      }),
    })
  }

  columns(columns: string[]): CreateViewBuilder {
    return new CreateViewBuilder({
      ...this.#props,
      createViewNode: CreateViewNode.cloneWith(this.#props.createViewNode, {
        columns: columns.map(parseColumnName),
      }),
    })
  }

  as(query: AnyQueryBuilder | AnyRawBuilder): CreateViewBuilder {
    const queryNode = query.toOperationNode()

    if (QueryNode.isMutating(queryNode)) {
      throw new Error('only select statements are allowd in views')
    }

    return new CreateViewBuilder({
      ...this.#props,
      createViewNode: CreateViewNode.cloneWith(this.#props.createViewNode, {
        as: queryNode,
      }),
    })
  }

  toOperationNode(): CreateViewNode {
    return this.#props.executor.transformQuery(
      this.#props.createViewNode,
      this.#props.queryId
    )
  }

  compile(): CompiledQuery {
    return this.#props.executor.compileQuery(
      this.toOperationNode(),
      this.#props.queryId
    )
  }

  async execute(): Promise<void> {
    await this.#props.executor.executeQuery(this.compile(), this.#props.queryId)
  }
}

preventAwait(
  CreateViewBuilder,
  "don't await CreateViewBuilder instances directly. To execute the query you need to call `execute`"
)

export interface CreateViewBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly createViewNode: CreateViewNode
}
