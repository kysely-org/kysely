import { CheckConstraintNode } from '../operation-node/check-constraint-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { ReferenceNode } from '../operation-node/reference-node.js'
import {
  OnModifyForeignAction,
  ReferencesNode,
} from '../operation-node/references-node.js'
import { SelectAllNode } from '../operation-node/select-all-node.js'
import { parseStringReference } from '../parser/reference-parser.js'
import { PrimitiveValue } from '../util/object-utils.js'
import { preventAwait } from '../util/prevent-await.js'
import { ColumnDefinitionNode } from '../operation-node/column-definition-node.js'
import { AnyRawBuilder } from '../util/type-utils.js'
import {
  DefaultValueExpression,
  parseDefaultValueExpression,
} from '../parser/default-value-parser.js'
import { GeneratedAlwaysAsNode } from '../operation-node/generated-always-as-node.js'
import { DefaultValueNode } from '../operation-node/default-value-node.js'

export interface ColumnDefinitionBuilderInterface<R> {
  /**
   * Adds `auto_increment` or `autoincrement` to the column definition
   * depending on the dialect.
   *
   * Some dialects like PostgreSQL don't support this. On PostgreSQL
   * you can use the `serial` or `bigserial` data type instead.
   */
  autoIncrement(): R

  /**
   * Makes the column the primary key.
   *
   * If you want to specify a composite primary key use the
   * {@link TableBuilder.addPrimaryKeyConstraint} method.
   */
  primaryKey(): R

  /**
   * Adds a foreign key constraint for the column.
   *
   * If your database engine doesn't support foreign key constraints in the
   * column definition (like MySQL 5) you need to call the table level
   * {@link TableBuilder.addForeignKeyConstraint} method instead.
   *
   * @example
   * ```ts
   * col.references('person.id')
   * ```
   */
  references(ref: string): R

  /**
   * Adds an `on delete` constraint for the foreign key column.
   *
   * If your database engine doesn't support foreign key constraints in the
   * column definition (like MySQL 5) you need to call the table level
   * {@link TableBuilder.addForeignKeyConstraint} method instead.
   *
   * @example
   * ```ts
   * col.references('person.id').onDelete('cascade')
   * ```
   */
  onDelete(onDelete: OnModifyForeignAction): R

  /**
   * Adds an `on update` constraint for the foreign key column.
   *
   * @example
   * ```ts
   * col.references('person.id').onUpdate('cascade')
   * ```
   */
  onUpdate(onUpdate: OnModifyForeignAction): R

  /**
   * Adds a unique constraint for the column.
   */
  unique(): R

  /**
   * Adds a `not null` constraint for the column.
   */
  notNull(): R

  /**
   * Adds a default value constraint for the column.
   *
   * @example
   * ```ts
   * db.schema
   *   .createTable('pet')
   *   .addColumn('number_of_legs', 'integer', (col) => col.defaultTo(4))
   *   .execute()
   * ```
   */
  defaultTo(value: PrimitiveValue | AnyRawBuilder): R

  /**
   * Adds a check constraint for the column.
   *
   * @example
   * ```ts
   * db.schema
   *   .createTable('pet')
   *   .addColumn('number_of_legs', 'integer', (col) => col.check('number_of_legs < 5'))
   *   .execute()
   * ```
   */
  check(sql: string): R

  /**
   * Makes the column a generated column using a `generated always as` statement.
   *
   * @example
   * ```ts
   * db.schema
   *   .createTable('person')
   *   .addColumn('full_name', 'varchar(255)',
   *     (col) => col.generatedAlwaysAs("concat(first_name, ' ', last_name)")
   *   )
   *   .execute()
   * ```
   */
  generatedAlwaysAs(sql: string): R

  /**
   * Makes a generated column stored instead of virtual. This method can only
   * be used with {@link generatedAlwaysAs}
   *
   * @example
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
  stored(): R
}

export class ColumnDefinitionBuilder
  implements
    ColumnDefinitionBuilderInterface<ColumnDefinitionBuilder>,
    OperationNodeSource
{
  readonly #node: ColumnDefinitionNode

  constructor(node: ColumnDefinitionNode) {
    this.#node = node
  }

  autoIncrement(): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, { autoIncrement: true })
    )
  }

  primaryKey(): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, { primaryKey: true })
    )
  }

  references(ref: string): ColumnDefinitionBuilder {
    const references = parseStringReference(ref)

    if (!ReferenceNode.is(references) || SelectAllNode.is(references.column)) {
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

  onDelete(onDelete: OnModifyForeignAction): ColumnDefinitionBuilder {
    if (!this.#node.references) {
      throw new Error('on delete constraint can only be added for foreign keys')
    }

    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        references: ReferencesNode.cloneWithOnDelete(
          this.#node.references,
          onDelete
        ),
      })
    )
  }

  onUpdate(onUpdate: OnModifyForeignAction): ColumnDefinitionBuilder {
    if (!this.#node.references) {
      throw new Error('on update constraint can only be added for foreign keys')
    }

    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        references: ReferencesNode.cloneWithOnUpdate(
          this.#node.references,
          onUpdate
        ),
      })
    )
  }

  unique(): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, { unique: true })
    )
  }

  notNull(): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, { nullable: false })
    )
  }

  defaultTo(value: DefaultValueExpression): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        defaultTo: DefaultValueNode.create(parseDefaultValueExpression(value)),
      })
    )
  }

  check(sql: string): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        check: CheckConstraintNode.create(sql),
      })
    )
  }

  generatedAlwaysAs(sql: string): ColumnDefinitionBuilder {
    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        generatedAlwaysAs: GeneratedAlwaysAsNode.create(sql),
      })
    )
  }

  stored(): ColumnDefinitionBuilder {
    if (!this.#node.generatedAlwaysAs) {
      throw new Error('stored() can only be called after generatedAlwaysAs')
    }

    return new ColumnDefinitionBuilder(
      ColumnDefinitionNode.cloneWith(this.#node, {
        generatedAlwaysAs: GeneratedAlwaysAsNode.cloneWith(
          this.#node.generatedAlwaysAs,
          {
            stored: true,
          }
        ),
      })
    )
  }

  toOperationNode(): ColumnDefinitionNode {
    return this.#node
  }
}

preventAwait(
  ColumnDefinitionBuilder,
  "don't await ColumnDefinitionBuilder instances directly."
)
