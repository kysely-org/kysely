import { AddConstraintNode } from '../operation-node/add-constraint-node.js'
import { AlterTableNode } from '../operation-node/alter-table-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { OnModifyForeignAction } from '../operation-node/references-node.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { Compilable } from '../util/compilable.js'
import { freeze } from '../util/object-utils.js'
import { preventAwait } from '../util/prevent-await.js'
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
    onDelete: OnModifyForeignAction
  ): AlterTableAddForeignKeyConstraintBuilder {
    return new AlterTableAddForeignKeyConstraintBuilder({
      ...this.#props,
      constraintBuilder: this.#props.constraintBuilder.onDelete(onDelete),
    })
  }

  onUpdate(
    onUpdate: OnModifyForeignAction
  ): AlterTableAddForeignKeyConstraintBuilder {
    return new AlterTableAddForeignKeyConstraintBuilder({
      ...this.#props,
      constraintBuilder: this.#props.constraintBuilder.onUpdate(onUpdate),
    })
  }

  toOperationNode(): AlterTableNode {
    return this.#props.executor.transformQuery(
      AlterTableNode.cloneWithTableProps(this.#props.node, {
        addConstraint: AddConstraintNode.create(
          this.#props.constraintBuilder.toOperationNode()
        ),
      }),
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

export interface AlterTableAddForeignKeyConstraintBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: AlterTableNode
  readonly constraintBuilder: ForeignKeyConstraintBuilder
}

preventAwait(
  AlterTableAddForeignKeyConstraintBuilder,
  "don't await AlterTableAddForeignKeyConstraintBuilder instances directly. To execute the query you need to call `execute`"
)
