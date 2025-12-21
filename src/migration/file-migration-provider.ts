import { isFunction, isObject } from '../util/object-utils.js'
import type { Migration, MigrationProvider } from './migrator.js'

/**
 * Reads all migrations from a folder.
 *
 * ### Examples
 *
 * ```ts
 * import { promises as fs } from 'node:fs'
 * import path from 'node:path'
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
      if (!this.hasExpectedExtension(fileName)) {
        this.#props.onDiscarded?.(fileName, 'Extension')
        continue
      }

      const filePath = this.#props.path.join(
        this.#props.migrationFolder,
        fileName,
      )

      const migration = this.#props.import
        ? await this.#props.import(filePath)
        : await import(/* webpackIgnore: true */ filePath)

      const migrationKey = fileName.substring(0, fileName.lastIndexOf('.'))

      // Handle esModuleInterop export's `default` prop...
      if (isMigration(migration?.default)) {
        migrations[migrationKey] = migration.default
      } else if (isMigration(migration)) {
        migrations[migrationKey] = migration
      } else {
        this.#props.onDiscarded?.(fileName, 'NotMigration')
      }
    }

    return migrations
  }

  protected hasExpectedExtension(fileName: string): boolean {
    return (
      fileName.endsWith('.js') ||
      (fileName.endsWith('.ts') && !fileName.endsWith('.d.ts')) ||
      fileName.endsWith('.mjs') ||
      (fileName.endsWith('.mts') && !fileName.endsWith('.d.mts')) ||
      fileName.endsWith('.cjs') ||
      (fileName.endsWith('.cts') && !fileName.endsWith('.d.cts'))
    )
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
  import?(module: string): Promise<any>
  migrationFolder: string
  onDiscarded?(fileName: string, reason: 'Extension' | 'NotMigration'): void
  path: FileMigrationProviderPath
}
