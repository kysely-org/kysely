export type Dialect = 'postgresql' | 'mysql' | 'sqlite'

export type PropsWithDialect<P = {}> = P & {
  dialect: Dialect
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
