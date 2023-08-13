import React, { type ReactNode } from 'react'
import Admonition from '@theme/Admonition'
import CodeBlock from '@theme/CodeBlock'
import { IUseADifferentDatabase } from './IUseADifferentDatabase'
import { IUseADifferentPackageManager } from './IUseADifferentPackageManager'
import {
  DRIVER_NPM_PACKAGE_NAMES,
  isDialectSupported,
  PRETTY_PACKAGE_MANAGER_NAMES,
  type Dialect,
  type PackageManager,
  type PropsWithDialect,
} from './shared'

const dialectSpecificCodeSnippets: Record<
  Dialect,
  (packageManager: PackageManager) => string | ReactNode
> = {
  postgresql: (packageManager) => `import { Pool } from '${
    packageManager === 'deno' ? 'pg-pool' : DRIVER_NPM_PACKAGE_NAMES.postgresql
  }'
import { kysely, PostgresDialect, InferDB } from 'kysely'

const dialect = new PostgresDialect({
  pool: new Pool({
    database: 'test',
    host: 'localhost',
    user: 'admin',
    port: 5434,
    max: 10,
  })
})`,
  mysql:
    () => `import { createPool } from '${DRIVER_NPM_PACKAGE_NAMES.mysql}' // do not use 'mysql2/promises'!
import { kysely, MysqlDialect } from 'kysely'

const dialect = new MysqlDialect({
  pool: createPool({
    database: 'test',
    host: 'localhost',
    user: 'admin',
    password: '123',
    port: 3308,
    connectionLimit: 10,
  })
})`,
  sqlite: (packageManager) =>
    isDialectSupported('sqlite', packageManager)
      ? `import * as SQLite from '${DRIVER_NPM_PACKAGE_NAMES.sqlite}'
import { kysely, SqliteDialect } from 'kysely'

const dialect = new SqliteDialect({
  database: new SQLite(':memory:'),
})`
      : `/* Kysely doesn't support SQLite + ${
          PRETTY_PACKAGE_MANAGER_NAMES[packageManager || 'npm']
        } out of the box. Import a community dialect that does here. */
import { kysely } from 'kysely'

const dialect = /* instantiate the dialect here */`,
}

const dialectClassNames: Record<
  Dialect,
  (packageManager: PackageManager) => string | null
> = {
  postgresql: () => 'PostgresDialect',
  mysql: () => 'MysqlDialect',
  sqlite: (packageManager) =>
    isDialectSupported('sqlite', packageManager) ? 'SqliteDialect' : null,
}

export function Instantiation(
  props: PropsWithDialect<{
    packageManager: PackageManager | undefined
    packageManagersURL: string
  }>
) {
  const dialect = props.dialect || 'postgresql'
  const packageManager = props.packageManager || 'npm'

  const dialectSpecificCodeSnippet =
    dialectSpecificCodeSnippets[dialect](packageManager)
  const dialectClassName = dialectClassNames[dialect](packageManager)

  return (
    <>
      <p>
        <strong>Let's create a Kysely instance</strong>
        {dialectClassName ? (
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
        {`import { Tables } from './types.ts' // this is the Tables interface we defined earlier
${dialectSpecificCodeSnippet}

// Tables interface is passed to the kysely function, and from now on, Kysely 
// knows your database structure.
// Dialect is passed to the dialect method, and from now on, Kysely knows how 
// to communicate with your database.
export const db = kysely<Tables>()
  .dialect(dialect)
  .build()

// The type of the db variable above is Kysely<DB>. This gives you the DB type.
export type DB = InferDB<typeof db>
`}
      </CodeBlock>
      <p style={{ display: 'flex', gap: '25px', justifyContent: 'end' }}>
        <IUseADifferentPackageManager {...props} />
        <IUseADifferentDatabase {...props} />
      </p>
      <Admonition type="tip" title="Singleton">
        In most cases, you should only create a single Kysely instance per
        database. Most dialects use a connection pool internally, or no
        connections at all, so there's no need to create a new instance for each
        request.
      </Admonition>
      <Admonition type="caution" title="keeping secrets">
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
