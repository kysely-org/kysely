import { ColumnDefinitionNode } from '../operation-node/column-definition-node.js'
import {
  CreateTableNode,
  OnCommitAction,
} from '../operation-node/create-table-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { Compilable } from '../util/compilable.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { ColumnDefinitionBuilder } from './column-definition-builder.js'
import { QueryId } from '../util/query-id.js'
import { freeze, isString, noop } from '../util/object-utils.js'
import { ForeignKeyConstraintNode } from '../operation-node/foreign-key-constraint-node.js'
import { ColumnNode } from '../operation-node/column-node.js'
import {
  ForeignKeyConstraintBuilder,
  ForeignKeyConstraintBuilderCallback,
} from './foreign-key-constraint-builder.js'
import {
  DataTypeExpression,
  parseDataTypeExpression,
} from '../parser/data-type-parser.js'
import { PrimaryKeyConstraintNode } from '../operation-node/primary-key-constraint-node.js'
import { UniqueConstraintNode } from '../operation-node/unique-constraint-node.js'
import { CheckConstraintNode } from '../operation-node/check-constraint-node.js'
import { parseTable } from '../parser/table-parser.js'
import { parseOnCommitAction } from '../parser/on-commit-action-parse.js'
import { Expression } from '../expression/expression.js'
import {
  UniqueConstraintNodeBuilder,
  UniqueConstraintNodeBuilderCallback,
} from './unique-constraint-builder.js'
import {
  ExpressionOrFactory,
  parseExpression,
} from '../parser/expression-parser.js'
import {
  PrimaryKeyConstraintBuilder,
  PrimaryKeyConstraintBuilderCallback,
} from './primary-key-constraint-builder.js'
import {
  CheckConstraintBuilder,
  CheckConstraintBuilderCallback,
} from './check-constraint-builder.js'
import { AddIndexNode } from '../operation-node/add-index-node.js'
import {
  CreateTableAddIndexBuilder,
  CreateTableAddIndexBuilderCallback,
} from './create-table-add-index-builder.js'

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
   *   .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
   *   .addColumn('first_name', 'varchar(50)', (col) => col.notNull())
   *   .addColumn('last_name', 'varchar(255)')
   *   .addColumn('bank_balance', 'numeric(8, 2)')
   *   // You can specify any data type using the `sql` tag if the types
   *   // don't include it.
   *   .addColumn('data', sql`any_type_here`)
   *   .addColumn('parent_id', 'integer', (col) =>
   *     col.references('person.id').onDelete('cascade')
   *   )
   * ```
   *
   * With this method, it's once again good to remember that Kysely just builds the
   * query and doesn't provide the same API for all databases. For example, some
   * databases like older MySQL don't support the `references` statement in the
   * column definition. Instead foreign key constraints need to be defined in the
   * `create table` query. See the next example:
   *
   * ```ts
   * await db.schema
   *   .createTable('person')
   *   .addColumn('id', 'integer', (col) => col.primaryKey())
   *   .addColumn('parent_id', 'integer')
   *   .addForeignKeyConstraint(
   *     'person_parent_id_fk',
   *     ['parent_id'],
   *     'person',
   *     ['id'],
   *     (cb) => cb.onDelete('cascade')
   *   )
   *   .execute()
   * ```
   *
   * Another good example is that PostgreSQL doesn't support the `auto_increment`
   * keyword and you need to define an autoincrementing column for example using
   * `serial`:
   *
   * ```ts
   * await db.schema
   *   .createTable('person')
   *   .addColumn('id', 'serial', (col) => col.primaryKey())
   *   .execute()
   * ```
   */
  addColumn<CN extends string>(
    columnName: CN,
    dataType: DataTypeExpression,
    build: ColumnBuilderCallback = noop,
  ): CreateTableBuilder<TB, C | CN> {
    const columnBuilder = build(
      new ColumnDefinitionBuilder(
        ColumnDefinitionNode.create(
          columnName,
          parseDataTypeExpression(dataType),
        ),
      ),
    )

    return new CreateTableBuilder({
      ...this.#props,
      node: CreateTableNode.cloneWithColumn(
        this.#props.node,
        columnBuilder.toOperationNode(),
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
   * await db.schema
   *   .createTable('person')
   *   .addColumn('first_name', 'varchar(64)')
   *   .addColumn('last_name', 'varchar(64)')
   *   .addPrimaryKeyConstraint('primary_key', ['first_name', 'last_name'])
   *   .execute()
   * ```
   */
  addPrimaryKeyConstraint(
    constraintName: string,
    columns: C[],
    build: PrimaryKeyConstraintBuilderCallback = noop,
  ): CreateTableBuilder<TB, C> {
    const constraintBuilder = build(
      new PrimaryKeyConstraintBuilder(
        PrimaryKeyConstraintNode.create(columns, constraintName),
      ),
    )

    return new CreateTableBuilder({
      ...this.#props,
      node: CreateTableNode.cloneWithConstraint(
        this.#props.node,
        constraintBuilder.toOperationNode(),
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
   * await db.schema
   *   .createTable('person')
   *   .addColumn('first_name', 'varchar(64)')
   *   .addColumn('last_name', 'varchar(64)')
   *   .addUniqueConstraint(
   *     'first_name_last_name_unique',
   *     ['first_name', 'last_name']
   *   )
   *   .execute()
   * ```
   *
   * In dialects such as PostgreSQL you can specify `nulls not distinct` as follows:
   *
   * ```ts
   * await db.schema
   *   .createTable('person')
   *   .addColumn('first_name', 'varchar(64)')
   *   .addColumn('last_name', 'varchar(64)')
   *   .addUniqueConstraint(
   *     'first_name_last_name_unique',
   *     ['first_name', 'last_name'],
   *     (cb) => cb.nullsNotDistinct()
   *   )
   *   .execute()
   * ```
   *
   * In dialects such as MySQL you create unique constraints on expressions as follows:
   *
   * ```ts
   *
   * import { sql } from 'kysely'
   *
   * await db.schema
   *   .createTable('person')
   *   .addColumn('first_name', 'varchar(64)')
   *   .addColumn('last_name', 'varchar(64)')
   *   .addUniqueConstraint(
   *     'first_name_last_name_unique',
   *     [sql`(lower('first_name'))`, 'last_name']
   *   )
   *   .execute()
   * ```
   */
  addUniqueConstraint(
    constraintName: string,
    columns: (C | ExpressionOrFactory<any, any, any>)[],
    build: UniqueConstraintNodeBuilderCallback = noop,
  ): CreateTableBuilder<TB, C> {
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

    return new CreateTableBuilder({
      ...this.#props,
      node: CreateTableNode.cloneWithConstraint(
        this.#props.node,
        uniqueConstraintBuilder.toOperationNode(),
      ),
    })
  }

  /**
   * Adds an index that includes one or more columns.
   *
   * This is only supported by some dialects like MySQL.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .createTable('person')
   *   .addColumn('first_name', 'varchar(64)')
   *   .addColumn('last_name', 'varchar(64)')
   *   .addIndex('last_name_key', ['last_name'])
   *   .execute()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * create table `person` (
   *   `id` integer primary key,
   *   `first_name` varchar(64) not null,
   *   `last_name` varchar(64) not null,
   *   index `last_name_key` (`last_name`)
   * )
   * ```
   */
  addIndex(
    indexName: string,
    columns: (C | ExpressionOrFactory<any, any, any>)[],
    build: CreateTableAddIndexBuilderCallback = noop,
  ): CreateTableBuilder<TB, C> {
    const addIndexBuilder = build(
      new CreateTableAddIndexBuilder(
        AddIndexNode.cloneWithColumns(
          AddIndexNode.create(indexName),
          columns.map((column) =>
            isString(column)
              ? ColumnNode.create(column)
              : parseExpression(column),
          ),
        ),
      ),
    )

    return new CreateTableBuilder({
      ...this.#props,
      node: CreateTableNode.cloneWithIndex(
        this.#props.node,
        addIndexBuilder.toOperationNode(),
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
   * await db.schema
   *   .createTable('animal')
   *   .addColumn('number_of_legs', 'integer')
   *   .addCheckConstraint('check_legs', sql`number_of_legs < 5`)
   *   .execute()
   * ```
   */
  addCheckConstraint(
    constraintName: string,
    checkExpression: Expression<any>,
    build: CheckConstraintBuilderCallback = noop,
  ): CreateTableBuilder<TB, C> {
    const constraintBuilder = build(
      new CheckConstraintBuilder(
        CheckConstraintNode.create(
          checkExpression.toOperationNode(),
          constraintName,
        ),
      ),
    )

    return new CreateTableBuilder({
      ...this.#props,
      node: CreateTableNode.cloneWithConstraint(
        this.#props.node,
        constraintBuilder.toOperationNode(),
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
   * await db.schema
   *   .createTable('pet')
   *   .addColumn('owner_id', 'integer')
   *   .addForeignKeyConstraint(
   *     'owner_id_foreign',
   *     ['owner_id'],
   *     'person',
   *     ['id'],
   *   )
   *   .execute()
   * ```
   *
   * Add constraint for multiple columns:
   *
   * ```ts
   * await db.schema
   *   .createTable('pet')
   *   .addColumn('owner_id1', 'integer')
   *   .addColumn('owner_id2', 'integer')
   *   .addForeignKeyConstraint(
   *     'owner_id_foreign',
   *     ['owner_id1', 'owner_id2'],
   *     'person',
   *     ['id1', 'id2'],
   *     (cb) => cb.onDelete('cascade')
   *   )
   *   .execute()
   * ```
   */
  addForeignKeyConstraint(
    constraintName: string,
    columns: C[],
    targetTable: string,
    targetColumns: string[],
    build: ForeignKeyConstraintBuilderCallback = noop,
  ): CreateTableBuilder<TB, C> {
    const builder = build(
      new ForeignKeyConstraintBuilder(
        ForeignKeyConstraintNode.create(
          columns.map(ColumnNode.create),
          parseTable(targetTable),
          targetColumns.map(ColumnNode.create),
          constraintName,
        ),
      ),
    )

    return new CreateTableBuilder({
      ...this.#props,
      node: CreateTableNode.cloneWithConstraint(
        this.#props.node,
        builder.toOperationNode(),
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
   * import { sql } from 'kysely'
   *
   * await db.schema
   *   .createTable('person')
   *   .modifyFront(sql`global temporary`)
   *   .addColumn('id', 'integer', col => col.primaryKey())
   *   .addColumn('first_name', 'varchar(64)', col => col.notNull())
   *   .addColumn('last_name', 'varchar(64)', col => col.notNull())
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
        modifier.toOperationNode(),
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
   * import { sql } from 'kysely'
   *
   * await db.schema
   *   .createTable('person')
   *   .addColumn('id', 'integer', col => col.primaryKey())
   *   .addColumn('first_name', 'varchar(64)', col => col.notNull())
   *   .addColumn('last_name', 'varchar(64)', col => col.notNull())
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
        modifier.toOperationNode(),
      ),
    })
  }

  /**
   * Allows to create table from `select` query.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .createTable('copy')
   *   .temporary()
   *   .as(db.selectFrom('person').select(['first_name', 'last_name']))
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * create temporary table "copy" as
   * select "first_name", "last_name" from "person"
   * ```
   */
  as(expression: Expression<unknown>): CreateTableBuilder<TB, C> {
    return new CreateTableBuilder({
      ...this.#props,
      node: CreateTableNode.cloneWith(this.#props.node, {
        selectQuery: parseExpression(expression),
      }),
    })
  }

  /**
   * Calls the given function passing `this` as the only argument.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .createTable('test')
   *   .$call((builder) => builder.addColumn('id', 'integer'))
   *   .execute()
   * ```
   *
   * This is useful for creating reusable functions that can be called with a builder.
   *
   * ```ts
   * import { type CreateTableBuilder, sql } from 'kysely'
   *
   * const addDefaultColumns = (ctb: CreateTableBuilder<any, any>) => {
   *   return ctb
   *     .addColumn('id', 'integer', (col) => col.notNull())
   *     .addColumn('created_at', 'date', (col) =>
   *       col.notNull().defaultTo(sql`now()`)
   *     )
   *     .addColumn('updated_at', 'date', (col) =>
   *       col.notNull().defaultTo(sql`now()`)
   *     )
   * }
   *
   * await db.schema
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

export interface CreateTableBuilderProps {
  readonly queryId: QueryId
  readonly executor: QueryExecutor
  readonly node: CreateTableNode
}

export type ColumnBuilderCallback = (
  builder: ColumnDefinitionBuilder,
) => ColumnDefinitionBuilder
