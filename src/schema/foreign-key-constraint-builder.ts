import { ForeignKeyConstraintNode } from '../operation-node/foreign-key-constraint-node.js'
import type { OperationNodeSource } from '../operation-node/operation-node-source.js'
import type { OnModifyForeignAction } from '../operation-node/references-node.js'
import { parseOnModifyForeignAction } from '../parser/on-modify-action-parser.js'

export interface ForeignKeyConstraintBuilderInterface<R> {
  /**
   * Sets the action taken when a referenced row is deleted.
   *
   * For example, `cascade` deletes referencing rows, while `set null` sets the
   * referencing columns to null. `set null` requires nullable columns.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .createTable('pet')
   *   .addColumn('owner_id', 'integer')
   *   .addForeignKeyConstraint(
   *     'pet_owner_id_foreign',
   *     ['owner_id'],
   *     'person',
   *     ['id'],
   *     (fk) => fk.onDelete('cascade'),
   *   )
   *   .execute()
   * ```
   */
  onDelete(onDelete: OnModifyForeignAction): R

  /**
   * Sets the action taken when a referenced key is updated.
   *
   * For example, `cascade` updates the referencing columns to the new key value.
   * See {@link onDelete} for a constraint example.
   */
  onUpdate(onUpdate: OnModifyForeignAction): R

  /**
   * Allows checking the constraint to be deferred until the transaction commits.
   *
   * Supported by PostgreSQL and SQLite for foreign keys. Use
   * {@link initiallyDeferred} to defer checks by default. Otherwise checks are
   * initially immediate. MySQL and MSSQL don't support this modifier.
   */
  deferrable(): R

  /**
   * Prevents deferring constraint checks. This is the default.
   *
   * Supported by PostgreSQL and SQLite for foreign keys.
   */
  notDeferrable(): R

  /**
   * Checks the constraint at transaction commit by default.
   *
   * Use with {@link deferrable}. Supported by PostgreSQL and SQLite for foreign keys.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .createTable('pet')
   *   .addColumn('owner_id', 'integer')
   *   .addForeignKeyConstraint(
   *     'pet_owner_id_foreign',
   *     ['owner_id'],
   *     'person',
   *     ['id'],
   *     (fk) => fk.deferrable().initiallyDeferred(),
   *   )
   *   .execute()
   * ```
   */
  initiallyDeferred(): R

  /**
   * Checks the constraint after each statement by default.
   *
   * A {@link deferrable} constraint can still be deferred within a transaction.
   * Supported by PostgreSQL and SQLite for foreign keys.
   */
  initiallyImmediate(): R
}

export class ForeignKeyConstraintBuilder
  implements
    ForeignKeyConstraintBuilderInterface<ForeignKeyConstraintBuilder>,
    OperationNodeSource
{
  readonly #node: ForeignKeyConstraintNode

  constructor(node: ForeignKeyConstraintNode) {
    this.#node = node
  }

  onDelete(onDelete: OnModifyForeignAction): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder(
      ForeignKeyConstraintNode.cloneWith(this.#node, {
        onDelete: parseOnModifyForeignAction(onDelete),
      }),
    )
  }

  onUpdate(onUpdate: OnModifyForeignAction): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder(
      ForeignKeyConstraintNode.cloneWith(this.#node, {
        onUpdate: parseOnModifyForeignAction(onUpdate),
      }),
    )
  }

  deferrable(): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder(
      ForeignKeyConstraintNode.cloneWith(this.#node, { deferrable: true }),
    )
  }

  notDeferrable(): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder(
      ForeignKeyConstraintNode.cloneWith(this.#node, { deferrable: false }),
    )
  }

  initiallyDeferred(): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder(
      ForeignKeyConstraintNode.cloneWith(this.#node, {
        initiallyDeferred: true,
      }),
    )
  }

  initiallyImmediate(): ForeignKeyConstraintBuilder {
    return new ForeignKeyConstraintBuilder(
      ForeignKeyConstraintNode.cloneWith(this.#node, {
        initiallyDeferred: false,
      }),
    )
  }

  /**
   * Simply calls the provided function passing `this` as the only argument. `$call` returns
   * what the provided function returns.
   */
  $call<T>(func: (qb: this) => T): T {
    return func(this)
  }

  toOperationNode(): ForeignKeyConstraintNode {
    return this.#node
  }
}

export type ForeignKeyConstraintBuilderCallback = (
  builder: ForeignKeyConstraintBuilder,
) => ForeignKeyConstraintBuilder
