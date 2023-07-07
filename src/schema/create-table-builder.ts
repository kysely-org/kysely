import { ColumnDefinitionNode } from '../operation-node/column-definition-node.js'
import {
  CreateTableNode,
  OnCommitAction,
} from '../operation-node/create-table-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { preventAwait } from '../util/prevent-await.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { ColumnDefinitionBuilder } from './column-definition-builder.js'
import { QueryId } from '../util/query-id.js'
import { freeze, noop } from '../util/object-utils.js'
import { ForeignKeyConstraintNode } from '../operation-node/foreign-key-constraint-node.js'
import { ColumnNode } from '../operation-node/column-node.js'
import { ForeignKeyConstraintBuilder } from './foreign-key-constraint-builder.js'
import {
  DataTypeExpression,
  parseDataTypeExpression,
} from '../parser/data-type-parser.js'
import { PrimaryConstraintNode } from '../operation-node/primary-constraint-node.js'
import { UniqueConstraintNode } from '../operation-node/unique-constraint-node.js'
import { CheckConstraintNode } from '../operation-node/check-constraint-node.js'
import { parseTable } from '../parser/table-parser.js'
import { parseOnCommitAction } from '../parser/on-commit-action-parse.js'
import { Expression } from '../expression/expression.js'

/**
 * This builder can be used to create a `create table` query.
 */
export class CreateTableBuilder<TB extends string, C extends string = never>
  implements OperationNodeSource, Compilable
{
  readonly #props: CreateTableBuilderProps

  constructor(props: CreateTableBuilderProps) {
    this.#props = freeze(props)
  }

  /**
   * Adds the "temporary" modifier.
   *
   * Use this to create a temporary table.
   */
  temporary(): CreateTableBuilder<TB, C> {
    return new CreateTableBuilder({
      ...this.#props,
      node: CreateTableNode.cloneWith(this.#props.node, {
        temporary: true,
      }),
    })
  }

  /**
   * Adds an "on commit" statement.
   *
   * This can be used in conjunction with temporary tables on supported databases
   * like PostgreSQL.
   */
  onCommit(onCommit: OnCommitAction): CreateTableBuilder<TB, C> {
    return new CreateTableBuilder({
      ...this.#props,
      node: CreateTableNode.cloneWith(this.#props.node, {
        onCommit: parseOnCommitAction(onCommit),
      }),
    })
  }

  /**
   * Adds the "if not exists" modifier.
   *
   * If the table already exists, no error is thrown if this method has been called.
   */
  ifNotExists(): CreateTableBuilder<TB, C> {
    return new CreateTableBuilder({
      ...this.#props,
      node: CreateTableNode.cloneWith(this.#props.node, {
        ifNotExists: true,
      }),
    })
  }

  /**
   * Adds a column to the table.
   *
   * ### Examples
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * await db.schema
   *   .createTable('person')
   *   .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey()),
   *   .addColumn('first_name', 'varchar(50)', (col) => col.notNull())
   *   .addColumn('last_name', 'varchar(255)')
   *   .addColumn('bank_balance', 'numeric(8, 2)')
   *   // You can specify any data type using the `sql` tag if the types
   *   // don't include it.
   *   .addColumn('data', sql`any_type_here`)
   *   .addColumn('parent_id', 'integer', (col) =>
   *     col.references('person.id').onDelete('cascade'))
   *   )
   * ```
   *
   * With this method, it's once again good to remember that Kysely just builds the
   * query and doesn't provide the same API for all databses. For example, some
   * databases like older MySQL don't support the `references` statement in the
   * column definition. Instead foreign key constraints need to be defined in the
   * `create table` query. See the next example:
   *
   * ```ts
   *   .addColumn('parent_id', 'integer')
   *   .addForeignKeyConstraint(
   *     'person_parent_id_fk', ['parent_id'], 'person', ['id'],
   *     (cb) => cb.onDelete('cascade')
   *   )
   * ```
   *
   * Another good example is that PostgreSQL doesn't support the `auto_increment`
   * keyword and you need to define an autoincrementing column for example using
   * `serial`:
   *
   * ```ts
   * await db.schema
   *   .createTable('person')
   *   .addColumn('id', 'serial', (col) => col.primaryKey()),
   * ```
   */
  addColumn<CN extends string>(
    columnName: CN,
    dataType: DataTypeExpression,
    build: ColumnBuilderCallback = noop
  ): CreateTableBuilder<TB, C | CN> {
    const columnBuilder = build(
      new ColumnDefinitionBuilder(
        ColumnDefinitionNode.create(
          columnName,
          parseDataTypeExpression(dataType)
        )
      )
    )

    return new CreateTableBuilder({
      ...this.#props,
      node: CreateTableNode.cloneWithColumn(
        this.#props.node,
        columnBuilder.toOperationNode()
      ),
    })
  }

  /**
   * Adds a primary key constraint for one or more columns.
   *
   * The constraint name can be anything you want, but it must be unique
   * across the whole database.
   *
   * ### Examples
   *
   * ```ts
   * addPrimaryKeyConstraint('primary_key', ['first_name', 'last_name'])
   * ```
   */
  addPrimaryKeyConstraint(
    constraintName: string,
    columns: C[]
  ): CreateTableBuilder<TB, C> {
    return new CreateTableBuilder({
      ...this.#props,
      node: CreateTableNode.cloneWithConstraint(
        this.#props.node,
        PrimaryConstraintNode.create(columns, constraintName)
      ),
    })
  }

  /**
   * Adds a unique constraint for one or more columns.
   *
   * The constraint name can be anything you want, but it must be unique
   * across the whole database.
   *
   * ### Examples
   *
   * ```ts
   * addUniqueConstraint('first_name_last_name_unique', ['first_name', 'last_name'])
   * ```
   */
  addUniqueConstraint(
    constraintName: string,
    columns: C[]
  ): CreateTableBuilder<TB, C> {
    return new CreateTableBuilder({
      ...this.#props,
      node: CreateTableNode.cloneWithConstraint(
        this.#props.node,
        UniqueConstraintNode.create(columns, constraintName)
      ),
    })
  }

  /**
   * Adds a check constraint.
   *
   * The constraint name can be anything you want, but it must be unique
   * across the whole database.
   *
   * ### Examples
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * addCheckConstraint('check_legs', sql`number_of_legs < 5`)
   * ```
   */
  addCheckConstraint(
    constraintName: string,
    checkExpression: Expression<any>
  ): CreateTableBuilder<TB, C> {
    return new CreateTableBuilder({
      ...this.#props,
      node: CreateTableNode.cloneWithConstraint(
        this.#props.node,
        CheckConstraintNode.create(
          checkExpression.toOperationNode(),
          constraintName
        )
      ),
    })
  }

  /**
   * Adds a foreign key constraint.
   *
   * The constraint name can be anything you want, but it must be unique
   * across the whole database.
   *
   * ### Examples
   *
   * ```ts
   * addForeignKeyConstraint(
   *   'owner_id_foreign',
   *   ['owner_id'],
   *   'person',
   *   ['id'],
   * )
   * ```
   *
   * Add constraint for multiple columns:
   *
   * ```ts
   * addForeignKeyConstraint(
   *   'owner_id_foreign',
   *   ['owner_id1', 'owner_id2'],
   *   'person',
   *   ['id1', 'id2'],
   *   (cb) => cb.onDelete('cascade')
   * )
   * ```
   */
  addForeignKeyConstraint(
    constraintName: string,
    columns: C[],
    targetTable: string,
    targetColumns: string[],
    build: ForeignKeyConstraintBuilderCallback = noop
  ): CreateTableBuilder<TB, C> {
    const builder = build(
      new ForeignKeyConstraintBuilder(
        ForeignKeyConstraintNode.create(
          columns.map(ColumnNode.create),
          parseTable(targetTable),
          targetColumns.map(ColumnNode.create),
          constraintName
        )
      )
    )

    return new CreateTableBuilder({
      ...this.#props,
      node: CreateTableNode.cloneWithConstraint(
        this.#props.node,
        builder.toOperationNode()
      ),
    })
  }

  /**
   * This can be used to add any additional SQL to the front of the query __after__ the `create` keyword.
   *
   * Also see {@link temporary}.
   *
   * ### Examples
   *
   * ```ts
   * db.schema.createTable('person')
   *   .modifyFront(sql`global temporary`)
   *   .addColumn('id', 'integer', col => col.primaryKey())
   *   .addColumn('first_name', 'varchar(64)', col => col.notNull())
   *   .addColumn('last_name', 'varchar(64), col => col.notNull())
   *   .execute()
   * ```
   *
   * The generated SQL (Postgres):
   *
   * ```sql
   * create global temporary table "person" (
   *   "id" integer primary key,
   *   "first_name" varchar(64) not null,
   *   "last_name" varchar(64) not null
   * )
   * ```
   */
  modifyFront(modifier: Expression<any>): CreateTableBuilder<TB, C> {
    return new CreateTableBuilder({
      ...this.#props,
      node: CreateTableNode.cloneWithFrontModifier(
        this.#props.node,
        modifier.toOperationNode()
      ),
    })
  }

  /**
   * This can be used to add any additional SQL to the end of the query.
   *
   * Also see {@link onCommit}.
   *
   * ### Examples
   *
   * ```ts
   * db.schema.createTable('person')
   *   .addColumn('id', 'integer', col => col => primaryKey())
   *   .addColumn('first_name', 'varchar(64)', col => col.notNull())
   *   .addColumn('last_name', 'varchar(64), col => col.notNull())
   *   .modifyEnd(sql`collate utf8_unicode_ci`)
   *   .execute()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * create table `person` (
   *   `id` integer primary key,
   *   `first_name` varchar(64) not null,
   *   `last_name` varchar(64) not null
   * ) collate utf8_unicode_ci
   * ```
   */
  modifyEnd(modifier: Expression<any>): CreateTableBuilder<TB, C> {
    return new CreateTableBuilder({
      ...this.#props,
      node: CreateTableNode.cloneWithEndModifier(
        this.#props.node,
        modifier.toOperationNode()
      ),
    })
  }

  /**
   * Calls the given function passing `this` as the only argument.
   *
   * ### Examples
   *
   * ```ts
   * db.schema
   *   .createTable('test')
   *   .$call((builder) => builder.addColumn('id', 'integer'))
   *   .execute()
   * ```
   *
   * ```ts
   * const addDefaultColumns = <T extends string, C extends string = never>(
   *   builder: CreateTableBuilder<T, C>
   * ) => {
   *   return builder
   *     .addColumn('id', 'integer', (col) => col.notNull())
   *     .addColumn('created_at', 'date', (col) =>
   *       col.notNull().defaultTo(sql`now()`)
   *     )
   *     .addColumn('updated_at', 'date', (col) =>
   *       col.notNull().defaultTo(sql`now()`)
   *     )
   * }
   *
   * db.schema
   *   .createTable('test')
   *   .$call(addDefaultColumns)
   *   .execute()
   * ```
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  toOperationNode(): CreateTableNode {
    return this.#props.executor.transformQuery(
      this.#props.node,
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
  readonly node: CreateTableNode
}

export type ColumnBuilderCallback = (
  builder: ColumnDefinitionBuilder
) => ColumnDefinitionBuilder

export type ForeignKeyConstraintBuilderCallback = (
  builder: ForeignKeyConstraintBuilder
) => ForeignKeyConstraintBuilder
