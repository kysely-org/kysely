import { AlterTypeNode } from '../operation-node/alter-type-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import type { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { ValueNode } from '../operation-node/value-node.js'
import type { CompiledQuery } from '../query-compiler/compiled-query.js'
import type { Compilable } from '../util/compilable.js'
import type { QueryExecutor } from '../query-executor/query-executor.js'
import type { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'

export class AlterTypeBuilder implements OperationNodeSource, Compilable {
  readonly #props: AlterTypeBuilderProps

  constructor(props: AlterTypeBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Adds a new value to an enum type.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema.alterType('species').addValue('cat').execute()
   * ```
   */
  addValue(value: string): AlterTypeBuilder {
    return new AlterTypeBuilder({
      ...this.#props,
      node: AlterTypeNode.cloneWith(this.#props.node, {
        addValue: ValueNode.createImmediate(value),
      }),
    })
  }

  /**
   * Renames the type.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema.alterType('species').renameTo('animal_type').execute()
   * ```
   */
  renameTo(newName: string): AlterTypeBuilder {
    return new AlterTypeBuilder({
      ...this.#props,
      node: AlterTypeNode.cloneWith(this.#props.node, {
        renameTo: IdentifierNode.create(newName),
      }),
    })
  }

  /**
   * Renames a value within an enum type.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema.alterType('species').renameValue('cat', 'kitten').execute()
   * ```
   */
  renameValue(oldValue: string, newValue: string): AlterTypeBuilder {
    return new AlterTypeBuilder({
      ...this.#props,
      node: AlterTypeNode.cloneWith(this.#props.node, {
        renameValue: freeze({
          oldName: ValueNode.createImmediate(oldValue),
          newName: ValueNode.createImmediate(newValue),
        }),
      }),
    })
  }

  /**
   * Moves the type to a different schema.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema.alterType('species').setSchema('other_schema').execute()
   * ```
   */
  setSchema(schema: string): AlterTypeBuilder {
    return new AlterTypeBuilder({
      ...this.#props,
      node: AlterTypeNode.cloneWith(this.#props.node, {
        setSchema: IdentifierNode.create(schema),
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

  toOperationNode(): AlterTypeNode {
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

export interface AlterTypeBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: AlterTypeNode
}
