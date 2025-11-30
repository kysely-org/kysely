import { CreateSchemaNode } from '../operation-node/create-schema-node.js'
import type { OperationNodeSource } from '../operation-node/operation-node-source.js'
import type { CompiledQuery } from '../query-compiler/compiled-query.js'
import type { Compilable } from '../util/compilable.js'
import type { QueryExecutor } from '../query-executor/query-executor.js'
import type { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'

export class CreateSchemaBuilder implements OperationNodeSource, Compilable {
  readonly #props: CreateSchemaBuilderProps

  constructor(props: CreateSchemaBuilderProps) {
    this.#props = freeze(props)
  }

  ifNotExists(): CreateSchemaBuilder {
    return new CreateSchemaBuilder({
      ...this.#props,
      node: CreateSchemaNode.cloneWith(this.#props.node, { ifNotExists: true }),
    })
  }

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  toOperationNode(): CreateSchemaNode {
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

export interface CreateSchemaBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: CreateSchemaNode
}
