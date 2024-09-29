import { AlterTableNode } from '../operation-node/alter-table-node.js'
import { DropConstraintNode } from '../operation-node/drop-constraint-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { Compilable } from '../util/compilable.js'
import { freeze } from '../util/object-utils.js'
import { QueryId } from '../util/query-id.js'

export class AlterTableDropConstraintBuilder
  implements OperationNodeSource, Compilable
{
  readonly #props: AlterTableDropConstraintBuilderProps

  constructor(props: AlterTableDropConstraintBuilderProps) {
    this.#props = freeze(props)
  }

  ifExists(): AlterTableDropConstraintBuilder {
    return new AlterTableDropConstraintBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithTableProps(this.#props.node, {
        dropConstraint: DropConstraintNode.cloneWith(
          this.#props.node.dropConstraint!,
          {
            ifExists: true,
          },
        ),
      }),
    })
  }

  cascade(): AlterTableDropConstraintBuilder {
    return new AlterTableDropConstraintBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithTableProps(this.#props.node, {
        dropConstraint: DropConstraintNode.cloneWith(
          this.#props.node.dropConstraint!,
          {
            modifier: 'cascade',
          },
        ),
      }),
    })
  }

  restrict(): AlterTableDropConstraintBuilder {
    return new AlterTableDropConstraintBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithTableProps(this.#props.node, {
        dropConstraint: DropConstraintNode.cloneWith(
          this.#props.node.dropConstraint!,
          {
            modifier: 'restrict',
          },
        ),
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

  toOperationNode(): AlterTableNode {
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

export interface AlterTableDropConstraintBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: AlterTableNode
}
