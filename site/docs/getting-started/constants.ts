export const DIALECTS = [
  'postgresql',
  'mysql',
  'sqlite',
  'mssql',
  'pglite',
] as const

export type Dialect = (typeof DIALECTS)[number]

export const DEFAULT_DIALECT = 'postgresql' satisfies Dialect

export type PropsWithDialect<P = {}> = P & {
  dialect?: Dialect
  dialectSearchParam?: string
  dialectSelectionID?: string
}

export type PropsWithPackageManager<P = {}> = P & {
  packageManager?: PackageManager
  packageManagerSearchParam?: string
  packageManagerSelectionID?: string
}

export const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun', 'deno'] as const

export type PackageManager = (typeof PACKAGE_MANAGERS)[number]

export const DEFAULT_PACKAGE_MANAGER = 'npm' satisfies PackageManager

export function getKyselyImportPath(packageManager: PackageManager): string {
  return packageManager === 'deno' ? '@kysely/kysely' : 'kysely'
}

export const DIALECT_CLASS_NAMES = {
  postgresql: 'PostgresDialect',
  mysql: 'MysqlDialect',
  mssql: 'MssqlDialect',
  sqlite: 'SqliteDialect',
  pglite: 'PGliteDialect',
} as const satisfies Record<Dialect, string>

export const getDriverNPMPackageNames = (
  packageManager: PackageManager = 'npm',
) =>
  ({
    postgresql: packageManager === 'deno' ? 'pg-pool' : 'pg',
    mysql: 'mysql2',
    mssql: 'tedious',
    sqlite: 'better-sqlite3',
    pglite: '@electric-sql/pglite',
  }) as const satisfies Record<Dialect, string>

export const POOL_NPM_PACKAGE_NAMES = {
  mssql: 'tarn',
} as const satisfies Partial<Record<Dialect, string>>
