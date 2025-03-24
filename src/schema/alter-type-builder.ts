import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { AlterTypeNode } from '../operation-node/alter-type-node.js'
import { AlterTypeExecutor } from './alter-type-executor.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import {
  AlterTypeAddValueBuilder,
  AlterTypeAddValueCallback,
} from './alter-type-add-value-builder.js'
import { AddValueNode } from '../operation-node/add-value-node.js'
import { ValueNode } from '../operation-node/value-node.js'
export class AlterTypeBuilder implements OperationNodeSource, Compilable {
  readonly #props: AlterTypeBuilderProps

  constructor(props: AlterTypeBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Changes the owner of the type.
   *
   * ### Examples
   *
   * ```ts
   * db.schema.alterType('species').ownerTo('user').execute()
   * ```
   */
  ownerTo(newOwner: string): AlterTypeExecutor {
    return new AlterTypeExecutor({
      ...this.#props,
      node: AlterTypeNode.cloneWithAlterTypeProps(this.#props.node, {
        ownerTo: IdentifierNode.create(newOwner),
      }),
    })
  }
  /**
   * Changes the name of the type.
   *
   * ### Examples
   *
   * ```ts
   * db.schema.alterType('species').renameTo('genus').execute()
   * ```
   */
  renameTo(newTypeName: string): AlterTypeExecutor {
    return new AlterTypeExecutor({
      ...this.#props,
      node: AlterTypeNode.cloneWithAlterTypeProps(this.#props.node, {
        renameTo: IdentifierNode.create(newTypeName),
      }),
    })
  }
  /**
   * Moves the type to target schema.
   *
   * ### Examples
   *
   * ```ts
   * db.schema.alterType('species').setSchema('public').execute()
   * ```
   */
  setSchema(newSchema: string): AlterTypeExecutor {
    return new AlterTypeExecutor({
      ...this.#props,
      node: AlterTypeNode.cloneWithAlterTypeProps(this.#props.node, {
        setSchema: IdentifierNode.create(newSchema),
      }),
    })
  }

  /**
   * Adds a new value to an enum type.
   *
   * ### Examples
   *
   * ```ts
   * db.schema.alterType('species').addValue('cat', (qb) => qb.after('dog')).execute()
   * ```
   */
  addValue(value: string, addValueOptions?: AlterTypeAddValueCallback) {
    const addValueNode = AddValueNode.create(ValueNode.createImmediate(value))
    const addValueBuilder = new AlterTypeAddValueBuilder(addValueNode)
    const builder = addValueOptions
      ? addValueOptions(addValueBuilder)
      : addValueBuilder
    return new AlterTypeExecutor({
      ...this.#props,
      node: AlterTypeNode.cloneWithAlterTypeProps(this.#props.node, {
        addValue: AddValueNode.cloneWithAddValueProps(
          addValueNode,
          builder.toOperationNode(),
        ),
      }),
    })
  }
  /**
   * Renames a value of an enum type.
   *
   * ### Examples
   *
   * ```ts
   * db.schema.alterType('species').renameValue('cat', 'dog').execute()
   * ```
   */
  renameValue(oldValue: string, newValue: string) {
    return new AlterTypeExecutor({
      ...this.#props,
      node: AlterTypeNode.cloneWithAlterTypeProps(this.#props.node, {
        renameValueOldName: ValueNode.createImmediate(oldValue),
        renameValueNewName: ValueNode.createImmediate(newValue),
      }),
    })
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
}

export interface AlterTypeBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: AlterTypeNode
}
