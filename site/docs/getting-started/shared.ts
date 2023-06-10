export type Dialect = 'postgresql' | 'mysql' | 'sqlite'

export type PropsWithDialect<P = {}> = P & {
  dialect: Dialect | undefined
  dialectsURL: string
}

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'deno' | 'bun'

const PACKAGE_MANAGER_UNSUPPORTED_DIALECTS: Record<PackageManager, Dialect[]> =
  {
    bun: ['sqlite'],
    deno: ['sqlite'],
    npm: [],
    pnpm: [],
    yarn: [],
  }

export function isDialectSupported(
  dialect: Dialect,
  packageManager: PackageManager
): boolean {
  return !PACKAGE_MANAGER_UNSUPPORTED_DIALECTS[packageManager].includes(dialect)
}

export const DRIVER_NPM_PACKAGE_NAMES: Record<Dialect, string> = {
  postgresql: 'pg',
  mysql: 'mysql2',
  sqlite: 'better-sqlite3',
}

export const PRETTY_PACKAGE_MANAGER_NAMES: Record<PackageManager, string> = {
  npm: 'npm',
  pnpm: 'pnpm',
  yarn: 'Yarn',
  deno: 'Deno',
  bun: 'Bun',
}

export function titlecase(str: string): string {
  return `${str[0].toUpperCase()}${str.substring(1)}`
}
