import { ColumnDefinitionNode } from '../operation-node/column-definition-node.js'
import { CreateTableNode } from '../operation-node/create-table-node.js'
import {
  ColumnDataType,
  DataTypeNode,
} from '../operation-node/data-type-node.js'
import {
  isOperationNodeSource,
  OperationNodeSource,
} from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { ColumnDefinitionBuilder } from './column-definition-builder.js'
import { RawBuilder } from '../raw-builder/raw-builder.js'
import { QueryId } from '../util/query-id.js'
import { freeze } from '../util/object-utils.js'
import { ForeignKeyConstraintNode } from '../operation-node/foreign-key-constraint-node.js'
import { ColumnNode } from '../operation-node/column-node.js'
import { TableNode } from '../operation-node/table-node.js'
import { ForeignKeyConstraintBuilder } from './foreign-key-constraint-builder.js'

export class CreateTableBuilder implements OperationNodeSource, Compilable {
  readonly #props: CreateTableBuilderProps

  constructor(props: CreateTableBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Adds the "if not exists" modifier.
   *
   * If the table already exists, no error is thrown if this method has been called.
   */
  ifNotExists(): CreateTableBuilder {
    return new CreateTableBuilder({
      ...this.#props,
      createTableNode: CreateTableNode.cloneWithModifier(
        this.#props.createTableNode,
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
      ColumnDefinitionNode.create(
        columnName,
        isOperationNodeSource(dataType)
          ? dataType.toOperationNode()
          : DataTypeNode.create(dataType)
      )
    )

    if (build) {
      columnBuilder = build(columnBuilder)
    }

    return new CreateTableBuilder({
      ...this.#props,
      createTableNode: CreateTableNode.cloneWithColumn(
        this.#props.createTableNode,
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
      ...this.#props,
      createTableNode: CreateTableNode.cloneWithPrimaryKeyConstraint(
        this.#props.createTableNode,
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
      ...this.#props,
      createTableNode: CreateTableNode.cloneWithUniqueConstraint(
        this.#props.createTableNode,
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
      ...this.#props,
      createTableNode: CreateTableNode.cloneWithCheckConstraint(
        this.#props.createTableNode,
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
   *
   * @example
   * ```ts
   * addForeignKeyConstraint(
   *   'owner_id_foreign',
   *   ['owner_id'],
   *   'person',
   *   ['id'],
   *   (cb) => cb.onDelete('cascade')
   * )
   * ```
   */
  addForeignKeyConstraint(
    constraintName: string,
    columns: string[],
    targetTable: string,
    targetColumns: string[],
    build?: ForeignKeyConstraintBuilderCallback
  ): CreateTableBuilder {
    let builder = new ForeignKeyConstraintBuilder({
      constraintNode: ForeignKeyConstraintNode.create(
        columns.map(ColumnNode.create),
        TableNode.create(targetTable),
        targetColumns.map(ColumnNode.create),
        constraintName
      ),
    })

    if (build) {
      builder = build(builder)
    }

    return new CreateTableBuilder({
      ...this.#props,
      createTableNode: CreateTableNode.cloneWithForeignKeyConstraint(
        this.#props.createTableNode,
        builder.toOperationNode()
      ),
    })
  }

  toOperationNode(): CreateTableNode {
    return this.#props.executor.transformQuery(
      this.#props.createTableNode,
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

preventAwait(
  CreateTableBuilder,
  "don't await CreateTableBuilder instances directly. To execute the query you need to call `execute`"
)

export interface CreateTableBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly createTableNode: CreateTableNode
}

export type ColumnBuilderCallback = (
  builder: ColumnDefinitionBuilder
) => ColumnDefinitionBuilder

export type ForeignKeyConstraintBuilderCallback = (
  builder: ForeignKeyConstraintBuilder
) => ForeignKeyConstraintBuilder
