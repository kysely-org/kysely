import { Driver } from '../driver/driver'
import { QueryCompiler } from '../query-compiler/query-compiler'
import { freeze } from '../util/object-utils'

export interface Migrate {
  latest(): Promise<void>
}

export function createMigrateModule(
  compiler: QueryCompiler,
  driver: Driver
): Migrate {
  async function latest(): Promise<void> {
    
  }

  return freeze({
    latest,
  })
}
