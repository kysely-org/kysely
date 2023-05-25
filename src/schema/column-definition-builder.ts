import { CheckConstraintNode } from '../operation-node/check-constraint-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { ReferenceNode } from '../operation-node/reference-node.js'
import {
  OnModifyForeignAction,
  ReferencesNode,
} from '../operation-node/references-node.js'
import { SelectAllNode } from '../operation-node/select-all-node.js'
import { parseStringReference } from '../parser/reference-parser.js'
import { preventAwait } from '../util/prevent-await.js'
import { ColumnDefinitionNode } from '../operation-node/column-definition-node.js'
import {
  DefaultValueExpression,
  parseDefaultValueExpression,
} from '../parser/default-value-parser.js'
import { GeneratedNode } from '../operation-node/generated-node.js'
import { DefaultValueNode } from '../operation-node/default-value-node.js'
import { parseOnModifyForeignAction } from '../parser/on-modify-action-parser.js'
import { Expression } from '../expression/expression.js'

export class ColumnDefinitionBuilder implements OperationNodeSource {
  readonly #node: ColumnDefinitionNode

  constructor(node: ColumnDefinitionNode) {
    this.#node = node
  }

  /**
   * Adds `auto_increment` or `autoincrement` to the column definition
   * depending on the dialect.
   *
   * Some dialects like PostgreSQL don't support this. On PostgreSQL
   * you can use the `serial` or `bigserial` data type instead.
   */
  autoIncrement(): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, { autoIncrement: true })
    )
  }

  /**
   * Makes the column the primary key.
   *
   * If you want to specify a composite primary key use the
   * {@link CreateTableBuilder.addPrimaryKeyConstraint} method.
   */
  primaryKey(): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, { primaryKey: true })
    )
  }

  /**
   * Adds a foreign key constraint for the column.
   *
   * If your database engine doesn't support foreign key constraints in the
   * column definition (like MySQL 5) you need to call the table level
   * {@link CreateTableBuilder.addForeignKeyConstraint} method instead.
   *
   * ### Examples
   *
   * ```ts
   * col.references('person.id')
   * ```
   */
  references(ref: string): ColumnDefinitionBuilder {
    const references = parseStringReference(ref)

    if (!references.table || SelectAllNode.is(references.column)) {
      throw new Error(
        `invalid call references('${ref}'). The reference must have format table.column or schema.table.column`
      )
    }

    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        references: ReferencesNode.create(references.table, [
          references.column,
        ]),
      })
    )
  }

  /**
   * Adds an `on delete` constraint for the foreign key column.
   *
   * If your database engine doesn't support foreign key constraints in the
   * column definition (like MySQL 5) you need to call the table level
   * {@link CreateTableBuilder.addForeignKeyConstraint} method instead.
   *
   * ### Examples
   *
   * ```ts
   * col.references('person.id').onDelete('cascade')
   * ```
   */
  onDelete(onDelete: OnModifyForeignAction): ColumnDefinitionBuilder {
    if (!this.#node.references) {
      throw new Error('on delete constraint can only be added for foreign keys')
    }

    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        references: ReferencesNode.cloneWithOnDelete(
          this.#node.references,
          parseOnModifyForeignAction(onDelete)
        ),
      })
    )
  }

  /**
   * Adds an `on update` constraint for the foreign key column.
   *
   * ### Examples
   *
   * ```ts
   * col.references('person.id').onUpdate('cascade')
   * ```
   */
  onUpdate(onUpdate: OnModifyForeignAction): ColumnDefinitionBuilder {
    if (!this.#node.references) {
      throw new Error('on update constraint can only be added for foreign keys')
    }

    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        references: ReferencesNode.cloneWithOnUpdate(
          this.#node.references,
          parseOnModifyForeignAction(onUpdate)
        ),
      })
    )
  }

  /**
   * Adds a unique constraint for the column.
   */
  unique(): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, { unique: true })
    )
  }

  /**
   * Adds a `not null` constraint for the column.
   */
  notNull(): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, { notNull: true })
    )
  }

  /**
   * Adds a `unsigned` modifier for the column.
   *
   * This only works on some dialects like MySQL.
   */
  unsigned(): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, { unsigned: true })
    )
  }

  /**
   * Adds a default value constraint for the column.
   *
   * ### Examples
   *
   * ```ts
   * db.schema
   *   .createTable('pet')
   *   .addColumn('number_of_legs', 'integer', (col) => col.defaultTo(4))
   *   .execute()
   * ```
   *
   * Values passed to `defaultTo` are interpreted as value literals by default. You can define
   * an arbitrary SQL expression using the {@link sql} template tag:
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * db.schema
   *   .createTable('pet')
   *   .addColumn(
   *     'number_of_legs',
   *     'integer',
   *     (col) => col.defaultTo(sql`any SQL here`)
   *   )
   *   .execute()
   * ```
   */
  defaultTo(value: DefaultValueExpression): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        defaultTo: DefaultValueNode.create(parseDefaultValueExpression(value)),
      })
    )
  }

  /**
   * Adds a check constraint for the column.
   *
   * ### Examples
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * db.schema
   *   .createTable('pet')
   *   .addColumn('number_of_legs', 'integer', (col) =>
   *     col.check(sql`number_of_legs < 5`)
   *   )
   *   .execute()
   * ```
   */
  check(expression: Expression<any>): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        check: CheckConstraintNode.create(expression.toOperationNode()),
      })
    )
  }

  /**
   * Makes the column a generated column using a `generated always as` statement.
   *
   * ### Examples
   *
   * ```ts
   * import { sql } from 'kysely'
   *
   * db.schema
   *   .createTable('person')
   *   .addColumn('full_name', 'varchar(255)',
   *     (col) => col.generatedAlwaysAs(sql`concat(first_name, ' ', last_name)`)
   *   )
   *   .execute()
   * ```
   */
  generatedAlwaysAs(expression: Expression<any>): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        generated: GeneratedNode.createWithExpression(
          expression.toOperationNode()
        ),
      })
    )
  }

  /**
   * Adds the `generated always as identity` specifier on supported dialects.
   */
  generatedAlwaysAsIdentity(): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        generated: GeneratedNode.create({ identity: true, always: true }),
      })
    )
  }

  /**
   * Adds the `generated by default as identity` specifier on supported dialects.
   */
  generatedByDefaultAsIdentity(): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        generated: GeneratedNode.create({ identity: true, byDefault: true }),
      })
    )
  }

  /**
   * Makes a generated column stored instead of virtual. This method can only
   * be used with {@link generatedAlwaysAs}
   *
   * ### Examples
   *
   * ```ts
   * db.schema
   *   .createTable('person')
   *   .addColumn('full_name', 'varchar(255)', (col) => col
   *     .generatedAlwaysAs("concat(first_name, ' ', last_name)")
   *     .stored()
   *   )
   *   .execute()
   * ```
   */
  stored(): ColumnDefinitionBuilder {
    if (!this.#node.generated) {
      throw new Error('stored() can only be called after generatedAlwaysAs')
    }

    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        generated: GeneratedNode.cloneWith(this.#node.generated, {
          stored: true,
        }),
      })
    )
  }

  /**
   * This can be used to add any additional SQL right after the column's data type.
   *
   * ### Examples
   *
   * ```ts
   * db.schema.createTable('person')
   *  .addColumn('id', 'integer', col => col.primaryKey())
   *  .addColumn('first_name', 'varchar(36)', col => col.modifyFront(sql`collate utf8mb4_general_ci`).notNull())
   *  .execute()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * create table `person` (
   *   `id` integer primary key,
   *   `first_name` varchar(36) collate utf8mb4_general_ci not null
   * )
   * ```
   */
  modifyFront(modifier: Expression<any>): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWithFrontModifier(
        this.#node,
        modifier.toOperationNode()
      )
    )
  }

  /**
   * This can be used to add any additional SQL to the end of the column definition.
   *
   * ### Examples
   *
   * ```ts
   * db.schema.createTable('person')
   *  .addColumn('id', 'integer', col => col.primaryKey())
   *  .addColumn('age', 'integer', col => col.unsigned().notNull().modifyEnd(sql`comment ${sql.lit('it is not polite to ask a woman her age')}`))
   *  .execute()
   * ```
   *
   * The generated SQL (MySQL):
   *
   * ```sql
   * create table `person` (
   *   `id` integer primary key,
   *   `age` integer unsigned not null comment 'it is not polite to ask a woman her age'
   * )
   * ```
   */
  modifyEnd(modifier: Expression<any>): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWithEndModifier(
        this.#node,
        modifier.toOperationNode()
      )
    )
  }

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  toOperationNode(): ColumnDefinitionNode {
    return this.#node
  }
}

preventAwait(
  ColumnDefinitionBuilder,
  "don't await ColumnDefinitionBuilder instances directly."
)

export type ColumnDefinitionBuilderCallback = (
  builder: ColumnDefinitionBuilder
) => ColumnDefinitionBuilder
