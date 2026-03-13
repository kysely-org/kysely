import { type Kysely } from '..'
import type { Database } from '../shared'
import { expectType } from 'tsd'

async function testMysqlJsonArrayAgg(db: Kysely<Database>) {
  const r1 = await db
    .selectFrom('pet')
    .innerJoin('person', 'pet.owner_id', 'person.id')
    .select((eb) => ['pet.name', eb.fn.jsonArrayAgg('person').as('people')])
    .groupBy('pet.name')
    .execute()

  expectType<
    {
      name: string
      people: {
        id: number
        first_name: string
        last_name: string | null
        age: number
        gender: 'male' | 'female' | 'other'
        marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
        modified_at: string
        deleted_at: string | null
      }[]
    }[]
  >(r1)

  const r2 = await db
    .selectFrom('pet')
    .innerJoin('person', 'pet.owner_id', 'person.id')
    .select((eb) => [
      'name',
      eb.fn.jsonArrayAgg('person.modified_at').as('modified_at'),
    ])
    .groupBy('name')
    .execute()

  expectType<
    {
      name: string
      modified_at: string[] | null
    }[]
  >(r2)
}
