import { RawBuilder } from '..'
import { addColumnNode } from '../operation-node/add-column-node'
import {
  alterColumnNode,
  AlterColumnNode,
} from '../operation-node/alter-column-node'
import {
  alterTableNode,
  AlterTableNode,
} from '../operation-node/alter-table-node'
import {
  CreateTableNode,
  createTableNode,
} from '../operation-node/create-table-node'
import { ColumnDataType, dataTypeNode } from '../operation-node/data-type-node'
import {
  isOperationNodeSource,
  OperationNodeSource,
} from '../operation-node/operation-node-source'
import { CompiledQuery } from '../query-compiler/compiled-query'
import { Compilable } from '../util/compilable'
import { preventAwait } from '../util/prevent-await'
import { QueryExecutor } from '../util/query-executor'

export class AlterTableBuilder {
  readonly #alterTableNode: AlterTableNode
  readonly #executor: QueryExecutor

  constructor({ alterTableNode, executor }: AlterTableBuilderConstructorArgs) {
    this.#alterTableNode = alterTableNode
    this.#executor = executor
  }

  alterColumn(column: string): AlterColumnBuilder {
    return new AlterColumnBuilder({
      alterTableNode: this.#alterTableNode,
      alterColumnNode: alterColumnNode.create(column),
      executor: this.#executor,
    })
  }
}

export class AlterColumnBuilder {
  readonly #alterTableNode: AlterTableNode
  readonly #alterColumnNode: AlterColumnNode
  readonly #executor: QueryExecutor

  constructor({
    alterTableNode,
    alterColumnNode,
    executor,
  }: AlterColumnBuilderConstructorArgs) {
    this.#alterTableNode = alterTableNode
    this.#alterColumnNode = alterColumnNode
    this.#executor = executor
  }

  setDataType(dataType: ColumnDataType): AlterTableExecutor {
    return new AlterTableExecutor({
      executor: this.#executor,
      alterTableNode: alterTableNode.cloneWith(this.#alterTableNode, {
        alterColumn: alterColumnNode.cloneWith(this.#alterColumnNode, {
          dataType: dataTypeNode.create(dataType),
        }),
      }),
    })
  }
}

export class AlterTableExecutor implements OperationNodeSource, Compilable {
  readonly #alterTableNode: AlterTableNode
  readonly #executor: QueryExecutor

  constructor({ alterTableNode, executor }: AlterTableExecutorConstructorArgs) {
    this.#alterTableNode = alterTableNode
    this.#executor = executor
  }

  toOperationNode(): AlterTableNode {
    return this.#executor.transformNode(this.#alterTableNode)
  }

  compile(): CompiledQuery {
    return this.#executor.compileQuery(this.toOperationNode())
  }

  async execute(): Promise<void> {
    await this.#executor.executeQuery(this.compile())
  }
}

preventAwait(AlterTableBuilder, "don't await AlterTableBuilder instances")
preventAwait(AlterColumnBuilder, "don't await AlterColumnBuilder instances")
preventAwait(
  AlterTableExecutor,
  "don't await AlterTableExecutor instances directly. To execute the query you need to call `execute`"
)

export interface AlterTableBuilderConstructorArgs {
  alterTableNode: AlterTableNode
  executor: QueryExecutor
}

export interface AlterColumnBuilderConstructorArgs
  extends AlterTableBuilderConstructorArgs {
  alterColumnNode: AlterColumnNode
}

export interface AlterTableExecutorConstructorArgs
  extends AlterTableBuilderConstructorArgs {}
