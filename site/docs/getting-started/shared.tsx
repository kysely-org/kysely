import React, { type ReactNode } from 'react'
import packageJson from '../../package.json'

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

export const PRETTY_DIALECT_NAMES: Record<Dialect, string> = {
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  sqlite: 'SQLite',
}

export const PRETTY_PACKAGE_MANAGER_NAMES: Record<PackageManager, string> = {
  npm: 'npm',
  pnpm: 'pnpm',
  yarn: 'Yarn',
  deno: 'Deno',
  bun: 'Bun',
}

const PACKAGE_MANAGER_INSTALL_COMMANDS: Record<
  Exclude<PackageManager, 'deno'>,
  string
> = {
  npm: 'npm install',
  pnpm: 'pnpm install',
  yarn: 'yarn add',
  bun: 'bun install',
}

export interface Command {
  content: ReactNode
  intro: ReactNode
  language: string
  title: string
}

export function getBashCommand(
  packageManager: PackageManager,
  installedPackage: string
): Command {
  if (packageManager === 'deno') {
    throw new Error('Deno has no bash command')
  }

  return {
    content: `${PACKAGE_MANAGER_INSTALL_COMMANDS[packageManager]} ${installedPackage}`,
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
