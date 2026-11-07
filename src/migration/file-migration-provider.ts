import { isFunction, isObject } from '../util/object-utils.js'
import type { Migration, MigrationProvider } from './migrator.js'

/**
 * Reads all migrations from a folder.
 *
 * Loads `.js`, `.ts`, `.mjs`, `.mts`, `.cjs` and `.cts` files, excluding
 * TypeScript declaration files. Loading TypeScript requires a runtime or
 * loader that supports it. Subdirectories are not scanned.
 *
 * A module must export an `up` function, either as a named export or as part
 * of a default export object. The filename without its extension is used as
 * the migration name. See {@link FileMigrationProviderProps.onFileIgnored}
 * to report files that aren't loaded.
 *
 * ### Examples
 *
 * ```ts
 * import { promises as fs } from 'node:fs'
 * import path from 'node:path'
 * import { FileMigrationProvider } from 'kysely/migration'
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
        this.#props.onFileIgnored?.(fileName, 'Extension')
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
        this.#props.onFileIgnored?.(fileName, 'NotMigration')
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
  /**
   * Provides the directory listing. For Node.js, use `promises` from `node:fs`.
   */
  fs: FileMigrationProviderFS

  /**
   * Overrides how migration modules are imported. Receives the joined file path
   * and returns the module exports. Defaults to a dynamic `import`.
   *
   * ### Examples
   *
   * Use a file URL when importing absolute paths in Node.js:
   *
   * ```ts
   * import { promises as fs } from 'node:fs'
   * import path from 'node:path'
   * import { pathToFileURL } from 'node:url'
   * import { FileMigrationProvider } from 'kysely/migration'
   *
   * const provider = new FileMigrationProvider({
   *   fs,
   *   path,
   *   migrationFolder: path.resolve('migrations'),
   *   import: (filePath) => import(pathToFileURL(filePath).href),
   * })
   * ```
   */
  import?(module: string): Promise<any>

  /**
   * The path to the migration directory. Use an absolute path to avoid
   * depending on the current working directory.
   */
  migrationFolder: string

  /**
   * Called when a directory entry is ignored.
   *
   * `Extension` means the filename doesn't have a supported extension.
   * `NotMigration` means the imported module has no supported `up` export.
   * Import errors are thrown instead of being reported through this callback.
   *
   * ### Examples
   *
   * ```ts
   * import { promises as fs } from 'node:fs'
   * import path from 'node:path'
   * import { FileMigrationProvider } from 'kysely/migration'
   *
   * const provider = new FileMigrationProvider({
   *   fs,
   *   path,
   *   migrationFolder: path.resolve('migrations'),
   *   onFileIgnored(fileName, reason) {
   *     console.log(`Ignored ${fileName}: ${reason}`)
   *   },
   * })
   * ```
   */
  onFileIgnored?(fileName: string, reason: 'Extension' | 'NotMigration'): void

  /**
   * Provides path joining. For Node.js, use `node:path`.
   */
  path: FileMigrationProviderPath
}
