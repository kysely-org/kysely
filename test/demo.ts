import { Kysely } from '../src'

interface Person {
  id: number
  first_name: string
  last_name: string
  age: number
  gender: 'male' | 'female' | 'other'
}

interface Pet {
  id: string
  name: string
  owner_id: number
  species: 'dog' | 'cat'
}

interface Movie {
  id: string
  stars: number
}

interface Database {
  person: Person
  pet: Pet
  movie: Movie
}

const db = new Kysely<Database>({
  dialect: 'postgres',
  host: 'localhost',
  database: 'kysely_test',
})

async function demo() {
  const [person] = await db
    .selectFrom('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .select(['first_name', 'pet.name as pet_name'])
    .where('person.id', '=', 1)
    .execute()

  person.pet_name
}
