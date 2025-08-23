import Admonition from '@theme/Admonition'
import CodeBlock from '@theme/CodeBlock'
import { IUseADifferentDialect } from './IUseADifferentDialect'
import { IUseADifferentPackageManager } from './IUseADifferentPackageManager'
import {
  getDriverNPMPackageNames,
  isDialectSupported,
  POOL_NPM_PACKAGE_NAMES,
  PRETTY_PACKAGE_MANAGER_NAMES,
  type Dialect,
  type PackageManager,
  type PropsWithDialect,
  DIALECT_CLASS_NAMES,
  PRETTY_DIALECT_NAMES,
  type PropsWithPackageManager,
  useSearchState,
  DIALECTS,
  DEFAULT_PACKAGE_MANAGER,
  DEFAULT_DIALECT,
  PACKAGE_MANAGERS,
} from './shared'

export type InstantiationProps = PropsWithDialect<PropsWithPackageManager>

export function Instantiation(props: InstantiationProps) {
  const { dialectSelectionID, packageManagerSelectionID } = props

  const dialect = useSearchState({
    defaultValue: DEFAULT_DIALECT,
    searchParam: props.dialectSearchParam,
    validator: (value) => DIALECTS.includes(value as never),
    value: props.dialect,
  })
  const packageManager = useSearchState({
    defaultValue: DEFAULT_PACKAGE_MANAGER,
    searchParam: props.packageManagerSearchParam,
    validator: (value) => PACKAGE_MANAGERS.includes(value as never),
    value: props.packageManager,
  })

  const dialectSpecificCodeSnippet = !isDialectSupported(
    dialect,
    packageManager,
  )
    ? getNotSupportedCode(dialect, packageManager)
    : getDialectSpecificCodeSnippet(dialect, packageManager)

  const dialectClassName = DIALECT_CLASS_NAMES[dialect]

  return (
    <>
      <p>
        <strong>Let's create a Kysely instance</strong>
        {isDialectSupported(dialect, packageManager) ? (
          <>
            <strong> using the built-in </strong>
            <code>{dialectClassName}</code>
            <strong> dialect</strong>
          </>
        ) : (
          <strong> assuming a compatible community dialect exists</strong>
        )}
        <strong>:</strong>
      </p>
      <CodeBlock language="ts" title="src/database.ts">
        {`import { Database } from './types.ts' // this is the Database interface we defined earlier
${dialectSpecificCodeSnippet}

// Database interface is passed to Kysely's constructor, and from now on, Kysely 
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how 
// to communicate with your database.
export const db = new Kysely<Database>({
  dialect,
})`}
      </CodeBlock>
      {dialectSelectionID || packageManagerSelectionID ? (
        <div style={{ display: 'flex', gap: '25px', justifyContent: 'end' }}>
          <IUseADifferentPackageManager
            packageManager={packageManager}
            packageManagerSelectionID={packageManagerSelectionID}
          />
          <IUseADifferentDialect
            dialect={dialect}
            dialectSelectionID={dialectSelectionID}
          />
        </div>
      ) : null}
      <Admonition type="tip" title="Singleton">
        In most cases, you should only create a single Kysely instance per
        database. Most dialects use a connection pool internally, or no
        connections at all, so there's no need to create a new instance for each
        request.
      </Admonition>
      <Admonition type="warning" title="keeping secrets">
        Use a secrets manager, environment variables (DO NOT commit `.env` files
        to your repository), or a similar solution, to avoid hardcoding database
        credentials in your code.
      </Admonition>
      <Admonition type="info" title="kill it with fire">
        When needed, you can dispose of the Kysely instance, release resources
        and close all connections by invoking the <code>db.destroy()</code>{' '}
        function.
      </Admonition>
    </>
  )
}

function getNotSupportedCode(
  dialect: Dialect,
  packageManager: PackageManager,
): string {
  return `/* Kysely doesn't support ${PRETTY_DIALECT_NAMES[dialect]} + ${
    PRETTY_PACKAGE_MANAGER_NAMES[packageManager || 'npm']
  } out of the box. Import a community dialect that does here. */
import { Kysely } from 'kysely'

const dialect = /* instantiate the dialect here */`
}

function getDialectSpecificCodeSnippet(
  dialect: Dialect,
  packageManager: PackageManager,
): string {
  const driverNPMPackageName = getDriverNPMPackageNames(packageManager)[dialect]
  const dialectClassName = DIALECT_CLASS_NAMES[dialect]
  const poolClassName = 'Pool'
  const poolClassImport =
    packageManager === 'deno' ? poolClassName : `{ ${poolClassName} }`

  if (dialect === 'postgresql') {
    return `import ${poolClassImport} from '${driverNPMPackageName}'
import { Kysely, ${dialectClassName} } from 'kysely'

const dialect = new ${dialectClassName}({
  pool: new ${poolClassName}({
    database: 'test',
    host: 'localhost',
    user: 'admin',
    port: 5434,
    max: 10,
  })
})`
  }

  if (dialect === 'mysql') {
    const poolFactoryName = 'createPool'

    return `import { ${poolFactoryName} } from '${driverNPMPackageName}' // do not use 'mysql2/promises'!
import { Kysely, ${dialectClassName} } from 'kysely'

const dialect = new ${dialectClassName}({
  pool: ${poolFactoryName}({
    database: 'test',
    host: 'localhost',
    user: 'admin',
    password: '123',
    port: 3308,
    connectionLimit: 10,
  })
})`
  }

  if (dialect === 'mssql') {
    const poolPackageName = POOL_NPM_PACKAGE_NAMES.mssql

    return `import * as ${driverNPMPackageName} from '${driverNPMPackageName}'
import * as ${poolPackageName} from '${poolPackageName}'
import { Kysely, ${dialectClassName} } from 'kysely'

const dialect = new ${dialectClassName}({
  ${poolPackageName}: {
    ...${poolPackageName},
    options: {
      min: 0,
      max: 10,
    },
  },
  ${driverNPMPackageName}: {
    ...${driverNPMPackageName},
    connectionFactory: () => new ${driverNPMPackageName}.Connection({
      authentication: {
        options: {
          password: 'password',
          userName: 'username',
        },
        type: 'default',
      },
      options: {
        database: 'some_db',
        port: 1433,
        trustServerCertificate: true,
      },
      server: 'localhost',
    }),
  },
})`
  }

  if (dialect === 'sqlite') {
    const driverImportName = 'SQLite'

    return `import ${driverImportName} from '${driverNPMPackageName}'
import { Kysely, ${dialectClassName} } from 'kysely'

const dialect = new ${dialectClassName}({
  database: new ${driverImportName}(':memory:'),
})`
  }

  throw new Error(`Unsupported dialect: ${dialect}`)
}
