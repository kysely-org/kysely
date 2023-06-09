import React, { ReactNode } from 'react'
import Link from '@docusaurus/Link'
import CodeBlock from '@theme/CodeBlock'
import Admonition from '@theme/Admonition'
import {
  DRIVER_NPM_PACKAGE_NAMES,
  Dialect,
  PackageManager,
  PropsWithDialect,
  isDialectSupported,
  titlecase,
} from './shared'

const dialectSpecificCodeSnippets: Record<
  Dialect,
  (packageManager: PackageManager) => string | ReactNode
> = {
  postgresql: (packageManager) => `import { Pool } from '${
    packageManager === 'deno' ? 'pg-pool' : DRIVER_NPM_PACKAGE_NAMES.postgresql
  }'
import { Kysely, PostgresDialect } from 'kysely'

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
import { Kysely, MysqlDialect } from 'kysely'

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
import { Kysely, SQLiteDialect } from 'kysely'

const dialect = new SQLiteDialect({
  database: new SQLite(':memory:'),
})`
      : `/* Kysely doesn't support SQLite + ${titlecase(
          packageManager
        )} out of the box. Import a community dialect that does here. */
import { Kysely } from 'kysely'

const dialect = /* instantiate the dialect here */`,
}

const dialectClassNames: Record<Dialect, (packageManager: PackageManager) => string | null> = {
  postgresql: () => 'PostgresDialect',
  mysql: () => 'MysqlDialect',
  sqlite: (packageManager) => isDialectSupported('sqlite', packageManager) ? 'SQLiteDialect' : null,
}

export function Instantiation(
  props: PropsWithDialect<{
    packageManager: PackageManager | undefined
    packageManagersURL: string
  }>
) {
  const dialect = props.dialect || 'postgresql'
  const packageManager = props.packageManager || 'npm'

  const dialectSpecificCodeSnippet = dialectSpecificCodeSnippets[dialect](packageManager)
  const dialectClassName = dialectClassNames[dialect](packageManager)

  return (
    <>
      <p>
        <strong>Let's create a Kysely instance</strong>{
          dialectClassName ? 
            <>
              <strong> using the built-in </strong>
              <code>{dialectClassName}</code>
              <strong> dialect</strong>
            </> 
            : <strong> assuming a compatible community dialect exists</strong>
        }
        <strong>:</strong>
      </p>
      <CodeBlock language="ts" title="src/database.ts" >
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
      <p style={{ display: 'flex', gap: '25px', justifyContent: 'end' }}>
        <Link to={props.packageManagersURL}>
          I use a different package manager
        </Link>
        <Link to={props.dialectsURL}>I use a different database</Link>
      </p>
      <Admonition type="tip" title="Singleton">
        In most cases, you should only create a single Kysely instance per database.
        Most dialects use a connection pool internally, or no connections 
        at all, so there's no need to create a new instance for each request.
      </Admonition>
      <Admonition type="caution" title="keeping secrets">
        Use a secrets manager, environment variables (DO NOT commit `.env` files 
        to your repository), or a similar solution, to avoid hardcoding database 
        credentials in your code.
      </Admonition>
      <Admonition type="info" title="kill it with fire">
        When needed, you can dispose of the Kysely instance, release resources and close all connections by invoking 
        the <code>db.destroy()</code> function.
      </Admonition>
    </>
  )
}
