import React from 'react'
import Link from '@docusaurus/Link'
import CodeBlock from '@theme/CodeBlock'
import type { Dialect, PropsWithDialect } from './types'

const dialectSpecificCodeSnippets: Record<
  Dialect,
  Record<'up' | 'down', string>
> = {
  postgresql: {
    up: `  await db.schema
    .createTable('person')
    .ifNotExists()
    .addColumn('id', 'serial', (cb) => cb.primaryKey())
    .addColumn('first_name', 'varchar', (cb) => cb.notNull())
    .addColumn('last_name', 'varchar')
    .addColumn('gender', 'varchar(50)', (cb) => cb.notNull())
    .addColumn('created_at', 'timestamp', (cb) => 
      cb.notNull().defaultTo(sql\`now()\`)
    )
    .execute()
    
  await db.schema
    .createTable('pet')
    .ifNotExists()
    .addColumn('id', 'serial', (cb) => cb.primaryKey())
    .addColumn('name', 'varchar', (cb) => cb.notNull().unique())
    .addColumn('owner_id', 'integer', (cb) => 
      cb.notNull().references('person.id').onDelete('cascade')
    )
    .addColumn('species', 'varchar', (cb) => cb.notNull())
    .execute()`,
    down: `  await db.schema.dropTable('pet').ifExists().execute()
    
  await db.schema.dropTable('person').ifExists().execute()`,
  },
  mysql: {
    up: `  await db.schema
    .createTable('person')
    .ifNotExists()
    .addColumn('id', 'integer', (cb) => cb.primaryKey().autoIncrement())
    .addColumn('first_name', 'varchar(255)', (cb) => cb.notNull())
    .addColumn('last_name', 'varchar(255)')
    .addColumn('gender', 'varchar(50)', (cb) => cb.notNull())
    .addColumn('created_at', 'timestamp', (cb) =>
      cb.notNull().defaultTo(sql\`now()\`)
    )
    .execute()
    
  await db.schema
    .createTable('pet')
    .ifNotExists()
    .addColumn('id', 'integer', (cb) => cb.primaryKey().autoIncrement())
    .addColumn('name', 'varchar(255)', (cb) => cb.notNull().unique())
    .addColumn('owner_id', 'int', (cb) =>
      cb.notNull().references('person.id').onDelete('cascade')
    )
    .addColumn('species', 'varchar(255)', (cb) => cb.notNull())
    .execute()`,
    down: `  await db.schema.dropTable('pet').ifExists().execute()
    
  await db.schema.dropTable('person').ifExists().execute()`,
  },
  sqlite: {
    up: `  await db.schema
    .createTable('person')
    .ifNotExists()
    .addColumn('id', 'integer', (cb) => cb.primaryKey().autoIncrement().notNull())
    .addColumn('first_name', 'varchar(255)', (cb) => cb.notNull())
    .addColumn('last_name', 'varchar(255)')
    .addColumn('gender', 'varchar(50)', (cb) => cb.notNull())
    .addColumn('created_at', 'timestamptz', (cb) =>
      cb.notNull().defaultTo(sql\`current_timestamp\`)
    )
    .execute()

  await db.schema
    .createTable('pet')
    .ifNotExists()
    .addColumn('id', 'integer', (cb) => cb.primaryKey().autoIncrement().notNull())
    .addColumn('name', 'varchar(255)', (cb) => cb.notNull().unique())
    .addColumn('owner_id', 'int', (cb) =>
      cb.notNull().references('person.id').onDelete('cascade')
    )
    .addColumn('species', 'varchar(255)', (cb) => cb.notNull())
    .execute()`,
    down: `  await db.schema.dropTable('pet').ifExists().execute()
    
  await db.schema.dropTable('person').ifExists().execute()`,
  },
}

export function Migrations(props: PropsWithDialect) {
  const dialectSpecificCodeSnippet =
    dialectSpecificCodeSnippets[props.dialect || 'postgresql']

  return (
    <>
      <p>
        Kysely supports DDL (Data Definition Language) queries and classic
        up/down migrations. Find out more at{' '}
        <Link to="/docs/migrations">Migrations</Link>.
        <br />
        <br />
        <strong>Let's create our first migration:</strong>
      </p>
      <CodeBlock language="ts" title="migrations/0000_humble-beginnings.ts">
        {`import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>) {
${dialectSpecificCodeSnippet.up}
}

export async function down(db: Kysely<any>) {
${dialectSpecificCodeSnippet.down}
}`}
      </CodeBlock>
      <p style={{ display: 'flex', justifyContent: 'end' }}>
        <Link to={props.dialectsURL}>I use a different database</Link>
      </p>
    </>
  )
}
