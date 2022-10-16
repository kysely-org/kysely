import { AddColumnNode } from '../operation-node/add-column-node.js'
import { AlterColumnNode } from '../operation-node/alter-column-node.js'
import { AlterTableNode } from '../operation-node/alter-table-node.js'
import { ColumnDefinitionNode } from '../operation-node/column-definition-node.js'
import {
  ColumnDataType,
  DataTypeNode,
} from '../operation-node/data-type-node.js'
import { DropColumnNode } from '../operation-node/drop-column-node.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { OnModifyForeignAction } from '../operation-node/references-node.js'
import { RenameColumnNode } from '../operation-node/rename-column-node.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { freeze, noop } from '../util/object-utils.js'
import { preventAwait } from '../util/prevent-await.js'
import {
  ColumnDefinitionBuilder,
  ColumnDefinitionBuilderInterface,
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
  ForeignKeyConstraintBuilderInterface,
} from './foreign-key-constraint-builder.js'
import { AddConstraintNode } from '../operation-node/add-constraint-node.js'
import { UniqueConstraintNode } from '../operation-node/unique-constraint-node.js'
import { CheckConstraintNode } from '../operation-node/check-constraint-node.js'
import { ForeignKeyConstraintNode } from '../operation-node/foreign-key-constraint-node.js'
import { ColumnNode } from '../operation-node/column-node.js'
import {
  DefaultValueExpression,
  parseDefaultValueExpression,
} from '../parser/default-value-parser.js'
import { parseTable } from '../parser/table-parser.js'
import { DropConstraintNode } from '../operation-node/drop-constraint-node.js'
import { Expression } from '../expression/expression.js'

/**
 * This builder can be used to create a `alter table` query.
 */
export class AlterTableBuilder {
  readonly #props: AlterTableBuilderProps

  constructor(props: AlterTableBuilderProps) {
    this.#props = freeze(props)
  }

  renameTo(newTableName: string): AlterTableExecutor {
    return new AlterTableExecutor({
      ...this.#props,
      alterTableNode: AlterTableNode.cloneWith(this.#props.alterTableNode, {
        renameTo: parseTable(newTableName),
      }),
    })
  }

  setSchema(newSchema: string): AlterTableExecutor {
    return new AlterTableExecutor({
      ...this.#props,
      alterTableNode: AlterTableNode.cloneWith(this.#props.alterTableNode, {
        setSchema: IdentifierNode.create(newSchema),
      }),
    })
  }

  alterColumn(column: string): AlterColumnBuilder {
    return new AlterColumnBuilder({
      ...this.#props,
      alterColumnNode: AlterColumnNode.create(column),
    })
  }

  dropColumn(column: string): AlterTableExecutor {
    return new AlterTableExecutor({
      ...this.#props,
      alterTableNode: AlterTableNode.cloneWith(this.#props.alterTableNode, {
        dropColumn: DropColumnNode.create(column),
      }),
    })
  }

  renameColumn(column: string, newColumn: string): AlterTableExecutor {
    return new AlterTableExecutor({
      ...this.#props,
      alterTableNode: AlterTableNode.cloneWith(this.#props.alterTableNode, {
        renameColumn: RenameColumnNode.create(column, newColumn),
      }),
    })
  }

  /**
   * See {@link CreateTableBuilder.addColumn}
   */
  addColumn(
    columnName: string,
    dataType: DataTypeExpression,
    build: AlterTableAddColumnBuilderCallback = noop
  ): AlterTableAddColumnBuilder {
    return build(
      new AlterTableAddColumnBuilder({
        ...this.#props,
        columnBuilder: new ColumnDefinitionBuilder(
          ColumnDefinitionNode.create(
            columnName,
            parseDataTypeExpression(dataType)
          )
        ),
      })
    )
  }

  /**
   * Creates an `alter table modify column` query. The `modify column` statement
   * is only implemeted by MySQL and oracle AFAIK. On other databases you
   * should use the `alterColumn` method.
   */
  modifyColumn(
    columnName: string,
    dataType: DataTypeExpression
  ): AlterTableModifyColumnBuilder {
    return new AlterTableModifyColumnBuilder({
      ...this.#props,
      columnBuilder: new ColumnDefinitionBuilder(
        ColumnDefinitionNode.create(
          columnName,
          parseDataTypeExpression(dataType)
        )
      ),
    })
  }

  /**
   * See {@link CreateTableBuilder.addUniqueConstraint}
   */
  addUniqueConstraint(
    constraintName: string,
    columns: string[]
  ): AlterTableExecutor {
    return new AlterTableExecutor({
      ...this.#props,
      alterTableNode: AlterTableNode.cloneWith(this.#props.alterTableNode, {
        addConstraint: AddConstraintNode.create(
          UniqueConstraintNode.create(columns, constraintName)
        ),
      }),
    })
  }

  /**
   * See {@link CreateTableBuilder.addCheckConstraint}
   */
  addCheckConstraint(
    constraintName: string,
    checkExpression: Expression<any>
  ): AlterTableExecutor {
    return new AlterTableExecutor({
      ...this.#props,
      alterTableNode: AlterTableNode.cloneWith(this.#props.alterTableNode, {
        addConstraint: AddConstraintNode.create(
          CheckConstraintNode.create(
            checkExpression.toOperationNode(),
            constraintName
          )
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
    targetColumns: string[]
  ): AlterTableAddForeignKeyConstraintBuilder {
    return new AlterTableAddForeignKeyConstraintBuilder({
      ...this.#props,
      constraintBuilder: new ForeignKeyConstraintBuilder(
        ForeignKeyConstraintNode.create(
          columns.map(ColumnNode.create),
          parseTable(targetTable),
          targetColumns.map(ColumnNode.create),
          constraintName
        )
      ),
    })
  }

  dropConstraint(constraintName: string): AlterTableDropConstraintBuilder {
    return new AlterTableDropConstraintBuilder({
      ...this.#props,
      alterTableNode: AlterTableNode.cloneWith(this.#props.alterTableNode, {
        dropConstraint: DropConstraintNode.create(constraintName),
      }),
    })
  }
}

export interface AlterTableBuilderProps {
  readonly queryId: QueryId
  readonly alterTableNode: AlterTableNode
  readonly executor: QueryExecutor
}

export class AlterColumnBuilder {
  readonly #props: AlterColumnBuilderProps

  constructor(props: AlterColumnBuilderProps) {
    this.#props = freeze(props)
  }

  setDataType(dataType: ColumnDataType): AlterTableExecutor {
    return new AlterTableExecutor({
      ...this.#props,
      alterTableNode: AlterTableNode.cloneWith(this.#props.alterTableNode, {
        alterColumn: AlterColumnNode.cloneWith(this.#props.alterColumnNode, {
          dataType: DataTypeNode.create(dataType),
        }),
      }),
    })
  }

  setDefault(value: DefaultValueExpression): AlterTableExecutor {
    return new AlterTableExecutor({
      ...this.#props,
      alterTableNode: AlterTableNode.cloneWith(this.#props.alterTableNode, {
        alterColumn: AlterColumnNode.cloneWith(this.#props.alterColumnNode, {
          setDefault: parseDefaultValueExpression(value),
        }),
      }),
    })
  }

  dropDefault(): AlterTableExecutor {
    return new AlterTableExecutor({
      ...this.#props,
      alterTableNode: AlterTableNode.cloneWith(this.#props.alterTableNode, {
        alterColumn: AlterColumnNode.cloneWith(this.#props.alterColumnNode, {
          dropDefault: true,
        }),
      }),
    })
  }

  setNotNull(): AlterTableExecutor {
    return new AlterTableExecutor({
      ...this.#props,
      alterTableNode: AlterTableNode.cloneWith(this.#props.alterTableNode, {
        alterColumn: AlterColumnNode.cloneWith(this.#props.alterColumnNode, {
          setNotNull: true,
        }),
      }),
    })
  }

  dropNotNull(): AlterTableExecutor {
    return new AlterTableExecutor({
      ...this.#props,
      alterTableNode: AlterTableNode.cloneWith(this.#props.alterTableNode, {
        alterColumn: AlterColumnNode.cloneWith(this.#props.alterColumnNode, {
          dropNotNull: true,
        }),
      }),
    })
  }
}

export interface AlterColumnBuilderProps extends AlterTableBuilderProps {
  readonly alterColumnNode: AlterColumnNode
}

export class AlterTableExecutor implements OperationNodeSource, Compilable {
  readonly #props: AlterTableExecutorProps

  constructor(props: AlterTableExecutorProps) {
    this.#props = freeze(props)
  }

  toOperationNode(): AlterTableNode {
    return this.#props.executor.transformQuery(
      this.#props.alterTableNode,
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

export interface AlterTableExecutorProps extends AlterTableBuilderProps {}

export class AlterTableAddColumnBuilder
  implements ColumnDefinitionBuilderInterface, OperationNodeSource, Compilable
{
  readonly #props: AlterTableAddColumnBuilderProps

  constructor(props: AlterTableAddColumnBuilderProps) {
    this.#props = freeze(props)
  }

  autoIncrement(): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.autoIncrement(),
    })
  }

  primaryKey(): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.primaryKey(),
    })
  }

  references(ref: string): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.references(ref),
    })
  }

  onDelete(onDelete: OnModifyForeignAction): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.onDelete(onDelete),
    })
  }

  onUpdate(onDelete: OnModifyForeignAction): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.onUpdate(onDelete),
    })
  }

  unique(): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.unique(),
    })
  }

  notNull(): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.notNull(),
    })
  }

  unsigned(): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.unsigned(),
    })
  }

  defaultTo(value: DefaultValueExpression): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.defaultTo(value),
    })
  }

  check(expression: Expression<any>): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.check(expression),
    })
  }

  generatedAlwaysAs(expression: Expression<any>): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.generatedAlwaysAs(expression),
    })
  }

  generatedAlwaysAsIdentity(): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.generatedAlwaysAsIdentity(),
    })
  }

  generatedByDefaultAsIdentity(): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.generatedByDefaultAsIdentity(),
    })
  }

  stored(): AlterTableAddColumnBuilder {
    return new AlterTableAddColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.stored(),
    })
  }

  toOperationNode(): AlterTableNode {
    return this.#props.executor.transformQuery(
      AlterTableNode.cloneWith(this.#props.alterTableNode, {
        addColumn: AddColumnNode.create(
          this.#props.columnBuilder.toOperationNode()
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

export interface AlterTableAddColumnBuilderProps
  extends AlterTableBuilderProps {
  readonly columnBuilder: ColumnDefinitionBuilder
}

export type AlterTableAddColumnBuilderCallback = (
  builder: AlterTableAddColumnBuilder
) => AlterTableAddColumnBuilder

export class AlterTableModifyColumnBuilder
  implements ColumnDefinitionBuilderInterface, OperationNodeSource, Compilable
{
  readonly #props: AlterTableModifyColumnBuilderProps

  constructor(props: AlterTableModifyColumnBuilderProps) {
    this.#props = freeze(props)
  }

  autoIncrement(): AlterTableModifyColumnBuilder {
    return new AlterTableModifyColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.autoIncrement(),
    })
  }

  primaryKey(): AlterTableModifyColumnBuilder {
    return new AlterTableModifyColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.primaryKey(),
    })
  }

  references(ref: string): AlterTableModifyColumnBuilder {
    return new AlterTableModifyColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.references(ref),
    })
  }

  onDelete(onDelete: OnModifyForeignAction): AlterTableModifyColumnBuilder {
    return new AlterTableModifyColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.onDelete(onDelete),
    })
  }

  onUpdate(onUpdate: OnModifyForeignAction): AlterTableModifyColumnBuilder {
    return new AlterTableModifyColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.onUpdate(onUpdate),
    })
  }

  unique(): AlterTableModifyColumnBuilder {
    return new AlterTableModifyColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.unique(),
    })
  }

  notNull(): AlterTableModifyColumnBuilder {
    return new AlterTableModifyColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.notNull(),
    })
  }

  unsigned(): AlterTableModifyColumnBuilder {
    return new AlterTableModifyColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.unsigned(),
    })
  }

  defaultTo(value: DefaultValueExpression): AlterTableModifyColumnBuilder {
    return new AlterTableModifyColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.defaultTo(value),
    })
  }

  check(expression: Expression<any>): AlterTableModifyColumnBuilder {
    return new AlterTableModifyColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.check(expression),
    })
  }

  generatedAlwaysAs(
    expression: Expression<any>
  ): AlterTableModifyColumnBuilder {
    return new AlterTableModifyColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.generatedAlwaysAs(expression),
    })
  }

  generatedAlwaysAsIdentity(): AlterTableModifyColumnBuilder {
    return new AlterTableModifyColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.generatedAlwaysAsIdentity(),
    })
  }

  generatedByDefaultAsIdentity(): AlterTableModifyColumnBuilder {
    return new AlterTableModifyColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.generatedByDefaultAsIdentity(),
    })
  }

  stored(): AlterTableModifyColumnBuilder {
    return new AlterTableModifyColumnBuilder({
      ...this.#props,
      columnBuilder: this.#props.columnBuilder.stored(),
    })
  }

  toOperationNode(): AlterTableNode {
    return this.#props.executor.transformQuery(
      AlterTableNode.cloneWith(this.#props.alterTableNode, {
        modifyColumn: ModifyColumnNode.create(
          this.#props.columnBuilder.toOperationNode()
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

export interface AlterTableModifyColumnBuilderProps
  extends AlterTableBuilderProps {
  readonly columnBuilder: ColumnDefinitionBuilder
}

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
      AlterTableNode.cloneWith(this.#props.alterTableNode, {
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

export interface AlterTableAddForeignKeyConstraintBuilderProps
  extends AlterTableBuilderProps {
  readonly constraintBuilder: ForeignKeyConstraintBuilder
}

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
      alterTableNode: AlterTableNode.cloneWith(this.#props.alterTableNode, {
        dropConstraint: DropConstraintNode.cloneWith(
          this.#props.alterTableNode.dropConstraint!,
          {
            ifExists: true,
          }
        ),
      }),
    })
  }

  cascade(): AlterTableDropConstraintBuilder {
    return new AlterTableDropConstraintBuilder({
      ...this.#props,
      alterTableNode: AlterTableNode.cloneWith(this.#props.alterTableNode, {
        dropConstraint: DropConstraintNode.cloneWith(
          this.#props.alterTableNode.dropConstraint!,
          {
            modifier: 'cascade',
          }
        ),
      }),
    })
  }

  restrict(): AlterTableDropConstraintBuilder {
    return new AlterTableDropConstraintBuilder({
      ...this.#props,
      alterTableNode: AlterTableNode.cloneWith(this.#props.alterTableNode, {
        dropConstraint: DropConstraintNode.cloneWith(
          this.#props.alterTableNode.dropConstraint!,
          {
            modifier: 'restrict',
          }
        ),
      }),
    })
  }

  toOperationNode(): AlterTableNode {
    return this.#props.executor.transformQuery(
      this.#props.alterTableNode,
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

export interface AlterTableDropConstraintBuilderProps
  extends AlterTableBuilderProps {}

preventAwait(AlterTableBuilder, "don't await AlterTableBuilder instances")
preventAwait(AlterColumnBuilder, "don't await AlterColumnBuilder instances")

preventAwait(
  AlterTableExecutor,
  "don't await AlterTableExecutor instances directly. To execute the query you need to call `execute`"
)

preventAwait(
  AlterTableAddColumnBuilder,
  "don't await AlterTableAddColumnBuilder instances directly. To execute the query you need to call `execute`"
)

preventAwait(
  AlterTableModifyColumnBuilder,
  "don't await AlterTableModifyColumnBuilder instances directly. To execute the query you need to call `execute`"
)

preventAwait(
  AlterTableAddForeignKeyConstraintBuilder,
  "don't await AlterTableAddForeignKeyConstraintBuilder instances directly. To execute the query you need to call `execute`"
)

preventAwait(
  AlterTableDropConstraintBuilder,
  "don't await AlterTableDropConstraintBuilder instances directly. To execute the query you need to call `execute`"
)
