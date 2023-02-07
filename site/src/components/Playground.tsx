import * as React from 'react'
import { gray } from '@radix-ui/colors'

export function Playground({
  ts,
  kyselyVersion = '0.23.3',
  dialect = 'pg',
}: PlaygroundProps) {
  const params = new URLSearchParams()
  params.set('p', 'h')
  params.set('i', btoa(JSON.stringify({ ts, kyselyVersion, dialect })))

  return (
    <iframe
      style={{
        width: '100%',
        minHeight: '600px',
        border: `1px solid ${gray.gray11}`,
        padding: 4,
        borderRadius: 8,
        background: gray.gray12,
      }}
      src={`https://wirekang.github.io/kysely-playground/?${params.toString()}`}
    />
  )
}

interface PlaygroundProps {
  kyselyVersion?: '0.23.3'
  dialect?: 'pg'
  ts: string
}

export const exampleFindMultipleById = `
interface DB {
  user: UserTable
}

interface UserTable {
  id: Generated<string>
  first_name: string | null
  last_name: string | null
  created_at: Generated<Date>
}

result = kysely
  .selectFrom("user")
  .selectAll()
  .where("id", "in", ["1", "2", "3"])
`

export const exampleFindById = `
interface DB {
  user: UserTable
}

interface UserTable {
  id: Generated<string>
  first_name: string | null
  last_name: string | null
  created_at: Generated<Date>
}

result = kysely
  .selectFrom("user")
  .selectAll()
  .where("id", "=", "1")
`

export const exampleFindAllByAge = `
interface DB {
  user: UserTable
}

interface UserTable {
  id: Generated<string>
  first_name: string | null
  last_name: string | null
  created_at: Generated<Date>
  age: number
}

result = kysely
  .selectFrom("user")
  .selectAll()
  .where("age", ">", 18)
  .orderBy("age", "desc")
`

export const exampleDeleteById = `

interface DB {
  user: UserTable
}

interface UserTable {
  id: Generated<string>
  first_name: string | null
  last_name: string | null
  created_at: Generated<Date>
  age: number
}

result = kysely
  .deleteFrom('user')
  .where('id','=','1')

`

export const exampleUpdateById = `


interface DB {
  user: UserTable
}

interface UserTable {
  id: Generated<string>
  first_name: string | null
  last_name: string | null
  created_at: Generated<Date>
  age: number
}

result = kysely
  .updateTable('user')
  .set({age:10})
  .where('id','=','1')
`

export const exampleInsert = `
interface DB {
  user: UserTable
}

interface UserTable {
  id: Generated<string>
  first_name: string | null
  last_name: string | null
  created_at: Generated<Date>
  age: number
}

result = kysely
  .insertInto('user')
  .values([
  {
    first_name: 'Bob',
    last_name: 'Dilan',
    age: 5,
  },
  {
    first_name: 'Jimi',
    last_name: 'Hendrix',
    age: 5,
  },
])
`

export const exampleLeftOuterJoin = `
interface DB {
  user: UserTable
  pet: PetTable
}

interface UserTable {
  id: Generated<string>
  name: string | null
}

interface PetTable {
  id: Generated<string>
  name: string | null
  owner_id: string
}

result = kysely
  .selectFrom('pet')
  .innerJoin(
    'user', 
    'pet.owner_id', 
    'user.id'
  )
  .select([
    'pet.id as petId', 
    'pet.name as petName', 
    'user.name as userName'
])

`
