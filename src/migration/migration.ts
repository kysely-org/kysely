import { Dialect } from '../dialect/dialect'
import { Driver } from '../driver/driver'
import { QueryCompiler } from '../query-compiler/query-compiler'
import { freeze } from '../util/object-utils'

export interface Migration {
  /**
   * Runs all migrations that have not yet been run.
   */
  migrateToLatest(): Promise<void>
}

export function createMigrationModule(
  dialect: Dialect,
  compiler: QueryCompiler,
  driver: Driver
): Migration {
  async function migrateToLatest(): Promise<void> {}

  return freeze({
    migrateToLatest,
  })
}
