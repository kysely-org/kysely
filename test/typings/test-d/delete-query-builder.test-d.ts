import { expectError, expectType } from 'tsd'
import { Kysely, DeleteResult, Selectable } from '..'
import { Database, Person, Pet } from '../shared'

async function testDelete(db: Kysely<Database>) {
  const r1 = await db.deleteFrom('pet').where('id', '=', '1').executeTakeFirst()
  expectType<DeleteResult>(r1)

  const r2 = await db
    .deleteFrom('person')
    .using('pet')
    .where('pet.species', '=', 'cat')
    .executeTakeFirstOrThrow()
  expectType<DeleteResult>(r2)

  const r3 = await db
    .deleteFrom('person')
    .using(['pet', 'toy'])
    .where('pet.species', '=', 'cat')
    .executeTakeFirstOrThrow()
  expectType<DeleteResult>(r3)

  const r4 = await db
    .deleteFrom('person')
    .using(['person', 'pet'])
    .innerJoin('toy', 'toy.pet_id', 'pet.id')
    .where('pet.species', '=', 'cat')
    .executeTakeFirstOrThrow()
  expectType<DeleteResult>(r4)

  const r5 = await db
    .deleteFrom('person')
    .using(['person', 'pet'])
    .leftJoin('toy', 'toy.pet_id', 'pet.id')
    .where('pet.species', '=', 'cat')
    .executeTakeFirstOrThrow()
  expectType<DeleteResult>(r5)

  const r6 = await db
    .deleteFrom(['person', 'pet'])
    .using('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .where('person.id', '=', 1)
    .executeTakeFirstOrThrow()
  expectType<DeleteResult>(r6)

  const r7 = await db
    .deleteFrom(['person', 'pet'])
    .using('person')
    .leftJoin('pet', 'pet.owner_id', 'person.id')
    .where('person.id', '=', 1)
    .executeTakeFirstOrThrow()
  expectType<DeleteResult>(r7)

  expectError(db.deleteFrom('NO_SUCH_TABLE'))
  expectError(db.deleteFrom('pet').where('NO_SUCH_COLUMN', '=', '1'))
  expectError(db.deleteFrom('pet').whereRef('owner_id', '=', 'NO_SUCH_COLUMN'))
  expectError(db.deleteFrom(['pet', 'NO_SUCH_TABLE']))
  expectError(db.deleteFrom('pet').using('NO_SUCH_TABLE'))
  expectError(db.deleteFrom('pet').using(['pet', 'NO_SUCH_TABLE']))
  expectError(
    db.deleteFrom('pet').using('pet').innerJoin('NO_SUCH_TABLE', 'pet.id', 'b')
  )
  expectError(
    db
      .deleteFrom('pet')
      .using('pet')
      .innerJoin('person', 'NO_SUCH_COLUMN', 'pet.owner_id')
  )
  expectError(
    db.deleteFrom('pet').using('pet').leftJoin('NO_SUCH_TABLE', 'pet.id', 'b')
  )
  expectError(
    db
      .deleteFrom('pet')
      .using('pet')
      .leftJoin('person', 'NO_SUCH_COLUMN', 'pet.owner_id')
  )

  const r8 = await db
    .deleteFrom('person')
    .using(['person', 'pet'])
    .leftJoin('toy', 'toy.pet_id', 'pet.id')
    .where((eb) =>
      eb.or([eb('pet.species', '=', 'cat'), eb('toy.price', '=', 0)])
    )
    .returningAll('person')
    .execute()
  expectType<Selectable<Person>[]>(r8)

  const r9 = await db
    .deleteFrom('pet')
    .where('pet.species', '=', 'cat')
    .returningAll('pet')
    .execute()
  expectType<Selectable<Pet>[]>(r9)

  const r10 = await db
    .deleteFrom('person')
    .using(['person', 'pet'])
    .leftJoin('toy', 'toy.pet_id', 'pet.id')
    .where('pet.species', '=', 'cat')
    .returningAll(['pet', 'toy', 'person'])
    .execute()
  expectType<
    {
      id: number | string | null
      first_name: string
      last_name: string | null
      age: number
      gender: 'male' | 'female' | 'other'
      modified_at: Date
      marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null

      name: string
      owner_id: number
      species: 'dog' | 'cat'

      price: number | null
      pet_id: string | null
    }[]
  >(r10)

  const r11 = await db
    .deleteFrom('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .where('pet.species', '=', 'dog')
    .returningAll(['person', 'pet'])
    .execute()
  expectType<
    {
      id: number | string
      first_name: string
      last_name: string | null
      age: number
      gender: 'male' | 'female' | 'other'
      modified_at: Date
      marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null

      name: string
      owner_id: number
      species: 'dog' | 'cat'
    }[]
  >(r11)

  const r12 = await db
    .deleteFrom('pet')
    .where('pet.species', '=', 'cat')
    .returningAll(['pet'])
    .execute()
  expectType<Selectable<Pet>[]>(r12)

  const r13 = await db
    .deleteFrom('pet')
    .where('pet.species', '=', 'dog')
    .returningAll()
    .execute()
  expectType<Selectable<Pet>[]>(r13)

  const r14 = await db
    .deleteFrom('person')
    .using(['person', 'pet'])
    .leftJoin('toy', 'toy.pet_id', 'pet.id')
    .where('pet.species', '=', 'cat')
    .returningAll()
    .execute()
  expectType<
    {
      id: number | string | null
      first_name: string
      last_name: string | null
      age: number
      gender: 'male' | 'female' | 'other'
      modified_at: Date
      marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null

      name: string
      owner_id: number
      species: 'dog' | 'cat'

      price: number | null
      pet_id: string | null
    }[]
  >(r14)

  const r15 = await db
    .deleteFrom('person as p')
    .where('p.first_name', '=', 'Jennifer')
    .returning('p.id')
    .executeTakeFirstOrThrow()
  expectType<{ id: number }>(r15)
}

async function testIf(db: Kysely<Database>) {
  const r = await db
    .deleteFrom('person')
    .returning('id')
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f1'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f2'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f3'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f4'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f5'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f6'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f7'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f8'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f9'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f10'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f11'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f12'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f13'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f14'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f15'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f16'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f17'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f18'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f19'))
    .$if(Math.random() < 0.5, (qb) => qb.returning('first_name as f20'))
    .executeTakeFirstOrThrow()

  expectType<{
    id: number
    f1?: string
    f2?: string
    f3?: string
    f4?: string
    f5?: string
    f6?: string
    f7?: string
    f8?: string
    f9?: string
    f10?: string
    f11?: string
    f12?: string
    f13?: string
    f14?: string
    f15?: string
    f16?: string
    f17?: string
    f18?: string
    f19?: string
    f20?: string
  }>(r)
}
