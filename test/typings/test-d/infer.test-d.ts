import { expectType } from 'tsd'

import {
  DeleteResult,
  Infer,
  InsertResult,
  Kysely,
  Selectable,
  UpdateResult,
} from '..'
import { Database, Equals, Person, Pet } from '../shared'

function testInferSelectQuery(db: Kysely<Database>) {
  const query0 = db.selectFrom('person').selectAll()
  const compiledQuery0 = query0.compile()

  type Expected0 = Selectable<Person>[]
  expectType<Equals<Expected0, Infer<typeof query0>>>(true)
  expectType<Equals<Expected0, Infer<typeof compiledQuery0>>>(true)

  const query1 = db.selectFrom('person').select(['id', 'first_name'])
  const compiledQuery1 = query1.compile()

  type Expected1 = { id: number; first_name: string }[]
  expectType<Equals<Expected1, Infer<typeof query1>>>(true)
  expectType<Equals<Expected1, Infer<typeof compiledQuery1>>>(true)

  const query2 = db
    .selectFrom('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .select(['person.first_name', 'pet.name'])
  const compiledQuery2 = query2.compile()

  type Expected2 = { first_name: string; name: string }[]
  expectType<Equals<Expected2, Infer<typeof query2>>>(true)
  expectType<Equals<Expected2, Infer<typeof compiledQuery2>>>(true)
}

function testInferInsertQuery(db: Kysely<Database>) {
  const query0 = db.insertInto('person').values({
    first_name: 'Foo',
    last_name: 'Barson',
    gender: 'other',
    age: 15,
  })
  const compiledQuery0 = query0.compile()

  type Expected0 = InsertResult
  expectType<Equals<Expected0, Infer<typeof query0>>>(true)
  expectType<Equals<Expected0, Infer<typeof compiledQuery0>>>(true)

  const query1 = query0.returningAll()
  const compiledQuery1 = query1.compile()

  type Expected1 = Selectable<Person>[]
  expectType<Equals<Expected1, Infer<typeof query1>>>(true)
  expectType<Equals<Expected1, Infer<typeof compiledQuery1>>>(true)

  const query2 = query0.returning('modified_at')
  const compiledQuery2 = query2.compile()

  type Expected2 = { modified_at: Date }[]
  expectType<Equals<Expected2, Infer<typeof query2>>>(true)
  expectType<Equals<Expected2, Infer<typeof compiledQuery2>>>(true)
}

function testInferUpdateQuery(db: Kysely<Database>) {
  const query0 = db
    .updateTable('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .set({ last_name: 'Jennifer' })
    .where('pet.id', '=', '1')
  const compiledQuery0 = query0.compile()

  type Expected0 = UpdateResult
  expectType<Equals<Expected0, Infer<typeof query0>>>(true)
  expectType<Equals<Expected0, Infer<typeof compiledQuery0>>>(true)

  const query1 = query0.returningAll()
  const compiledQuery1 = query1.compile()

  type Expected1 = Selectable<Person | Pet>[]
  expectType<Equals<Expected1, Infer<typeof query1>>>(true)
  expectType<Equals<Expected1, Infer<typeof compiledQuery1>>>(true)

  const query2 = query0.returning('modified_at')
  const compiledQuery2 = query2.compile()

  type Expected2 = { modified_at: Date }[]
  expectType<Equals<Expected2, Infer<typeof query2>>>(true)
  expectType<Equals<Expected2, Infer<typeof compiledQuery2>>>(true)
}

function testInferDeleteQuery(db: Kysely<Database>) {
  const query0 = db.deleteFrom('pet').where('id', '=', '1')
  const compiledQuery0 = query0.compile()

  type Expected0 = DeleteResult
  expectType<Equals<Expected0, Infer<typeof query0>>>(true)
  expectType<Equals<Expected0, Infer<typeof compiledQuery0>>>(true)

  const query1 = query0.returningAll()
  const compiledQuery1 = query1.compile()

  type Expected1 = Selectable<Pet>[]
  expectType<Equals<Expected1, Infer<typeof query1>>>(true)
  expectType<Equals<Expected1, Infer<typeof compiledQuery1>>>(true)

  const query2 = query0.returning('id')
  const compiledQuery2 = query2.compile()

  type Expected2 = { id: string }[]
  expectType<Equals<Expected2, Infer<typeof query2>>>(true)
  expectType<Equals<Expected2, Infer<typeof compiledQuery2>>>(true)
}
