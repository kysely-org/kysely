import React, { type ReactNode } from 'react'
import packageJson from '../../package.json'

export type Dialect = 'postgresql' | 'mysql' | 'sqlite' | 'mssql'

export type PropsWithDialect<P = {}> = P & {
  dialect: Dialect | undefined
  dialectsURL: string
}

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'deno' | 'bun'

const PACKAGE_MANAGER_UNSUPPORTED_DIALECTS: Record<PackageManager, Dialect[]> =
  {
    bun: ['sqlite', 'mssql'],
    deno: ['sqlite', 'mssql'],
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

export const DIALECT_CLASS_NAMES = {
  postgresql: 'PostgresDialect',
  mysql: 'MysqlDialect',
  mssql: 'MssqlDialect',
  sqlite: 'SqliteDialect',
} as const satisfies Record<Dialect, string>

export const getDriverNPMPackageNames = (
  packageManager: PackageManager = 'npm'
) =>
  ({
    postgresql: packageManager === 'deno' ? 'pg-pool' : 'pg',
    mysql: 'mysql2',
    mssql: 'tedious',
    sqlite: 'better-sqlite3',
  } as const satisfies Record<Dialect, string>)

export const POOL_NPM_PACKAGE_NAMES = {
  mssql: 'tarn',
} as const satisfies Partial<Record<Dialect, string>>

export const PRETTY_DIALECT_NAMES = {
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  mssql: 'Microsoft SQL Server (MSSQL)',
  sqlite: 'SQLite',
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
  bun: 'bun install',
} as const satisfies Omit<Record<PackageManager, string>, 'deno'>

export interface Command {
  content: ReactNode
  intro: ReactNode
  language: string
  title: string
}

export function getBashCommand(
  packageManager: PackageManager,
  installedPackage: string,
  additionalPackages?: string[]
): Command {
  if (packageManager === 'deno') {
    throw new Error('Deno has no bash command')
  }

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

export function getDenoCommand(
  additionalImports?: Record<string, string>
): Command {
  return {
    content: JSON.stringify(
      {
        imports: {
          kysely: `npm:kysely@^${packageJson.version}`,
          ...additionalImports,
        },
      },
      null,
      2
    ),
    intro: (
      <>
        <strong>Your root </strong>
        <code>deno.json</code>
        <strong>
          's "imports" field should include the following dependencies:
        </strong>
      </>
    ),
    language: 'json',
    title: 'deno.json',
  }
}
