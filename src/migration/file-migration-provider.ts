import { isFunction, isObject } from '../util/object-utils.js'
import { Migration, MigrationProvider } from './migrator.js'

/**
 * Reads all migrations from a folder.
 *
 * ### Examples
 *
 * ```ts
 * new FileMigrationProvider(
 *   'path/to/migrations/folder'
 * )
 * ```
 */
export class FileMigrationProvider implements MigrationProvider {
  readonly #migrationFolderPath: string

  constructor(migrationFolderPath: string) {
    this.#migrationFolderPath = migrationFolderPath
  }

  async getMigrations(): Promise<Record<string, Migration>> {
    // Import these dynamically so that we don't have any top level
    // node dependencies.
    const fs = await import('fs/promises')
    const path = await import('path')

    const migrations: Record<string, Migration> = {}
    const files = await fs.readdir(this.#migrationFolderPath)

    for (const fileName of files) {
      if (
        (fileName.endsWith('.js') || fileName.endsWith('.ts')) &&
        !fileName.endsWith('.d.ts')
      ) {
        const migration = await import(
          path.join(this.#migrationFolderPath, fileName)
        )

        if (isMigration(migration)) {
          migrations[fileName.substring(0, fileName.length - 3)] = migration
        }
      }
    }

    return migrations
  }
}

function isMigration(obj: unknown): obj is Migration {
  return isObject(obj) && isFunction(obj.up)
}
