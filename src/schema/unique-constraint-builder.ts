import type { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { UniqueConstraintNode } from '../operation-node/unique-constraint-node.js'

export class UniqueConstraintNodeBuilder implements OperationNodeSource {
  readonly #node: UniqueConstraintNode

  constructor(node: UniqueConstraintNode) {
    this.#node = node
  }

  /**
   * Adds `nulls not distinct` to the unique constraint definition
   *
   * Supported by PostgreSQL dialect only
   */
  nullsNotDistinct(): UniqueConstraintNodeBuilder {
    return new UniqueConstraintNodeBuilder(
      UniqueConstraintNode.cloneWith(this.#node, { nullsNotDistinct: true }),
    )
  }

  /**
   * Allows checking the constraint to be deferred until transaction commit.
   *
   * Only supported by PostgreSQL. Checks are initially immediate unless
   * {@link initiallyDeferred} is also used.
   */
  deferrable(): UniqueConstraintNodeBuilder {
    return new UniqueConstraintNodeBuilder(
      UniqueConstraintNode.cloneWith(this.#node, { deferrable: true }),
    )
  }

  /**
   * Prevents deferring constraint checks. This is the default.
   *
   * Only supported by PostgreSQL.
   */
  notDeferrable(): UniqueConstraintNodeBuilder {
    return new UniqueConstraintNodeBuilder(
      UniqueConstraintNode.cloneWith(this.#node, { deferrable: false }),
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
   *   .addUniqueConstraint(
   *     'example_id_key',
   *     ['id'],
   *     (constraint) => constraint.deferrable().initiallyDeferred(),
   *   )
   *   .execute()
   * ```
   */
  initiallyDeferred(): UniqueConstraintNodeBuilder {
    return new UniqueConstraintNodeBuilder(
      UniqueConstraintNode.cloneWith(this.#node, {
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
  initiallyImmediate(): UniqueConstraintNodeBuilder {
    return new UniqueConstraintNodeBuilder(
      UniqueConstraintNode.cloneWith(this.#node, {
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

  toOperationNode(): UniqueConstraintNode {
    return this.#node
  }
}

export type UniqueConstraintNodeBuilderCallback = (
  builder: UniqueConstraintNodeBuilder,
) => UniqueConstraintNodeBuilder
