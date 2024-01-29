import * as React from 'react'

export function Playground({
  code,
  setupCode = exampleSetup,
  kyselyVersion,
  dialect = 'postgres',
}: PlaygroundProps) {
  const state: PlaygroundState = {
    dialect,
    editors: { query: code, type: setupCode },
    hideType: true,
  }
  if (kyselyVersion) {
    state.kysely = { type: 'tag', name: kyselyVersion }
  }
  const hash = 'r' + encodeURIComponent(JSON.stringify(state))
  return (
    <iframe
      style={{
        width: '100%',
        minHeight: '600px',
        borderRadius: 7,
      }}
      allow="clipboard-write"
      src={`https://kyse.link/?theme=dark#${hash}`}
    />
  )
}

interface PlaygroundProps {
  kyselyVersion?: string
  dialect?: 'postgres'
  code: string
  setupCode?: string
}

interface PlaygroundState {
  dialect: 'postgres' | 'mysql' | 'mssql' | 'sqlite'
  editors: {
    type: string
    query: string
  }
  hideType?: boolean
  kysely?: {
    type: 'tag' | 'branch'
    name: string
  }
}

export const exampleSetup = `import { Generated } from 'kysely'

export interface Database {
    person: PersonTable
    pet: PetTable
}

interface PersonTable {
  id: Generated<string>
  first_name: string
  last_name: string | null
  created_at: Generated<Date>
  age: number
}

interface PetTable {
  id: Generated<string>
  name: string
  owner_id: string
  species: 'cat' | 'dog'
  is_favorite: boolean
}
`

export const exampleFilterById = `const person = await db
  .selectFrom('person')
  .select(['id', 'first_name'])
  .where('id', '=', '1')
  .executeTakeFirst()
`
