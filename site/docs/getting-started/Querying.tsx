import React from 'react'
import CodeBlock from '@theme/CodeBlock'
import type { Dialect, PropsWithDialect } from './shared'

const dialectSpecificCodeSnippets: Record<Dialect, string> = {
  postgresql: `export type Person = Selectable<PersonTable>

export async function findPersonById(id: Person['id']) {
  return await db.selectFrom('person')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirst()
}

export async function findPeople(criteria: Partial<Person>) {
  return await db.selectFrom('person')
    .$call((qb) => 
      Object.entries(criteria).reduce((qb, [key, value]) =>
        qb.where(key as any, value === null ? 'is' : '=', value),
        qb
      )
    )
    .selectAll()
    .execute()
}

export async function insertPerson(person: Insertable<PersonTable>) {
  return await db.insertInto('person')
    .values(person)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function updatePerson(id: Person['id'], updateWith: Updateable<PersonTable>) {
  await db.updateTable('person')
    .set(updateWith)
    .where('id', '=', id)
    .execute()
}

export async function deletePersonById(id: Person['id']) {
  return await db.deleteFrom('person')
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst()
}`,
  mysql: ``,
  sqlite: ``,
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
import { PersonTable, PetTable } from './types'

${dialectSpecificCodeSnippet}`}
      </CodeBlock>
    </>
  )
}
