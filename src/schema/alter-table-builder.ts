import { AddColumnNode } from '../operation-node/add-column-node.js'
import { AlterTableNode } from '../operation-node/alter-table-node.js'
import { ColumnDefinitionNode } from '../operation-node/column-definition-node.js'
import { DropColumnNode } from '../operation-node/drop-column-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { RenameColumnNode } from '../operation-node/rename-column-node.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { freeze, isString, noop } from '../util/object-utils.js'
import {
  ColumnDefinitionBuilder,
  ColumnDefinitionBuilderCallback,
} from './column-definition-builder.js'
import { QueryId } from '../util/query-id.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { ModifyColumnNode } from '../operation-node/modify-column-node.js'
import {
  DataTypeExpression,
  parseDataTypeExpression,
} from '../parser/data-type-parser.js'
import {
  ForeignKeyConstraintBuilder,
  ForeignKeyConstraintBuilderCallback,
} from './foreign-key-constraint-builder.js'
import { AddConstraintNode } from '../operation-node/add-constraint-node.js'
import { UniqueConstraintNode } from '../operation-node/unique-constraint-node.js'
import { CheckConstraintNode } from '../operation-node/check-constraint-node.js'
import { ForeignKeyConstraintNode } from '../operation-node/foreign-key-constraint-node.js'
import { ColumnNode } from '../operation-node/column-node.js'
import { parseTable } from '../parser/table-parser.js'
import { DropConstraintNode } from '../operation-node/drop-constraint-node.js'
import { Expression } from '../expression/expression.js'
import {
  AlterColumnBuilder,
  AlterColumnBuilderCallback,
} from './alter-column-builder.js'
import { AlterTableExecutor } from './alter-table-executor.js'
import { AlterTableAddForeignKeyConstraintBuilder } from './alter-table-add-foreign-key-constraint-builder.js'
import { AlterTableDropConstraintBuilder } from './alter-table-drop-constraint-builder.js'
import { PrimaryKeyConstraintNode } from '../operation-node/primary-key-constraint-node.js'
import { DropIndexNode } from '../operation-node/drop-index-node.js'
import { AddIndexNode } from '../operation-node/add-index-node.js'
import { AlterTableAddIndexBuilder } from './alter-table-add-index-builder.js'
import {
  UniqueConstraintNodeBuilder,
  UniqueConstraintNodeBuilderCallback,
} from './unique-constraint-builder.js'
import {
  PrimaryKeyConstraintBuilder,
  PrimaryKeyConstraintBuilderCallback,
} from './primary-key-constraint-builder.js'
import {
  CheckConstraintBuilder,
  CheckConstraintBuilderCallback,
} from './check-constraint-builder.js'
import { RenameConstraintNode } from '../operation-node/rename-constraint-node.js'
import {
  ExpressionOrFactory,
  parseExpression,
} from '../parser/expression-parser.js'

/**
 * This builder can be used to create a `alter table` query.
 */
export class AlterTableBuilder implements ColumnAlteringInterface {
  readonly #props: AlterTableBuilderProps

  constructor(props: AlterTableBuilderProps) {
    this.#props = freeze(props)
  }

  renameTo(newTableName: string): AlterTableExecutor {
    return new AlterTableExecutor({
      ...this.#props,
      node: AlterTableNode.cloneWithTableProps(this.#props.node, {
        renameTo: parseTable(newTableName),
      }),
    })
  }

  setSchema(newSchema: string): AlterTableExecutor {
    return new AlterTableExecutor({
      ...this.#props,
      node: AlterTableNode.cloneWithTableProps(this.#props.node, {
        setSchema: IdentifierNode.create(newSchema),
      }),
    })
  }

  alterColumn(
    column: string,
    alteration: AlterColumnBuilderCallback,
  ): AlterTableColumnAlteringBuilder {
    const builder = alteration(new AlterColumnBuilder(column))

    return new AlterTableColumnAlteringBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithColumnAlteration(
        this.#props.node,
        builder.toOperationNode(),
      ),
    })
  }

  dropColumn(column: string): AlterTableColumnAlteringBuilder {
    return new AlterTableColumnAlteringBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithColumnAlteration(
        this.#props.node,
        DropColumnNode.create(column),
      ),
    })
  }

  renameColumn(
    column: string,
    newColumn: string,
  ): AlterTableColumnAlteringBuilder {
    return new AlterTableColumnAlteringBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithColumnAlteration(
        this.#props.node,
        RenameColumnNode.create(column, newColumn),
      ),
    })
  }

  addColumn(
    columnName: string,
    dataType: DataTypeExpression,
    build: ColumnDefinitionBuilderCallback = noop,
  ): AlterTableColumnAlteringBuilder {
    const builder = build(
      new ColumnDefinitionBuilder(
        ColumnDefinitionNode.create(
          columnName,
          parseDataTypeExpression(dataType),
        ),
      ),
    )

    return new AlterTableColumnAlteringBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithColumnAlteration(
        this.#props.node,
        AddColumnNode.create(builder.toOperationNode()),
      ),
    })
  }

  modifyColumn(
    columnName: string,
    dataType: DataTypeExpression,
    build: ColumnDefinitionBuilderCallback = noop,
  ): AlterTableColumnAlteringBuilder {
    const builder = build(
      new ColumnDefinitionBuilder(
        ColumnDefinitionNode.create(
          columnName,
          parseDataTypeExpression(dataType),
        ),
      ),
    )

    return new AlterTableColumnAlteringBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithColumnAlteration(
        this.#props.node,
        ModifyColumnNode.create(builder.toOperationNode()),
      ),
    })
  }

  /**
   * See {@link CreateTableBuilder.addUniqueConstraint}
   */
  addUniqueConstraint(
    constraintName: string,
    columns: (string | ExpressionOrFactory<any, any, any>)[],
    build: UniqueConstraintNodeBuilderCallback = noop,
  ): AlterTableExecutor {
    const uniqueConstraintBuilder = build(
      new UniqueConstraintNodeBuilder(
        UniqueConstraintNode.create(
          columns.map((column) =>
            isString(column)
              ? ColumnNode.create(column)
              : parseExpression(column),
          ),

          constraintName,
        ),
      ),
    )

    return new AlterTableExecutor({
      ...this.#props,
      node: AlterTableNode.cloneWithTableProps(this.#props.node, {
        addConstraint: AddConstraintNode.create(
          uniqueConstraintBuilder.toOperationNode(),
        ),
      }),
    })
  }

  /**
   * See {@link CreateTableBuilder.addCheckConstraint}
   */
  addCheckConstraint(
    constraintName: string,
    checkExpression: Expression<any>,
    build: CheckConstraintBuilderCallback = noop,
  ): AlterTableExecutor {
    const constraintBuilder = build(
      new CheckConstraintBuilder(
        CheckConstraintNode.create(
          checkExpression.toOperationNode(),
          constraintName,
        ),
      ),
    )

    return new AlterTableExecutor({
      ...this.#props,
      node: AlterTableNode.cloneWithTableProps(this.#props.node, {
        addConstraint: AddConstraintNode.create(
          constraintBuilder.toOperationNode(),
        ),
      }),
    })
  }

  /**
   * See {@link CreateTableBuilder.addForeignKeyConstraint}
   *
   * Unlike {@link CreateTableBuilder.addForeignKeyConstraint} this method returns
   * the constraint builder and doesn't take a callback as the last argument. This
   * is because you can only add one column per `ALTER TABLE` query.
   */
  addForeignKeyConstraint(
    constraintName: string,
    columns: string[],
    targetTable: string,
    targetColumns: string[],
    build: ForeignKeyConstraintBuilderCallback = noop,
  ): AlterTableAddForeignKeyConstraintBuilder {
    const constraintBuilder = build(
      new ForeignKeyConstraintBuilder(
        ForeignKeyConstraintNode.create(
          columns.map(ColumnNode.create),
          parseTable(targetTable),
          targetColumns.map(ColumnNode.create),
          constraintName,
        ),
      ),
    )

    return new AlterTableAddForeignKeyConstraintBuilder({
      ...this.#props,
      constraintBuilder,
    })
  }

  /**
   * See {@link CreateTableBuilder.addPrimaryKeyConstraint}
   */
  addPrimaryKeyConstraint(
    constraintName: string,
    columns: string[],
    build: PrimaryKeyConstraintBuilderCallback = noop,
  ): AlterTableExecutor {
    const constraintBuilder = build(
      new PrimaryKeyConstraintBuilder(
        PrimaryKeyConstraintNode.create(columns, constraintName),
      ),
    )

    return new AlterTableExecutor({
      ...this.#props,
      node: AlterTableNode.cloneWithTableProps(this.#props.node, {
        addConstraint: AddConstraintNode.create(
          constraintBuilder.toOperationNode(),
        ),
      }),
    })
  }

  dropConstraint(constraintName: string): AlterTableDropConstraintBuilder {
    return new AlterTableDropConstraintBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithTableProps(this.#props.node, {
        dropConstraint: DropConstraintNode.create(constraintName),
      }),
    })
  }

  renameConstraint(
    oldName: string,
    newName: string,
  ): AlterTableDropConstraintBuilder {
    return new AlterTableDropConstraintBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithTableProps(this.#props.node, {
        renameConstraint: RenameConstraintNode.create(oldName, newName),
      }),
    })
  }

  /**
   * This can be used to add index to table.
   *
   *  ### Examples
   *
   * ```ts
   * db.schema.alterTable('person')
   *   .addIndex('person_email_index')
   *   .column('email')
   *   .unique()
   *   .execute()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * alter table `person` add unique index `person_email_index` (`email`)
   * ```
   */
  addIndex(indexName: string): AlterTableAddIndexBuilder {
    return new AlterTableAddIndexBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithTableProps(this.#props.node, {
        addIndex: AddIndexNode.create(indexName),
      }),
    })
  }

  /**
   * This can be used to drop index from table.
   *
   * ### Examples
   *
   * ```ts
   * db.schema.alterTable('person')
   *   .dropIndex('person_email_index')
   *   .execute()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * alter table `person` drop index `test_first_name_index`
   * ```
   */
  dropIndex(indexName: string): AlterTableExecutor {
    return new AlterTableExecutor({
      ...this.#props,
      node: AlterTableNode.cloneWithTableProps(this.#props.node, {
        dropIndex: DropIndexNode.create(indexName),
      }),
    })
  }

  /**
   * Calls the given function passing `this` as the only argument.
   *
   * See {@link CreateTableBuilder.$call}
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }
}

export interface AlterTableBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: AlterTableNode
}

export interface ColumnAlteringInterface {
  alterColumn(
    column: string,
    alteration: AlterColumnBuilderCallback,
  ): ColumnAlteringInterface

  dropColumn(column: string): ColumnAlteringInterface

  renameColumn(column: string, newColumn: string): ColumnAlteringInterface

  /**
   * See {@link CreateTableBuilder.addColumn}
   */
  addColumn(
    columnName: string,
    dataType: DataTypeExpression,
    build?: ColumnDefinitionBuilderCallback,
  ): ColumnAlteringInterface

  /**
   * Creates an `alter table modify column` query. The `modify column` statement
   * is only implemeted by MySQL and oracle AFAIK. On other databases you
   * should use the `alterColumn` method.
   */
  modifyColumn(
    columnName: string,
    dataType: DataTypeExpression,
    build: ColumnDefinitionBuilderCallback,
  ): ColumnAlteringInterface
}

export class AlterTableColumnAlteringBuilder
  implements ColumnAlteringInterface, OperationNodeSource, Compilable
{
  readonly #props: AlterTableColumnAlteringBuilderProps

  constructor(props: AlterTableColumnAlteringBuilderProps) {
    this.#props = freeze(props)
  }

  alterColumn(
    column: string,
    alteration: AlterColumnBuilderCallback,
  ): AlterTableColumnAlteringBuilder {
    const builder = alteration(new AlterColumnBuilder(column))

    return new AlterTableColumnAlteringBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithColumnAlteration(
        this.#props.node,
        builder.toOperationNode(),
      ),
    })
  }

  dropColumn(column: string): AlterTableColumnAlteringBuilder {
    return new AlterTableColumnAlteringBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithColumnAlteration(
        this.#props.node,
        DropColumnNode.create(column),
      ),
    })
  }

  renameColumn(
    column: string,
    newColumn: string,
  ): AlterTableColumnAlteringBuilder {
    return new AlterTableColumnAlteringBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithColumnAlteration(
        this.#props.node,
        RenameColumnNode.create(column, newColumn),
      ),
    })
  }

  addColumn(
    columnName: string,
    dataType: DataTypeExpression,
    build: ColumnDefinitionBuilderCallback = noop,
  ): AlterTableColumnAlteringBuilder {
    const builder = build(
      new ColumnDefinitionBuilder(
        ColumnDefinitionNode.create(
          columnName,
          parseDataTypeExpression(dataType),
        ),
      ),
    )

    return new AlterTableColumnAlteringBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithColumnAlteration(
        this.#props.node,
        AddColumnNode.create(builder.toOperationNode()),
      ),
    })
  }

  modifyColumn(
    columnName: string,
    dataType: DataTypeExpression,
    build: ColumnDefinitionBuilderCallback = noop,
  ): AlterTableColumnAlteringBuilder {
    const builder = build(
      new ColumnDefinitionBuilder(
        ColumnDefinitionNode.create(
          columnName,
          parseDataTypeExpression(dataType),
        ),
      ),
    )

    return new AlterTableColumnAlteringBuilder({
      ...this.#props,
      node: AlterTableNode.cloneWithColumnAlteration(
        this.#props.node,
        ModifyColumnNode.create(builder.toOperationNode()),
      ),
    })
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
    await this.#props.executor.executeQuery(this.compile())
  }
}

export interface AlterTableColumnAlteringBuilderProps
  extends AlterTableBuilderProps {}
