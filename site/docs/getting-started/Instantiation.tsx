import React, { ReactNode } from 'react'
import Link from '@docusaurus/Link'
import CodeBlock from '@theme/CodeBlock'
import {
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
    packageManager === 'deno' ? 'pg-pool' : 'pg'
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
    () => `import { createPool } from 'mysql2' // do not use 'mysql2/promises'!
import { Kysely, MySQLDialect } from 'kysely'

const dialect = new MySQLDialect({
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
      ? `import * as SQLite from 'better-sqlite3'
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

export function Instantiation(
  props: PropsWithDialect<{
    packageManager: PackageManager | undefined
    packageManagersURL: string
  }>
) {
  const dialect = props.dialect || 'postgresql'
  const packageManager = props.packageManager || 'npm'

  const dialectSpecificCodeSnippet = dialectSpecificCodeSnippets[dialect]

  return (
    <>
      <CodeBlock language="ts" title="src/database.ts" showLineNumbers>
        {`import { Database } from './types.ts' // this is the Database interface we defined earlier
${dialectSpecificCodeSnippet(packageManager)}

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
    </>
  )
}
