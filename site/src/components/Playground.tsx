import * as React from 'react'
import { gray } from '@radix-ui/colors'

export function Playground({
  code,
  setupCode = exampleSetup,
  kyselyVersion,
  dialect = 'postgres',
}: PlaygroundProps) {
  const params = new URLSearchParams()
  params.set('p', 'j')
  params.set(
    'i',
    JSON.stringify({
      q: code.trim(),
      s: setupCode.trim(),
      v: kyselyVersion,
      d: dialect,
      c: false,
    })
  )

  return (
    <iframe
      style={{
        width: '100%',
        minHeight: '600px',
        borderRadius: 7,
      }}
      allow="clipboard-write"
      src={`https://kyse.link/?${params.toString()}`}
    />
  )
}

interface PlaygroundProps {
  kyselyVersion?: string
  dialect?: 'postgres'
  code: string
  setupCode?: string
}

export const exampleSetup = `
import { Generated } from 'kysely'

declare global {
  interface DB {
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
}
`

export const exampleFilterById = `const person = await db
  .selectFrom('person')
  .select(['id', 'first_name'])
  .where('id', '=', '1')
  .executeTakeFirst()
`
