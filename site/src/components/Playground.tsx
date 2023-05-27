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

export const exampleSelectColumns = `const persons = await db
  .selectFrom('person')
  .select(['id', 'first_name as first'])
  .execute()
`

export const exampleSelectAllColumns = `const persons = await db
  .selectFrom('person')
  .selectAll()
  .execute()
`

export const exampleSelectAllColumnsOfATable = `const pets = await db
  .selectFrom(['person as owner', 'pet'])
  // Select all columns of the pet table.
  .selectAll('pet')
  // Also select the pet's owner's last name.
  .select('owner.last_name as owner_last_name')
  .whereRef('owner.id', '=', 'pet.owner_id')
  .where('owner.first_name', '=', 'Jennifer')
  .execute()
`

export const exampleFilterById = `const person = await db
  .selectFrom('person')
  .select(['id', 'first_name'])
  .where('id', '=', '1')
  .executeTakeFirst()
`

export const exampleFilterBySimpleCondition = `const persons = await db
  .selectFrom('person')
  .selectAll()
  .where('age', '>=', 18)
  .where('age', '<=', 60)
  .orderBy('age', 'desc')
  .execute()
`

export const exampleFilterByOptionalConditions = `const firstName = Math.random() < 0.5 
  ? 'Jennifer'
  : undefined

const lastName = Math.random() < 0.5 
  ? 'Aniston' 
  : undefined

let query = db
  .selectFrom('person')
  .selectAll()
  .orderBy('age', 'desc')

if (firstName) {
  // The query builder is immutable. Remember to always
  // reassign the result of method calls.
  query = query.where('first_name', '=', firstName)
}

if (lastName) {
  query = query.where('first_name', '=', lastName)
}

const persons = await query.execute()
`

export const exampleFilterByOrCondition = `const persons = await db
  .selectFrom('person')
  .selectAll()
  .where(({ and, or, cmpr }) => and([
    or([
      cmpr('first_name', '=', 'Jennifer'),
      cmpr('first_name', '=', 'Sylvester')
    ]),
    or([
      cmpr('last_name', '=', 'Aniston'),
      cmpr('last_name', '=', 'Stallone')
    ])
  ]))
  .execute()
`

export const exampleFilterByList = `const persons = await db
  .selectFrom('person')
  .selectAll()
  .where('id', 'in', ['1', '2', '3'])
  .execute()
`

export const exampleFilterBySubquery = `const persons = await db
  .selectFrom('person')
  .selectAll()
  .where('id', 'in', (eb) => eb
    .selectFrom('pet')
    .select('owner_id')
    .where('species', '=', 'dog')
  )
  .execute()
`

export const exampleFunctionCallsInAWhereStatement = `import { sql } from 'kysely'

const persons = await db
  .selectFrom('person')
  .selectAll()
  // Both the first and the last argument of the where
  // method can be callbacks.
  .where(
    (eb) => eb.fn('upper', ['first_name']), 
    '=', 
    'JENNIFER'
  )
  // Alternatively you can use the single callback version.
  .where(({ cmpr, fn }) =>
    cmpr(fn('upper', ['first_name']), '=', 'JENNIFER')
  )
  // Or you can simply use raw SQL if you prefer readability
  // over type-safety.
  .where(sql\`upper(first_name)\`, '=', 'JENNIFER')
  // You can even stick the whole condition to an SQL
  // snippet if you prefer
  .where(sql\`upper(first_name) = \${'JENNIFER'}\`)
  .execute()
`

export const exampleSimpleJoin = `const res = await db
  .selectFrom('pet')
  .innerJoin(
    'person',
    'pet.owner_id',
    'person.id'
  )
  .select([
    'pet.id as pet_id',
    'pet.name as pet_name',
    'person.first_name as person_name'
  ])
  .execute()
`

export const exampleComplexJoin = `const res = await db
  .selectFrom('pet')
  .leftJoin(
    'person as adult_owner',
    (join) => join
      .onRef('pet.owner_id', '=', 'adult_owner.id')
      .on('adult_owner.age', '>', 18),
  )
  .select([
    'pet.id as pet_id',
    'pet.name as pet_name',
    'adult_owner.last_name as owner_first_name'
  ])
  .execute()
`

export const exampleJoinASubquery = `const res = await db
  .selectFrom('pet')
  .innerJoin(
    (eb) => eb
      .selectFrom('person')
      .select(['id', 'last_name'])
      .where('first_name', '=', 'Jennifer')
      .as('p'),
    (join) => join.onRef('pet.owner_id', '=', 'p.id'),
  )
  .select([
    'pet.id as pet_id',
    'pet.name as pet_name',
    'p.last_name as person_last_name'
  ])
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

export const exampleUpdateById = `const res = await db
  .updateTable('person')
  .set({ age: 10 })
  .where('id', '=', '1')
  .execute()
`

export const exampleDeleteById = `const res = await db
  .deleteFrom('person')
  .where('id', '=', '1')
  .execute()
`
