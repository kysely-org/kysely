import { RawBuilder } from '..'
import { columnDefinitionNode } from '../operation-node/column-definition-node'
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
import { QueryExecutor } from '../query-executor/query-executor'
import { ColumnDefinitionBuilder } from './column-definition-builder'

export class CreateTableBuilder implements OperationNodeSource, Compilable {
  readonly #createTableNode: CreateTableNode
  readonly #executor: QueryExecutor

  constructor(args: CreateTableBuilderConstructorArgs) {
    this.#createTableNode = args.createTableNode
    this.#executor = args.executor
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
   *   .addColumn('first_name', 'varchar(50), (col) => col.notNull())
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
    let columnBuilder = new ColumnDefinitionBuilder(
      columnDefinitionNode.create(
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
   * addPrimaryKeyConstraint('primary_key', ['first_name', 'last_name'])
   * ```
   */
  addPrimaryKeyConstraint(
    constraintName: string,
    columns: string[]
  ): CreateTableBuilder {
    return new CreateTableBuilder({
      executor: this.#executor,
      createTableNode: createTableNode.cloneWithPrimaryKeyConstraint(
        this.#createTableNode,
        constraintName,
        columns
      ),
    })
  }

  /**
   * Adds a unique constraint for one or more columns.
   *
   * @example
   * ```ts
   * addUniqueConstraint('first_name_last_name_unique', ['first_name', 'last_name'])
   * ```
   */
  addUniqueConstraint(
    constraintName: string,
    columns: string[]
  ): CreateTableBuilder {
    return new CreateTableBuilder({
      executor: this.#executor,
      createTableNode: createTableNode.cloneWithUniqueConstraint(
        this.#createTableNode,
        constraintName,
        columns
      ),
    })
  }

  /**
   * Adds a check constraint.
   *
   * @example
   * ```ts
   * addCheckConstraint('check_legs', 'number_of_legs < 5')
   * ```
   */
  addCheckConstraint(
    constraintName: string,
    checkExpression: string
  ): CreateTableBuilder {
    return new CreateTableBuilder({
      executor: this.#executor,
      createTableNode: createTableNode.cloneWithCheckConstraint(
        this.#createTableNode,
        constraintName,
        checkExpression
      ),
    })
  }

  /**
   * Adds a foreign key constraint.
   *
   * @example
   * ```ts
   * addForeignKeyConstraint(
   *   'owner_id_foreign',
   *   ['owner_id'],
   *   'person',
   *   ['id'],
   * )
   * ```
   */
  addForeignKeyConstraint(
    constraintName: string,
    columns: string[],
    targetTable: string,
    targetColumns: string[]
  ): CreateTableBuilder {
    return new CreateTableBuilder({
      executor: this.#executor,
      createTableNode: createTableNode.cloneWithForeignKeyConstraint(
        this.#createTableNode,
        constraintName,
        columns,
        targetTable,
        targetColumns
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
  tableBuilder: ColumnDefinitionBuilder
) => ColumnDefinitionBuilder
