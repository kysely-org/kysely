import Admonition from '@theme/Admonition'
import CodeBlock from '@theme/CodeBlock'
import Heading from '@theme/Heading'
import Link from '@docusaurus/Link'
import TabItem from '@theme/TabItem'
import Tabs from '@theme/Tabs'
import { IUseADifferentPackageManager } from './IUseADifferentPackageManager'
import {
  getDriverNPMPackageNames,
  getBashCommand,
  getDenoCommand,
  isDialectSupported,
  POOL_NPM_PACKAGE_NAMES,
  PRETTY_DIALECT_NAMES,
  PRETTY_PACKAGE_MANAGER_NAMES,
  type Dialect,
  type PackageManager,
  PACKAGE_MANAGERS,
  type PropsWithPackageManager,
  useSearchState,
  DEFAULT_PACKAGE_MANAGER,
} from './shared'

export type DialectsProps = PropsWithPackageManager

interface BuiltInDialect {
  value: Dialect
  driverDocsURL: string
  poolDocsURL?: string
}

const builtInDialects: BuiltInDialect[] = [
  {
    value: 'postgresql',
    driverDocsURL: 'https://node-postgres.com/',
  },
  {
    value: 'mysql',
    driverDocsURL:
      'https://github.com/sidorares/node-mysql2/tree/master/documentation',
  },
  {
    value: 'mssql',
    driverDocsURL: 'https://tediousjs.github.io/tedious/index.html',
    poolDocsURL: 'https://github.com/vincit/tarn.js',
  },
  {
    value: 'sqlite',
    driverDocsURL:
      'https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md',
  },
]

export function Dialects(props: DialectsProps) {
  const packageManager = useSearchState({
    defaultValue: DEFAULT_PACKAGE_MANAGER,
    searchParam: props.packageManagerSearchParam,
    validator: (value) => PACKAGE_MANAGERS.includes(value as never),
    value: props.packageManager,
  })

  return (
    <>
      <p>
        For Kysely's query compilation and execution to work, it needs to
        understand your database's SQL specification and how to communicate with
        it. This requires a <code>Dialect</code> implementation.
        <br />
        <br />
        There are 4 built-in dialects for PostgreSQL, MySQL, Microsoft SQL
        Server (MSSQL), and SQLite. Additionally, the community has implemented
        several dialects to choose from. Find out more at{' '}
        <Link to="/docs/dialects">"Dialects"</Link>.
      </p>
      <Heading as="h3">Driver installation</Heading>
      <p>
        A <code>Dialect</code> implementation usually requires a database driver
        library as a peer dependency. Let's install it using the same package
        manager command from before:
      </p>
      {/* @ts-ignore For some odd reason, Tabs doesn't accept children in this file. */}
      <Tabs queryString="dialect">
        {builtInDialects.map(({ driverDocsURL, poolDocsURL, value }) => {
          const driverNPMPackage = getDriverNPMPackageNames()[value]
          const poolNPMPackage = POOL_NPM_PACKAGE_NAMES[value]
          const prettyDialectName = PRETTY_DIALECT_NAMES[value]
          const installationCommand =
            packageManager === 'deno'
              ? getDenoCommand({
                  [driverNPMPackage]: `npm:${driverNPMPackage}`,
                  [`${driverNPMPackage}-pool`]:
                    driverNPMPackage === 'pg' ? 'npm:pg-pool' : undefined,
                })
              : getBashCommand(packageManager, driverNPMPackage, [
                  poolNPMPackage,
                ])

          return (
            // @ts-ignore For some odd reason, TabItem doesn't accept children in this file.
            <TabItem key={value} value={value} label={prettyDialectName}>
              {!isDialectSupported(value, packageManager) ? (
                <UnsupportedDriver
                  dialect={prettyDialectName}
                  driverNPMPackage={driverNPMPackage}
                  packageManager={packageManager}
                />
              ) : (
                <>
                  <p>
                    Kysely's built-in {prettyDialectName} dialect uses the "
                    {driverNPMPackage}" driver library under the hood. Please
                    refer to its{' '}
                    <Link to={driverDocsURL}>official documentation</Link> for
                    configuration options.
                  </p>
                  {poolNPMPackage ? (
                    <p>
                      Additionally, Kysely's {prettyDialectName} dialect uses
                      the "{poolNPMPackage}" resource pool package for
                      connection pooling. Please refer to its{' '}
                      <Link to={poolDocsURL}>official documentation</Link> for
                      configuration options.
                    </p>
                  ) : null}
                  <p>
                    <strong>{installationCommand.intro}</strong>
                  </p>
                  <CodeBlock
                    language={installationCommand.language}
                    title={installationCommand.title}
                  >
                    {installationCommand.content}
                  </CodeBlock>
                </>
              )}
            </TabItem>
          )
        })}
      </Tabs>
      <IUseADifferentPackageManager
        packageManager={packageManager}
        packageManagerSelectionID={props.packageManagerSelectionID}
      />
      <Admonition type="info" title="Driverless">
        Kysely can also work in compile-only mode that doesn't require a
        database driver. Find out more at{' '}
        <Link to="/docs/recipes/splitting-query-building-and-execution">
          "Splitting query building and execution"
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

  const packageManagerName =
    PRETTY_PACKAGE_MANAGER_NAMES[packageManager || 'npm']

  return (
    <Admonition type="danger" title="Driver unsupported">
      Kysely's built-in {dialect} dialect does not work in {packageManagerName}{' '}
      because the driver library it uses, "{props.driverNPMPackage}", doesn't.
      You have to use a community {dialect} dialect that works in{' '}
      {packageManagerName}, or implement your own.
    </Admonition>
  )
}
