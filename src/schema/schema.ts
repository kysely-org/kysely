import { AlterTableNode } from '../operation-node/alter-table-node.js'
import { CreateIndexNode } from '../operation-node/create-index-node.js'
import { CreateSchemaNode } from '../operation-node/create-schema-node.js'
import { CreateTableNode } from '../operation-node/create-table-node.js'
import { DropIndexNode } from '../operation-node/drop-index-node.js'
import { DropSchemaNode } from '../operation-node/drop-schema-node.js'
import { DropTableNode } from '../operation-node/drop-table-node.js'
import { parseTable } from '../parser/table-parser.js'
import { QueryExecutor } from '../query-executor/query-executor.js'
import { AlterTableBuilder } from './alter-table-builder.js'
import { CreateIndexBuilder } from './create-index-builder.js'
import { CreateSchemaBuilder } from './create-schema-builder.js'
import { CreateTableBuilder } from './create-table-builder.js'
import { DropIndexBuilder } from './drop-index-builder.js'
import { DropSchemaBuilder } from './drop-schema-builder.js'
import { DropTableBuilder } from './drop-table-builder.js'
import { createQueryId } from '../util/query-id.js'
import { WithSchemaPlugin } from '../plugin/with-schema/with-schema-plugin.js'
import { CreateViewBuilder } from './create-view-builder.js'
import { CreateViewNode } from '../operation-node/create-view-node.js'
import { DropViewBuilder } from './drop-view-builder.js'
import { DropViewNode } from '../operation-node/drop-view-node.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { CreateTypeBuilder } from './create-type-builder.js'
import { DropTypeBuilder } from './drop-type-builder.js'
import { CreateTypeNode } from '../operation-node/create-type-node.js'
import { DropTypeNode } from '../operation-node/drop-type-node.js'
import { parseSchemableIdentifier } from '../parser/identifier-parser.js'

/**
 * Provides methods for building database schema.
 */
export class SchemaModule {
  readonly #executor: QueryExecutor

  constructor(executor: QueryExecutor) {
    this.#executor = executor
  }

  /**
   * Create a new table.
   *
   * ### Examples
   *
   * This example creates a new table with columns `id`, `first_name`,
   * `last_name` and `gender`:
   *
   * ```ts
   * await db.schema
   *   .createTable('person')
   *   .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
   *   .addColumn('first_name', 'varchar', col => col.notNull())
   *   .addColumn('last_name', 'varchar', col => col.notNull())
   *   .addColumn('gender', 'varchar')
   *   .execute()
   * ```
   *
   * This example creates a table with a foreign key. Not all database
   * engines support column-level foreign key constraint definitions.
   * For example if you are using MySQL 5.X see the next example after
   * this one.
   *
   * ```ts
   * await db.schema
   *   .createTable('pet')
   *   .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
   *   .addColumn('owner_id', 'integer', col => col
   *     .references('person.id')
   *     .onDelete('cascade')
   *   )
   *   .execute()
   * ```
   *
   * This example adds a foreign key constraint for a columns just
   * like the previous example, but using a table-level statement.
   * On MySQL 5.X you need to define foreign key constraints like
   * this:
   *
   * ```ts
   * await db.schema
   *   .createTable('pet')
   *   .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
   *   .addColumn('owner_id', 'integer')
   *   .addForeignKeyConstraint(
   *     'pet_owner_id_foreign', ['owner_id'], 'person', ['id'],
   *     (constraint) => constraint.onDelete('cascade')
   *   )
   *   .execute()
   * ```
   */
  createTable<TB extends string>(table: TB): CreateTableBuilder<TB, never> {
    return new CreateTableBuilder({
      queryId: createQueryId(),
      executor: this.#executor,
      node: CreateTableNode.create(parseTable(table)),
    })
  }

  /**
   * Drop a table.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .dropTable('person')
   *   .execute()
   * ```
   */
  dropTable(table: string): DropTableBuilder {
    return new DropTableBuilder({
      queryId: createQueryId(),
      executor: this.#executor,
      node: DropTableNode.create(parseTable(table)),
    })
  }

  /**
   * Create a new index.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .createIndex('person_full_name_unique_index')
   *   .on('person')
   *   .columns(['first_name', 'last_name'])
   *   .execute()
   * ```
   */
  createIndex(indexName: string): CreateIndexBuilder {
    return new CreateIndexBuilder({
      queryId: createQueryId(),
      executor: this.#executor,
      node: CreateIndexNode.create(indexName),
    })
  }

  /**
   * Drop an index.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .dropIndex('person_full_name_unique_index')
   *   .execute()
   * ```
   */
  dropIndex(indexName: string): DropIndexBuilder {
    return new DropIndexBuilder({
      queryId: createQueryId(),
      executor: this.#executor,
      node: DropIndexNode.create(indexName),
    })
  }

  /**
   * Create a new schema.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .createSchema('some_schema')
   *   .execute()
   * ```
   */
  createSchema(schema: string): CreateSchemaBuilder {
    return new CreateSchemaBuilder({
      queryId: createQueryId(),
      executor: this.#executor,
      node: CreateSchemaNode.create(schema),
    })
  }

  /**
   * Drop a schema.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .dropSchema('some_schema')
   *   .execute()
   * ```
   */
  dropSchema(schema: string): DropSchemaBuilder {
    return new DropSchemaBuilder({
      queryId: createQueryId(),
      executor: this.#executor,
      node: DropSchemaNode.create(schema),
    })
  }

  /**
   * Alter a table.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .alterTable('person')
   *   .alterColumn('first_name', (ac) => ac.setDataType('text'))
   *   .execute()
   * ```
   */
  alterTable(table: string): AlterTableBuilder {
    return new AlterTableBuilder({
      queryId: createQueryId(),
      executor: this.#executor,
      node: AlterTableNode.create(parseTable(table)),
    })
  }

  /**
   * Create a new view.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .createView('dogs')
   *   .orReplace()
   *   .as(db.selectFrom('pet').selectAll().where('species', '=', 'dog'))
   *   .execute()
   * ```
   */
  createView(viewName: string): CreateViewBuilder {
    return new CreateViewBuilder({
      queryId: createQueryId(),
      executor: this.#executor,
      node: CreateViewNode.create(viewName),
    })
  }

  /**
   * Drop a view.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .dropView('dogs')
   *   .ifExists()
   *   .execute()
   * ```
   */
  dropView(viewName: string): DropViewBuilder {
    return new DropViewBuilder({
      queryId: createQueryId(),
      executor: this.#executor,
      node: DropViewNode.create(viewName),
    })
  }

  /**
   * Create a new type.
   *
   * Only some dialects like PostgreSQL have user-defined types.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .createType('species')
   *   .asEnum(['dog', 'cat', 'frog'])
   *   .execute()
   * ```
   */
  createType(typeName: string): CreateTypeBuilder {
    return new CreateTypeBuilder({
      queryId: createQueryId(),
      executor: this.#executor,
      node: CreateTypeNode.create(parseSchemableIdentifier(typeName)),
    })
  }

  /**
   * Drop a type.
   *
   * Only some dialects like PostgreSQL have user-defined types.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .dropType('species')
   *   .ifExists()
   *   .execute()
   * ```
   */
  dropType(typeName: string): DropTypeBuilder {
    return new DropTypeBuilder({
      queryId: createQueryId(),
      executor: this.#executor,
      node: DropTypeNode.create(parseSchemableIdentifier(typeName)),
    })
  }

  /**
   * Returns a copy of this schema module with the given plugin installed.
   */
  withPlugin(plugin: KyselyPlugin): SchemaModule {
    return new SchemaModule(this.#executor.withPlugin(plugin))
  }

  /**
   * Returns a copy of this schema module  without any plugins.
   */
  withoutPlugins(): SchemaModule {
    return new SchemaModule(this.#executor.withoutPlugins())
  }

  /**
   * See {@link QueryCreator.withSchema}
   */
  withSchema(schema: string): SchemaModule {
    return new SchemaModule(
      this.#executor.withPluginAtFront(new WithSchemaPlugin(schema))
    )
  }
}
