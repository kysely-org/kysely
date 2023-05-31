import React from 'react'
import Link from '@docusaurus/Link'
import CodeBlock from '@theme/CodeBlock'
import type { Dialect } from './types'

export interface InstantiationProps {
  dialect: Dialect
  dialectsURL: string
}

const dialectSpecificCodeSnippets: Record<Dialect, string> = {
  postgresql: `import { Pool } from 'pg'
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
  mysql: `import { createPool } from 'mysql2' // do not use 'mysql2/promises'!
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
  sqlite: `import * as SQLite from 'better-sqlite3'
import {Kysely, SQLiteDialect} from 'kysely'

const dialect = new SQLiteDialect({
  database: new SQLite(':memory:'),
})`,
}

export function Instantiation(props: InstantiationProps) {
  const dialectSpecificCodeSnippet =
    dialectSpecificCodeSnippets[props.dialect] ||
    dialectSpecificCodeSnippets.postgresql

  return (
    <>
      <CodeBlock language="ts" title="kysely.ts">
        {`import { Database } from './database.ts' // this is the Database interface we defined earlier
${dialectSpecificCodeSnippet}

// Database interface is passed to Kysely's constructor, and from now on, Kysely 
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how 
// to communicate with your database.
export const db = new Kysely<Database>({
  dialect,
})`}
      </CodeBlock>
      <p style={{ display: 'flex', justifyContent: 'end' }}>
        <Link to={props.dialectsURL}>I use a different database</Link>
      </p>
    </>
  )
}
