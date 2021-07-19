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
import { createRawNodeWithSql } from '../operation-node/raw-node'
import { CompiledQuery } from '../query-compiler/compiled-query'
import { QueryCompiler } from '../query-compiler/query-compiler'
import { Compilable } from '../util/compilable'
import { isFunction, isNumber } from '../util/object-utils'
import { preventAwait } from '../util/prevent-await'
import { ColumnBuilder } from './column-builder'

export class CreateTableBuilder implements OperationNodeSource, Compilable {
  readonly #createTableNode: CreateTableNode
  readonly #compiler?: QueryCompiler
  readonly #connectionProvider?: ConnectionProvider

  constructor({
    createTableNode,
    compiler,
    connectionProvider,
  }: CreateTableBuilderConstructorArgs) {
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
      createDataTypeNode('String', {
        size: isNumber(args[1]) ? args[1] : undefined,
      }),
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
   * Adds a single precision floating point number column.
   */
  float(columnName: string, build?: ColumnBuilderCallback): CreateTableBuilder {
    return this.addColumn(columnName, createDataTypeNode('Float'), build)
  }

  /**
   * Adds a double precision floating point number column.
   */
  double(
    columnName: string,
    build?: ColumnBuilderCallback
  ): CreateTableBuilder {
    return this.addColumn(columnName, createDataTypeNode('Double'), build)
  }

  /**
   * Adds a numeric column with precision and scale.
   */
  numeric(
    columnName: string,
    precision: number,
    scale: number,
    build?: ColumnBuilderCallback
  ): CreateTableBuilder {
    return this.addColumn(
      columnName,
      createDataTypeNode('Numeric', { precision, scale }),
      build
    )
  }

  /**
   * Adds a decimal column with precision and scale.
   */
  decimal(
    columnName: string,
    precision: number,
    scale: number,
    build?: ColumnBuilderCallback
  ): CreateTableBuilder {
    return this.addColumn(
      columnName,
      createDataTypeNode('Decimal', { precision, scale }),
      build
    )
  }

  /**
   * Adds a boolean column.
   */
  boolean(
    columnName: string,
    build?: ColumnBuilderCallback
  ): CreateTableBuilder {
    return this.addColumn(columnName, createDataTypeNode('Boolean'), build)
  }

  /**
   * Adds a column with a specific data type.
   *
   * @example
   * ```ts
   * specificType('some_column', 'char(255)')
   * ```
   */
  specificType(
    columnName: string,
    dataType: string,
    build?: ColumnBuilderCallback
  ): CreateTableBuilder {
    return this.addColumn(columnName, createRawNodeWithSql(dataType), build)
  }

  toOperationNode(): CreateTableNode {
    return this.#createTableNode
  }

  compile(): CompiledQuery {
    if (!this.#compiler) {
      throw new Error(`this builder cannot be compiled to SQL`)
    }

    return this.#compiler.compileQuery(this.#createTableNode)
  }

  async execute(): Promise<void> {
    if (!this.#connectionProvider) {
      throw new Error(`this builder cannot be executed`)
    }

    await this.#connectionProvider.withConnection(async (connection) => {
      await connection.executeQuery(this.compile())
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

preventAwait(
  CreateTableBuilder,
  "don't await CreateTableBuilder instances directly. To execute the query you need to call `execute`"
)

export interface CreateTableBuilderConstructorArgs {
  createTableNode: CreateTableNode
  compiler?: QueryCompiler
  connectionProvider?: ConnectionProvider
}

export type ColumnBuilderCallback = (
  tableBuilder: ColumnBuilder
) => ColumnBuilder
