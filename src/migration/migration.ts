import type { Kysely } from '../kysely.js'
import type { MigrateOptions } from './migrator.js'

/**
 * The shape of a migration's module.
 */
export interface Migration {
  /**
   * Configuration object for this migration module.
   *
   * See {@link MigrationConfig}.
   */
  config?: MigrationConfig

  /**
   * The `down` method that reverts the changes made by it's sibling {@link Migration.up}
   * method.
   */
  down?(db: Kysely<any>): Promise<void>

  /**
   * The `up` method that changes the database schema.
   *
   * See {@link Migration.down}.
   */
  up(db: Kysely<any>): Promise<void>
}

/**
 * Configuration for a single migration.
 */
export interface MigrationConfig {
  /**
   * Controls whether this migration runs inside its own transaction, when
   * {@link MigrateOptions.transactionMode} is `'per-migration'` — the only
   * mode that honors this property. Defaults to `true` in that mode: the
   * migration runs in its own transaction unless this is set to `false`.
   *
   * In any other transaction mode, leaving this property out is the only
   * valid state — providing a value, either one, results in an error: in
   * `'per-run'` mode a single shared transaction cannot partially exclude a
   * migration, and in `'none'` mode there are no transactions to configure.
   * This is the one place an explicit `true` differs from the default —
   * `true` asserts a requirement that non-`'per-migration'` modes refuse,
   * while leaving the property out never errors.
   *
   * Setting `false` makes the migration run without a transaction. This is
   * required for statements that cannot run inside a transaction, such as
   * PostgreSQL's `CREATE INDEX CONCURRENTLY`. Note that without a
   * transaction, a failure can leave the migration partially applied, and the
   * migration table record is written separately after the migration
   * completes. Prefer a single statement per non-transactional migration, and
   * write it so it can be safely retried — for example, drop a
   * possibly-leftover invalid index before creating it.
   */
  readonly transaction?: boolean
}

/**
 * Helps define a single migration by taking over types duties and enforcing the contract.
 *
 * ### Examples
 *
 * ```ts
 * import { defineMigration } from 'kysely/migration'
 *
 * export default defineMigration({
 *   async up(db) {
 *     // ...
 *   },
 *
 *   config: { transaction: false },
 * })
 * ```
 */
export function defineMigration(migration: Migration): Migration {
  return migration
}
