import { DropSchemaNode } from '../operation-node/drop-schema-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { AbortableOperationOptions } from '../util/abort.js'

export class DropSchemaBuilder implements OperationNodeSource, Compilable {
  readonly #props: DropSchemaBuilderProps

  constructor(props: DropSchemaBuilderProps) {
    this.#props = freeze(props)
  }

  ifExists(): DropSchemaBuilder {
    return new DropSchemaBuilder({
      ...this.#props,
      node: DropSchemaNode.cloneWith(this.#props.node, {
        ifExists: true,
      }),
    })
  }

  cascade(): DropSchemaBuilder {
    return new DropSchemaBuilder({
      ...this.#props,
      node: DropSchemaNode.cloneWith(this.#props.node, {
        cascade: true,
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

  toOperationNode(): DropSchemaNode {
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

  async execute(options?: AbortableOperationOptions): Promise<void> {
    await this.#props.executor.executeQuery(this.compile(), options)
  }
}

export interface DropSchemaBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: DropSchemaNode
}
