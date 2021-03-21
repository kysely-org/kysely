import { ConnectionProvider } from '../driver/connection-provider'
import {
  ColumnDataTypeNode,
  createColumnDefinitionNode,
} from '../operation-node/column-definition-node'
import {
  cloneCreateTableNodeWithColumn,
  CreateTableNode,
} from '../operation-node/create-table-node'
import { createDataTypeNode } from '../operation-node/data-type-node'
import { OperationNodeSource } from '../operation-node/operation-node-source'
import { CompiledQuery } from '../query-compiler/compiled-query'
import { QueryCompiler } from '../query-compiler/query-compiler'
import { isFunction, isNumber, isString } from '../utils/object-utils'
import { ColumnBuilder } from './column-builder'

export class CreateTableBuilder implements OperationNodeSource {
  readonly #createTableNode: CreateTableNode
  readonly #compiler?: QueryCompiler
  readonly #connectionProvider?: ConnectionProvider

  constructor({
    createTableNode,
    compiler,
    connectionProvider,
  }: CreateTableBuilderArgs) {
    this.#createTableNode = createTableNode
    this.#compiler = compiler
    this.#connectionProvider = connectionProvider
  }

  /**
   * Adds a string column to the table.
   *
   * This creates a `varchar(255)` data type on most dialects.
   */
  string(columnName: string, build?: ColumnBuilderCallback): CreateTableBuilder

  /**
   * Adds a string column to the table.
   *
   * This creates a `varchar(maxLength)` data type on most dialects.
   */
  string(
    columnName: string,
    maxLength: number,
    build?: ColumnBuilderCallback
  ): CreateTableBuilder

  string(...args: any[]): any {
    return this.addColumn(
      args[0],
      createDataTypeNode('String', isNumber(args[1]) ? args[1] : undefined),
      isFunction(args[1]) ? args[1] : args[2]
    )
  }

  /**
   * Adds a text column to the table.
   *
   * Unlike {@link CreateTableBuilder.string} this creates a string column
   * that doesn't have a maximum length.
   */
  text(columnName: string, build?: ColumnBuilderCallback): CreateTableBuilder {
    return this.addColumn(columnName, createDataTypeNode('Text'), build)
  }

  /**
   * Adds an integer column.
   */
  integer(
    columnName: string,
    build?: ColumnBuilderCallback
  ): CreateTableBuilder {
    return this.addColumn(columnName, createDataTypeNode('Integer'), build)
  }

  /**
   * Adds a big integer column.
   *
   * Creates a `bigint` column on dialects that support it and defaults
   * to a normal integer on others.
   */
  bigInteger(
    columnName: string,
    build?: ColumnBuilderCallback
  ): CreateTableBuilder {
    return this.addColumn(columnName, createDataTypeNode('BigInteger'), build)
  }

  /**
   * Adds a double precision floating poin number column.
   */
  double(
    columnName: string,
    build?: ColumnBuilderCallback
  ): CreateTableBuilder {
    return this.addColumn(columnName, createDataTypeNode('Double'), build)
  }

  toOperationNode(): CreateTableNode {
    return this.#createTableNode
  }

  compile(): CompiledQuery {
    if (!this.#compiler) {
      throw new Error(`this builder cannot be compiled to SQL`)
    }

    return this.#compiler.compile(this.#createTableNode)
  }

  async execute(): Promise<void> {
    if (!this.#connectionProvider) {
      throw new Error(`this builder cannot be executed`)
    }

    await this.#connectionProvider.withConnection(async (connection) => {
      await connection.execute(this.compile())
    })
  }

  private addColumn(
    columnName: string,
    dataType: ColumnDataTypeNode,
    build?: ColumnBuilderCallback
  ): CreateTableBuilder {
    let columnBuilder = new ColumnBuilder(
      createColumnDefinitionNode(columnName, dataType)
    )

    if (build) {
      columnBuilder = build(columnBuilder)
    }

    return new CreateTableBuilder({
      compiler: this.#compiler,
      connectionProvider: this.#connectionProvider,
      createTableNode: cloneCreateTableNodeWithColumn(
        this.#createTableNode,
        columnBuilder.toOperationNode()
      ),
    })
  }
}

export interface CreateTableBuilderArgs {
  createTableNode: CreateTableNode
  compiler?: QueryCompiler
  connectionProvider?: ConnectionProvider
}

export type ColumnBuilderCallback = (
  tableBuilder: ColumnBuilder
) => ColumnBuilder
