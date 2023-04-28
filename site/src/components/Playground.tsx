import * as React from "react"
import { gray } from "@radix-ui/colors"

export function Playground({
  code,
  setupCode = exampleSetup,
  kyselyVersion,
  dialect = "postgres",
}: PlaygroundProps) {
  console.log("code", code)
  const params = new URLSearchParams()
  params.set("p", "j")
  params.set("i", JSON.stringify({
    q: code.trim(),
    s: setupCode.trim(),
    v: kyselyVersion,
    d: dialect,
    c: false
  }))

  return (
    <iframe
      style={{
        width: "100%",
        minHeight: "600px",
        border: `1px solid ${gray.gray11}`,
        padding: 4,
        borderRadius: 8,
        background: gray.gray12,
      }}
      allow="clipboard-write"
      src={`https://kyse.link/?${params.toString()}`}
    />
  )
}

interface PlaygroundProps {
  kyselyVersion?: string
  dialect?: "postgres"
  code: string
  setupCode?: string,
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
  }
}
`

export const exampleFindMultipleById = `const res = await db
  .selectFrom('person')
  .selectAll()
  .where('id', 'in', ['1', '2', '3'])
  .execute()
`

export const exampleFindById = `const res = await db
  .selectFrom('person')
  .selectAll()
  .where('id', '=', '1')
  .execute()
`

export const exampleFindAllByAge = `const res = await db
  .selectFrom('person')
  .selectAll()
  .where('age', '>', 18)
  .orderBy('age', 'desc')
  .execute()
`

export const exampleFindBySubquery = `const res = await db
  .selectFrom('person')
  .selectAll()
  .where('id', 'in', ['1', '2', '3'])
  .execute()
`

export const exampleDeleteById = `const res = await db
  .deleteFrom('person')
  .where('id', '=', '1')
  .execute()
`

export const exampleUpdateById = `const res = await db
  .updateTable('person')
  .set({ age: 10 })
  .where('id', '=', '1')
  .execute()
`

export const exampleInsert = `const res = await db
  .insertInto('person')
  .values([
    {
      first_name: 'Bob',
      last_name: 'Dylan',
      age: 5,
    },
    {
      first_name: 'Jimi',
      last_name: 'Hendrix',
      age: 5,
    }
  ])
  .execute()
`

export const exampleInnerJoin = `const res = await db
  .selectFrom('pet')
  .innerJoin(
    'person',
    'pet.owner_id',
    'person.id'
  )
  .select([
    'pet.id as petId',
    'pet.name as petName',
    'person.first_name as personName'
  ])
  .execute()
`
