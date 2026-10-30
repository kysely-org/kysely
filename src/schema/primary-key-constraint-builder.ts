import type { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { PrimaryKeyConstraintNode } from '../operation-node/primary-key-constraint-node.js'

export class PrimaryKeyConstraintBuilder implements OperationNodeSource {
  readonly #node: PrimaryKeyConstraintNode

  constructor(node: PrimaryKeyConstraintNode) {
    this.#node = node
  }

  /**
   * Allows checking the constraint to be deferred until transaction commit.
   *
   * Only supported by PostgreSQL. Checks are initially immediate unless
   * {@link initiallyDeferred} is also used.
   */
  deferrable(): PrimaryKeyConstraintBuilder {
    return new PrimaryKeyConstraintBuilder(
      PrimaryKeyConstraintNode.cloneWith(this.#node, { deferrable: true }),
    )
  }

  /**
   * Prevents deferring constraint checks. This is the default.
   *
   * Only supported by PostgreSQL.
   */
  notDeferrable(): PrimaryKeyConstraintBuilder {
    return new PrimaryKeyConstraintBuilder(
      PrimaryKeyConstraintNode.cloneWith(this.#node, { deferrable: false }),
    )
  }

  /**
   * Checks the constraint at transaction commit by default.
   *
   * Use with {@link deferrable}. Only supported by PostgreSQL.
   *
   * ### Examples
   *
   * ```ts
   * await db.schema
   *   .createTable('example')
   *   .addColumn('id', 'integer', (col) => col.notNull())
   *   .addPrimaryKeyConstraint(
   *     'example_id_key',
   *     ['id'],
   *     (constraint) => constraint.deferrable().initiallyDeferred(),
   *   )
   *   .execute()
   * ```
   *
   * The generated SQL (PostgreSQL):
   *
   * ```sql
   * create table "example" (
   *   "id" integer not null,
   *   constraint "example_id_key" primary key ("id") deferrable initially deferred
   * )
   * ```
   */
  initiallyDeferred(): PrimaryKeyConstraintBuilder {
    return new PrimaryKeyConstraintBuilder(
      PrimaryKeyConstraintNode.cloneWith(this.#node, {
        initiallyDeferred: true,
      }),
    )
  }

  /**
   * Checks the constraint after each statement by default.
   *
   * A {@link deferrable} constraint can still be deferred within a transaction.
   * Only supported by PostgreSQL.
   */
  initiallyImmediate(): PrimaryKeyConstraintBuilder {
    return new PrimaryKeyConstraintBuilder(
      PrimaryKeyConstraintNode.cloneWith(this.#node, {
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

  toOperationNode(): PrimaryKeyConstraintNode {
    return this.#node
  }
}

export type PrimaryKeyConstraintBuilderCallback = (
  builder: PrimaryKeyConstraintBuilder,
) => PrimaryKeyConstraintBuilder
