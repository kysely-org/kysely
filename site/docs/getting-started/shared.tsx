import { useLocation } from '@docusaurus/router'
import { useEffect, useState, type ReactNode } from 'react'

import type { Dialect, PackageManager } from './constants'

export * from './constants'

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
  bun: 'Bun',
  deno: 'Deno',
} as const satisfies Record<PackageManager, string>

const PACKAGE_MANAGER_INSTALL_COMMANDS = {
  npm: 'npm install',
  pnpm: 'pnpm install',
  yarn: 'yarn add',
  bun: 'bun install',
  deno: 'deno add',
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
