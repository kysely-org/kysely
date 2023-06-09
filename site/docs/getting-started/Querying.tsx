import React from 'react'
import CodeBlock from '@theme/CodeBlock'
import Admonition from '@theme/Admonition'
import Link from '@docusaurus/Link'
import type { Dialect, PropsWithDialect } from './shared'

const postgresqlCodeSnippet = `export async function insertPerson(person: Insertable<PersonTable>) {
  return await db.insertInto('person')
    .values(person)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function deletePersonById(id: Person['id']) {
  return await db.deleteFrom('person').where('id', '=', id)
    .returningAll()
    .executeTakeFirst()
}`

const dialectSpecificCodeSnippets: Record<Dialect, string> = {
  postgresql: postgresqlCodeSnippet,
  mysql: `export async function insertPerson(person: Insertable<PersonTable>) {
  const { insertId } = await db.insertInto('person')
    .values(person)
    .executeTakeFirstOrThrow()
      
  return await findPersonById(insertId)
}

export async function deletePersonById(id: Person['id']) {
  const person = await findPersonById(id)

  if (person) {
    await db.deleteFrom('person').where('id', '=', id).execute()
  }

  return person
}`,
  sqlite: postgresqlCodeSnippet,
}

export function Querying(props: PropsWithDialect) {
  const dialect = props.dialect || 'postgresql'

  const dialectSpecificCodeSnippet = dialectSpecificCodeSnippets[dialect]

  return (
    <>
      <p>
        <strong>Let's implement the person repository:</strong>
      </p>
      <CodeBlock language="ts" title="src/PersonRepository.ts" showLineNumbers>
        {`import { Insertable, Selectable, Updateable } from 'kysely'
import { db } from './database'
import { PersonTable } from './types'

export type Person = Selectable<PersonTable>

export async function findPersonById(id: Person['id']) {
  return await db.selectFrom('person')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirst()
}

export async function findPeople(criteria: Partial<Person>) {
  const query = db.selectFrom('person')

  if (criteria.id) {
    query = query.where('id', '=', criteria.id) // Kysely is immutable, you must re-assign!
  }

  if (criteria.first_name) {
    query = query.where('first_name', '=', criteria.first_name)
  }

  if (criteria.last_name !== undefined) {
    query = query.where(
      'last_name', 
      criteria.last_name === null ? 'is' : '=', 
      criteria.last_name
    )
  }

  if (criteria.gender) {
    query = query.where('gender', '=', criteria.gender)
  }

  if (criteria.created_at) {
    query = query.where('created_at', '=', criteria.created_at)
  }

  return await query.selectAll().execute()
}

export async function updatePerson(id: Person['id'], updateWith: Updateable<PersonTable>) {
  await db.updateTable('person').set(updateWith).where('id', '=', id).execute()
}

${dialectSpecificCodeSnippet}`}
      </CodeBlock>
      <p style={{display: 'flex', justifyContent: 'end' }}>
        <Link to={props.dialectsURL}>I use a different database</Link>
      </p>
      <Admonition type='info' title="But wait, there's more!">
        This is a simplified example with basic CRUD operations. Kysely supports 
        many more SQL features including: joins, subqueries, complex boolean logic, 
        set operations, CTEs, functions (aggregate and window functions included), 
        raw SQL, transactions, DDL queries, etc.
        <br/>
        Find out more at <Link to="/docs/category/examples">Examples</Link>.
      </Admonition>
    </>
  ) 
}
