import {
  ColumnDataTypeNode,
  columnDefinitionNode,
} from '../operation-node/column-definition-node'
import {
  CreateTableNode,
  createTableNode,
} from '../operation-node/create-table-node'
import { dataTypeNode } from '../operation-node/data-type-node'
import { OperationNodeSource } from '../operation-node/operation-node-source'
import { rawNode } from '../operation-node/raw-node'
import { CompiledQuery } from '../query-compiler/compiled-query'
import { Compilable } from '../util/compilable'
import { isFunction, isNumber } from '../util/object-utils'
import { preventAwait } from '../util/prevent-await'
import { QueryExecutor } from '../util/query-executor'
import { ColumnBuilder } from './column-builder'

export class CreateTableBuilder implements OperationNodeSource, Compilable {
  readonly #createTableNode: CreateTableNode
  readonly #executor: QueryExecutor

  constructor({
    createTableNode,
    executor,
  }: CreateTableBuilderConstructorArgs) {
    this.#createTableNode = createTableNode
    this.#executor = executor
  }

  /**
   * Adds the "if not exists" modifier.
   *
   * If the table already exists, no error is thrown if this method has been called.
   */
  ifNotExists(): CreateTableBuilder {
    return new CreateTableBuilder({
      executor: this.#executor,
      createTableNode: createTableNode.cloneWithModifier(
        this.#createTableNode,
        'IfNotExists'
      ),
    })
  }

  /**
   * Adds a varchar(255) column to the table.
   */
  varchar(columnName: string, build?: ColumnBuilderCallback): CreateTableBuilder

  /**
   * Adds a varchar(maxLength) column to the table.
   */
  varchar(
    columnName: string,
    maxLength: number,
    build?: ColumnBuilderCallback
  ): CreateTableBuilder

  varchar(...args: any[]): any {
    return this.addColumn(
      args[0],
      dataTypeNode.create('VarChar', {
        size: isNumber(args[1]) ? args[1] : undefined,
      }),
      isFunction(args[1]) ? args[1] : args[2]
    )
  }

  /**
   * Adds a text column to the table.
   *
   * Unlike {@link CreateTableBuilder.varchar} this creates a string column
   * that doesn't have a maximum length.
   */
  text(columnName: string, build?: ColumnBuilderCallback): CreateTableBuilder {
    return this.addColumn(columnName, dataTypeNode.create('Text'), build)
  }

  /**
   * Adds an integer column.
   */
  integer(
    columnName: string,
    build?: ColumnBuilderCallback
  ): CreateTableBuilder {
    return this.addColumn(columnName, dataTypeNode.create('Integer'), build)
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
    return this.addColumn(columnName, dataTypeNode.create('BigInteger'), build)
  }

  /**
   * Adds a single precision floating point number column.
   */
  float(columnName: string, build?: ColumnBuilderCallback): CreateTableBuilder {
    return this.addColumn(columnName, dataTypeNode.create('Float'), build)
  }

  /**
   * Adds a double precision floating point number column.
   */
  double(
    columnName: string,
    build?: ColumnBuilderCallback
  ): CreateTableBuilder {
    return this.addColumn(columnName, dataTypeNode.create('Double'), build)
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
      dataTypeNode.create('Numeric', { precision, scale }),
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
      dataTypeNode.create('Decimal', { precision, scale }),
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
    return this.addColumn(columnName, dataTypeNode.create('Boolean'), build)
  }

  /**
   * Adds a date column.
   */
  date(columnName: string, build?: ColumnBuilderCallback): CreateTableBuilder {
    return this.addColumn(columnName, dataTypeNode.create('Date'), build)
  }

  /**
   * Adds a datetime column.
   *
   * On postgres timestampz is used.
   */
  dateTime(
    columnName: string,
    build?: ColumnBuilderCallback
  ): CreateTableBuilder {
    return this.addColumn(columnName, dataTypeNode.create('DateTime'), build)
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
    return this.addColumn(columnName, rawNode.createWithSql(dataType), build)
  }

  /**
   * Adds a primary key constraint for one or more columns.
   *
   * @example
   * ```ts
   * primary(['first_name', 'last_name'])
   * ```
   */
  primary(columns: string[]): CreateTableBuilder {
    return new CreateTableBuilder({
      executor: this.#executor,
      createTableNode: createTableNode.cloneWithPrimaryKeyConstraint(
        this.#createTableNode,
        columns
      ),
    })
  }

  /**
   * Adds a unique constraint for one or more columns.
   *
   * @example
   * ```ts
   * unique(['first_name', 'last_name'])
   * ```
   */
  unique(columns: string[]): CreateTableBuilder {
    return new CreateTableBuilder({
      executor: this.#executor,
      createTableNode: createTableNode.cloneWithUniqueConstraint(
        this.#createTableNode,
        columns
      ),
    })
  }

  /**
   * Adds a check constraint.
   *
   * @example
   * ```ts
   * check('number_of_legs < 5')
   * ```
   */
  check(checkExpression: string): CreateTableBuilder {
    return new CreateTableBuilder({
      executor: this.#executor,
      createTableNode: createTableNode.cloneWithCheckConstraint(
        this.#createTableNode,
        checkExpression
      ),
    })
  }

  toOperationNode(): CreateTableNode {
    return this.#executor.transformNode(this.#createTableNode)
  }

  compile(): CompiledQuery {
    return this.#executor.compileQuery(this.toOperationNode())
  }

  async execute(): Promise<void> {
    await this.#executor.executeQuery(this.compile())
  }

  private addColumn(
    columnName: string,
    dataType: ColumnDataTypeNode,
    build?: ColumnBuilderCallback
  ): CreateTableBuilder {
    let columnBuilder = new ColumnBuilder(
      columnDefinitionNode.create(columnName, dataType)
    )

    if (build) {
      columnBuilder = build(columnBuilder)
    }

    return new CreateTableBuilder({
      executor: this.#executor,
      createTableNode: createTableNode.cloneWithColumn(
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
  executor: QueryExecutor
}

export type ColumnBuilderCallback = (
  tableBuilder: ColumnBuilder
) => ColumnBuilder
