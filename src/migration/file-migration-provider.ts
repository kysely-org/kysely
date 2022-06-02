import { isFunction, isObject } from '../util/object-utils.js'
import { Migration, MigrationProvider } from './migrator.js'

/**
 * Reads all migrations from a folder in node.js.
 *
 * ### Examples
 *
 * ```ts
 * import { promises as fs } from 'fs'
 * import path from 'path'
 *
 * new FileMigrationProvider({
 *   fs,
 *   path,
 *   migrationFolder: 'path/to/migrations/folder'
 * })
 * ```
 */
export class FileMigrationProvider implements MigrationProvider {
  readonly #props: FileMigrationProviderProps

  constructor(props: FileMigrationProviderProps) {
    this.#props = props
  }

  async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = {}
    const files = await this.#props.fs.readdir(this.#props.migrationFolder)

    for (const fileName of files) {
      if (
        (fileName.endsWith('.js') || fileName.endsWith('.ts') || fileName.endsWith('.mjs')) &&
        !fileName.endsWith('.d.ts')
      ) {
        const migration = await import(
          /* webpackIgnore: true */ this.#props.path.join(
            this.#props.migrationFolder,
            fileName
          )
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

export interface FileMigrationProviderFS {
  readdir(path: string): Promise<string[]>
}

export interface FileMigrationProviderPath {
  join(...path: string[]): string
}

export interface FileMigrationProviderProps {
  fs: FileMigrationProviderFS
  path: FileMigrationProviderPath
  migrationFolder: string
}
