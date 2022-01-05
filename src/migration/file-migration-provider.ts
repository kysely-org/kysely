import { isFunction, isObject } from '../util/object-utils.js'
import { Migration, MigrationProvider } from './migrator.js'

/**
 * A function that takes a folder path and returns names of the
 * files insider that folder.
 */
export type ReadDir = (migrationFolderPath: string) => Promise<string[]>

/**
 * A function that combines two file path parts into a single file path.
 *
 * ```ts
 * joinPath('/some/path', 'file.ts')
 * // ==> '/some/path/file.ts'
 * ```
 */
export type JoinPath = (part1: string, part2: string) => string

/**
 * Reads all migrations from a folder.
 *
 * You need to provide a function for reading files in a folder and a function for
 * joining file paths together. The API is like this to make Kysely independent of
 * node.js or any other environment. See the example usage on node.js below.
 *
 * ### Examples
 *
 * ```ts
 * import * as path from 'path'
 * import * as fs from 'fs/promises'
 *
 * new FileMigrationProvider(
 *   fs.readdir,
 *   path.join,
 *   path.join(__dirname, 'migrations')
 * )
 * ```
 */
export class FileMigrationProvider implements MigrationProvider {
  readonly #readDir: ReadDir
  readonly #joinPath: JoinPath
  readonly #migrationFolderPath: string

  constructor(
    readDir: ReadDir,
    joinPath: JoinPath,
    migrationFolderPath: string
  ) {
    this.#readDir = readDir
    this.#joinPath = joinPath
    this.#migrationFolderPath = migrationFolderPath
  }

  async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = {}
    const files = await this.#readDir(this.#migrationFolderPath)

    for (const fileName of files) {
      if (
        (fileName.endsWith('.js') || fileName.endsWith('.ts')) &&
        !fileName.endsWith('.d.ts')
      ) {
        const migration = await import(
          this.#joinPath(this.#migrationFolderPath, fileName)
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
