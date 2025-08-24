import Admonition from '@theme/Admonition'
import CodeBlock from '@theme/CodeBlock'
import Link from '@docusaurus/Link'
import { IUseADifferentDialect } from './IUseADifferentDialect'
import {
  DEFAULT_DIALECT,
  DIALECTS,
  useSearchState,
  type Dialect,
  type PropsWithDialect,
} from './shared'

const postgresqlCodeSnippet = `export async function createPerson(person: NewPerson) {
  return await db.insertInto('person')
    .values(person)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function deletePerson(id: number) {
  return await db.deleteFrom('person').where('id', '=', id)
    .returningAll()
    .executeTakeFirst()
}`

const dialectSpecificCodeSnippets: Record<Dialect, string> = {
  postgresql: postgresqlCodeSnippet,
  mysql: `export async function createPerson(person: NewPerson) {
  const { insertId } = await db.insertInto('person')
    .values(person)
    .executeTakeFirstOrThrow()

  return await findPersonById(Number(insertId!))
}

export async function deletePerson(id: number) {
  const person = await findPersonById(id)

  if (person) {
    await db.deleteFrom('person').where('id', '=', id).execute()
  }

  return person
}`,
  mssql: `// As of v0.27.0, Kysely doesn't support the \`OUTPUT\` clause. This will change
// in the future. For now, the following implementations achieve the same results
// as other dialects' examples, but with extra steps.

export async function createPerson(person: NewPerson) {
  const compiledQuery = db.insertInto('person').values(person).compile()

  const {
    rows: [{ id }],
  } = await db.executeQuery<Pick<Person, 'id'>>({
    ...compiledQuery,
    sql: \`\${compiledQuery.sql}; select scope_identity() as id\`
  })

  return await findPersonById(id)
}

export async function deletePerson(id: number) {
  const person = await findPersonById(id)

  if (person) {
    await db.deleteFrom('person').where('id', '=', id).execute()
  }

  return person
}`,
  sqlite: postgresqlCodeSnippet,
  // TODO: Update to use output clause once #687 is completed
}

export function Querying(props: PropsWithDialect) {
  const dialect = useSearchState({
    defaultValue: DEFAULT_DIALECT,
    searchParam: props.dialectSearchParam,
    validator: (value) => DIALECTS.includes(value as never),
    value: props.dialect,
  })

  const dialectSpecificCodeSnippet = dialectSpecificCodeSnippets[dialect]

  return (
    <>
      <p>
        <strong>Let's implement the person repository:</strong>
      </p>
      <CodeBlock language="ts" title="src/PersonRepository.ts">
        {`import { db } from './database'
import { PersonUpdate, Person, NewPerson } from './types'

export async function findPersonById(id: number) {
  return await db.selectFrom('person')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirst()
}

export async function findPeople(criteria: Partial<Person>) {
  let query = db.selectFrom('person')

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

export async function updatePerson(id: number, updateWith: PersonUpdate) {
  await db.updateTable('person').set(updateWith).where('id', '=', id).execute()
}

${dialectSpecificCodeSnippet}`}
      </CodeBlock>
      <IUseADifferentDialect
        dialect={dialect}
        dialectSelectionID={props.dialectSelectionID}
      />
      <Admonition type="info" title="But wait, there's more!">
        This is a simplified example with basic CRUD operations. Kysely supports
        many more SQL features including: joins, subqueries, complex boolean
        logic, set operations, CTEs, functions (aggregate and window functions
        included), raw SQL, transactions, DDL queries, etc.
        <br />
        Find out more at <Link to="/docs/category/examples">Examples</Link>.
      </Admonition>
    </>
  )
}
