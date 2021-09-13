import { RawBuilder } from '..'
import { addColumnNode } from '../operation-node/add-column-node'
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
import { AddColumnBuilder } from './add-column-builder'

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
   * Adds a column to the table.
   *
   * @example
   * ```ts
   * await db.schema
   *   .createTable('person')
   *   .addColumn('int', 'id', (col) => col.increments().primary()),
   *   .addColumn('first_name', 'varchar(50), (col) => col.notNullable())
   *   .addColumn('varchar', 'last_name')
   *   .addColumn('numeric(8, 2)', 'bank_balance')
   *   .addColumn('data', db.raw('customtype'))
   * ```
   */
  addColumn(
    columnName: string,
    dataType: ColumnDataType | RawBuilder,
    build?: ColumnBuilderCallback
  ): CreateTableBuilder {
    let columnBuilder = new AddColumnBuilder(
      addColumnNode.create(
        columnName,
        isOperationNodeSource(dataType)
          ? dataType.toOperationNode()
          : dataTypeNode.create(dataType)
      )
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

  /**
   * Adds a primary key constraint for one or more columns.
   *
   * @example
   * ```ts
   * addPrimaryKeyConstraint(['first_name', 'last_name'])
   * ```
   */
  addPrimaryKeyConstraint(columns: string[]): CreateTableBuilder {
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
   * addUniqueConstraint(['first_name', 'last_name'])
   * ```
   */
  addUniqueConstraint(columns: string[]): CreateTableBuilder {
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
   * addCheckConstraint('number_of_legs < 5')
   * ```
   */
  addCheckConstraint(checkExpression: string): CreateTableBuilder {
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
  tableBuilder: AddColumnBuilder
) => AddColumnBuilder
