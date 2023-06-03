import React, { ReactNode } from 'react'
import Link from '@docusaurus/Link'
import Heading from '@theme/Heading'
import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import CodeBlock from '@theme/CodeBlock'
import Admonition from '@theme/Admonition'
import packageJson from '../../package.json'
import { Dialect, PackageManager, isDialectSupported } from './shared'

export interface DialectsProps {
  packageManager: PackageManager | undefined
  packageManagersURL: string
}

interface CommandDetails {
  content: (driverNPMPackage: string) => string | ReactNode
  intro?: string | ReactNode
  language: string
  title: string
}

const packageManagerToInstallCommand: Record<PackageManager, CommandDetails> = {
  npm: {
    content: (pkg) => `npm install ${pkg}`,
    language: 'bash',
    title: 'terminal',
  },
  pnpm: {
    content: (pkg) => `pnpm install ${pkg}`,
    language: 'bash',
    title: 'terminal',
  },
  yarn: {
    content: (pkg) => `yarn add ${pkg}`,
    language: 'bash',
    title: 'terminal',
  },
  deno: {
    content: (pkg) => (
      <>
        {JSON.stringify(
          {
            imports: {
              kysely: `npm:kysely@^${packageJson.version}`,
              [pkg]: `npm:${pkg}`,
              [`${pkg}-pool`]: pkg === 'pg' ? 'npm:pg-pool' : undefined,
            },
          },
          undefined,
          2
        )}
      </>
    ),
    intro: (
      <>
        <strong>Your </strong>
        <code>deno.json</code>
        <strong>
          's "imports" field should include the following dependencies:
        </strong>
      </>
    ),
    language: 'json',
    title: 'deno.json',
  },
  bun: {
    content: (pkg) => `bun install ${pkg}`,
    language: 'bash',
    title: 'terminal',
  },
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
  const packageManager = props.packageManager || 'npm'

  const installationCommand = packageManagerToInstallCommand[packageManager]

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
        {builtInDialects.map(({ driverNPMPackage, value, ...dialect }) => (
          // @ts-ignore For some odd reason, TabItem doesn't accept children in this file.
          <TabItem value={value} {...dialect}>
            {!isDialectSupported(value, packageManager) ? (
              <UnsupportedDriver
                dialect={dialect.label}
                driverNPMPackage={driverNPMPackage}
                packageManager={packageManager}
              />
            ) : (
              <>
                <p>
                  Kysely's built-in {dialect.label} dialect uses the "
                  {driverNPMPackage}" driver library under the hood. Please
                  refer to its{' '}
                  <Link to={dialect.driverDocsURL}>official documentation</Link>{' '}
                  for configuration options.
                  <br />
                  <br />
                  {installationCommand.intro || (
                    <strong>Run the following command in your terminal:</strong>
                  )}
                </p>
                <CodeBlock
                  language={installationCommand.language}
                  title={installationCommand.title}
                >
                  {installationCommand.content(driverNPMPackage)}
                </CodeBlock>
              </>
            )}
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

interface UnsupportedDriverProps {
  dialect: string
  driverNPMPackage: string
  packageManager: PackageManager
}

function UnsupportedDriver(props: UnsupportedDriverProps) {
  const { dialect, packageManager } = props

  const titleCasedPackageManager = `${packageManager[0].toUpperCase()}${packageManager.substring(
    1
  )}`

  return (
    <Admonition type="danger" title="Driver unsupported">
      Kysely's built-in {dialect} dialect does not work in{' '}
      {titleCasedPackageManager} because the driver library it uses, "
      {props.driverNPMPackage}", doesn't. Please use a community {dialect}{' '}
      dialect that works in {titleCasedPackageManager}, or implement your own.
    </Admonition>
  )
}
