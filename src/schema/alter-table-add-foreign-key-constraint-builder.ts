import { AddConstraintNode } from '../operation-node/add-constraint-node.js'
import { AlterTableNode } from '../operation-node/alter-table-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { OnModifyForeignAction } from '../operation-node/references-node.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import {
  ExecuteQueryOptions,
  QueryExecutor,
} from '../query-executor/query-executor.js'
import { Compilable } from '../util/compilable.js'
import { freeze } from '../util/object-utils.js'
import { QueryId } from '../util/query-id.js'
import {
  ForeignKeyConstraintBuilder,
  ForeignKeyConstraintBuilderInterface,
} from './foreign-key-constraint-builder.js'

export class AlterTableAddForeignKeyConstraintBuilder
  implements
    ForeignKeyConstraintBuilderInterface<AlterTableAddForeignKeyConstraintBuilder>,
    OperationNodeSource,
    Compilable
{
  readonly #props: AlterTableAddForeignKeyConstraintBuilderProps

  constructor(props: AlterTableAddForeignKeyConstraintBuilderProps) {
    this.#props = freeze(props)
  }

  onDelete(
    onDelete: OnModifyForeignAction,
  ): AlterTableAddForeignKeyConstraintBuilder {
    return new AlterTableAddForeignKeyConstraintBuilder({
      ...this.#props,
      constraintBuilder: this.#props.constraintBuilder.onDelete(onDelete),
    })
  }

  onUpdate(
    onUpdate: OnModifyForeignAction,
  ): AlterTableAddForeignKeyConstraintBuilder {
    return new AlterTableAddForeignKeyConstraintBuilder({
      ...this.#props,
      constraintBuilder: this.#props.constraintBuilder.onUpdate(onUpdate),
    })
  }

  deferrable(): AlterTableAddForeignKeyConstraintBuilder {
    return new AlterTableAddForeignKeyConstraintBuilder({
      ...this.#props,
      constraintBuilder: this.#props.constraintBuilder.deferrable(),
    })
  }

  notDeferrable(): AlterTableAddForeignKeyConstraintBuilder {
    return new AlterTableAddForeignKeyConstraintBuilder({
      ...this.#props,
      constraintBuilder: this.#props.constraintBuilder.notDeferrable(),
    })
  }

  initiallyDeferred(): AlterTableAddForeignKeyConstraintBuilder {
    return new AlterTableAddForeignKeyConstraintBuilder({
      ...this.#props,
      constraintBuilder: this.#props.constraintBuilder.initiallyDeferred(),
    })
  }

  initiallyImmediate(): AlterTableAddForeignKeyConstraintBuilder {
    return new AlterTableAddForeignKeyConstraintBuilder({
      ...this.#props,
      constraintBuilder: this.#props.constraintBuilder.initiallyImmediate(),
    })
  }

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  toOperationNode(): AlterTableNode {
    return this.#props.executor.transformQuery(
      AlterTableNode.cloneWithTableProps(this.#props.node, {
        addConstraint: AddConstraintNode.create(
          this.#props.constraintBuilder.toOperationNode(),
        ),
      }),
      this.#props.queryId,
    )
  }

  compile(): CompiledQuery {
    return this.#props.executor.compileQuery(
      this.toOperationNode(),
      this.#props.queryId,
    )
  }

  async execute(options?: ExecuteQueryOptions): Promise<void> {
    await this.#props.executor.executeQuery(this.compile(), options)
  }
}

export interface AlterTableAddForeignKeyConstraintBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: AlterTableNode
  readonly constraintBuilder: ForeignKeyConstraintBuilder
}
