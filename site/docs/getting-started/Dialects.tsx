import React from 'react'
import Link from '@docusaurus/Link'
import Heading from '@theme/Heading'
import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import CodeBlock from '@theme/CodeBlock'
import Admonition from '@theme/Admonition'
import type { Dialect } from './types'

export interface DialectsProps {
  packageManager: PackageManager
  packageManagersURL: string
}

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'deno'

const packageManagerToInstallCommand: Record<
  Exclude<PackageManager, 'deno'>,
  string
> = {
  npm: 'npm install',
  pnpm: 'pnpm install',
  yarn: 'yarn add',
}

interface BuiltInDialect {
  value: Dialect
  label: string
  driverNPMPackage: string
  driverDocsURL: string
}

const builtInDialects: BuiltInDialect[] = [
  {
    value: 'postgresql',
    label: 'PostgreSQL',
    driverNPMPackage: 'pg',
    driverDocsURL: 'https://node-postgres.com/',
  },
  {
    value: 'mysql',
    label: 'MySQL',
    driverNPMPackage: 'mysql2',
    driverDocsURL:
      'https://github.com/sidorares/node-mysql2/tree/master/documentation',
  },
  {
    value: 'sqlite',
    label: 'SQLite',
    driverNPMPackage: 'better-sqlite3',
    driverDocsURL:
      'https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md',
  },
]

export function Dialects(props: DialectsProps) {
  const installationCommand =
    packageManagerToInstallCommand[props.packageManager] ||
    packageManagerToInstallCommand.npm

  return (
    <>
      <p>
        For Kysely's query compilation and execution to work, it needs to
        understand your database's SQL specification and how to communicate with
        it. This requires a <code>Dialect</code> implementation.
        <br />
        <br />
        There are 3 built-in Node.js dialects for PostgreSQL, MySQL and SQLite.
        Additionally, the community has implemented several dialects to choose
        from. Find out more at <Link to="/docs/dialects">"Dialects"</Link>.
      </p>
      <Heading as="h3">Driver installation</Heading>
      <p>
        A <code>Dialect</code> implementation usually requires a database driver
        library as a peer dependency. Let's install it using the same package
        manager command from before:
      </p>
      {/* @ts-ignore For some odd reason, Tabs doesn't accept children in this file. */}
      <Tabs queryString="dialect">
        {builtInDialects.map(({ driverNPMPackage, ...dialect }) => (
          // @ts-ignore For some odd reason, TabItem doesn't accept children in this file.
          <TabItem key={dialect.value} {...dialect}>
            <p>
              Kysely's built-in {dialect.label} dialect uses the "
              {driverNPMPackage}" driver library under the hood. Please refer to
              its <Link to={dialect.driverDocsURL}>official documentation</Link>{' '}
              for configuration options.
              <br />
              <br />
              <strong>Run the following command in your terminal:</strong>
            </p>
            <CodeBlock language="bash" title="terminal">
              {installationCommand} {driverNPMPackage}
            </CodeBlock>
          </TabItem>
        ))}
      </Tabs>
      <p style={{ display: 'flex', justifyContent: 'end' }}>
        <Link to={props.packageManagersURL}>
          I use a different package manager
        </Link>
      </p>
      <Admonition type="info" title="Driverless">
        Kysely can also work in compile-only mode that doesn't require a
        database driver. Find out more at{' '}
        <Link to="/docs/recipes/splitting-build-compile-and-execute-code">
          "Splitting build, compile and execute code"
        </Link>
        .
      </Admonition>
    </>
  )
}
