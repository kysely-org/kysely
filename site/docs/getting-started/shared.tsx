import { useLocation } from '@docusaurus/router'
import { useEffect, useState, type ReactNode } from 'react'

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

export const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'deno', 'bun'] as const

export type PackageManager = (typeof PACKAGE_MANAGERS)[number]

export const DEFAULT_PACKAGE_MANAGER = 'npm' satisfies PackageManager

const PACKAGE_MANAGER_UNSUPPORTED_DIALECTS: Record<PackageManager, Dialect[]> =
  {
    bun: ['sqlite'],
    deno: ['sqlite', 'mssql'],
    npm: [],
    pnpm: [],
    yarn: [],
  }

export function isDialectSupported(
  dialect: Dialect,
  packageManager: PackageManager,
): boolean {
  return !PACKAGE_MANAGER_UNSUPPORTED_DIALECTS[packageManager].includes(dialect)
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

export const PRETTY_DIALECT_NAMES = {
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  mssql: 'Microsoft SQL Server (MSSQL)',
  sqlite: 'SQLite',
  pglite: 'PGlite',
} as const satisfies Record<Dialect, string>

export const PRETTY_PACKAGE_MANAGER_NAMES = {
  npm: 'npm',
  pnpm: 'pnpm',
  yarn: 'Yarn',
  deno: 'Deno',
  bun: 'Bun',
} as const satisfies Record<PackageManager, string>

const PACKAGE_MANAGER_INSTALL_COMMANDS = {
  npm: 'npm install',
  pnpm: 'pnpm install',
  yarn: 'yarn add',
  deno: 'deno add',
  bun: 'bun install',
} as const satisfies Record<PackageManager, string>

export interface Command {
  content: ReactNode
  intro: ReactNode
  language: string
  title: string
}

export function getBashCommand(
  packageManager: PackageManager,
  installedPackage: string,
  additionalPackages?: string[],
): Command {
  return {
    content: `${
      PACKAGE_MANAGER_INSTALL_COMMANDS[packageManager]
    } ${installedPackage}${
      additionalPackages?.length ? ` ${additionalPackages.join(' ')}` : ''
    }`,
    intro: 'Run the following command in your terminal:',
    language: 'bash',
    title: 'terminal',
  }
}

export interface UseSearchStateProps<Value extends string> {
  defaultValue: Value
  searchParam?: string
  validator?: (searchValue: string | null) => boolean
  value?: Value
}

export function useSearchState<Value extends string>(
  props: UseSearchStateProps<Value>,
): Value {
  const { defaultValue, searchParam, validator, value } = props

  const [state, setState] = useState<Value>(value || defaultValue)
  const { search } = useLocation()

  useEffect(
    function syncStateWithSearch() {
      // value overrides search value.
      // no search param? ignore URL.
      if (value || !searchParam) {
        return
      }

      const searchValue = new URLSearchParams(search).get(searchParam)

      if (
        searchValue == null ||
        searchValue === state ||
        (validator && !validator(searchValue))
      ) {
        return
      }

      setState(searchValue as Value)
    },
    [search],
  )

  useEffect(() => {
    if (value && value !== state) {
      setState(value)
    }
  }, [value, state])

  return state
}
