import * as React from "react"
import { gray } from "@radix-ui/colors"

export function Playground({
  ts,
  kyselyVersion,
  dialect = "postgres",
}: PlaygroundProps) {
  const params = new URLSearchParams()
  params.set("p", "h")
  params.set("i", btoa(JSON.stringify({ ts: ts.trim(), kyselyVersion, dialect })))

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
      src={`https://wirekang.github.io/kysely-playground/?${params.toString()}`}
    />
  )
}

interface PlaygroundProps {
  kyselyVersion?: string
  dialect?: "postgres"
  ts: string
}

export function createExample(example: string): string {
  return `
${exampleSetup}

result = ${example}
`
}

export const exampleSetup = `
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
}`

export const exampleFindMultipleById = `db
  .selectFrom('person')
  .selectAll()
  .where('id', 'in', ['1', '2', '3'])
`

export const exampleFindById = `db
  .selectFrom('person')
  .selectAll()
  .where('id', '=', '1')
`

export const exampleFindAllByAge = `db
  .selectFrom('person')
  .selectAll()
  .where('age', '>', 18)
  .orderBy('age', 'desc')
`

export const exampleFindBySubquery = `db
  .selectFrom('person')
  .selectAll()
  .where('id', 'in', ['1', '2', '3'])
`

export const exampleDeleteById = `db
  .deleteFrom('person')
  .where('id', '=', '1')
`

export const exampleUpdateById = `db
  .updateTable('person')
  .set({ age: 10 })
  .where('id', '=', '1')
`

export const exampleInsert = `db
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
`

export const exampleLeftOuterJoin = `db
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
`
