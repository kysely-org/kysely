import { ExecutorPlugin } from '../index.js'
import { Kysely } from '../kysely.js'

export interface KyselyPlugin extends ExecutorPlugin {
  /**
   * This method is called from {@link Kysely.create} function. The `Kysely` instance
   * passed as an argument is a version of the `Kysely` instance being created __without__
   * any plugins installed. As if it was created without the `plugins` property in the
   * config.
   */
  init(db: Kysely<any>): Promise<void>

  /**
   * This is called from {@link Kysely.destroy}.
   */
  destroy(): Promise<void>
}
