import { expectType } from 'tsd'

import {
  DeleteResult,
  Equals,
  InferResult,
  InsertResult,
  Kysely,
  MergeResult,
  Selectable,
  UpdateResult,
} from '..'
import { Database, Person, Pet } from '../shared'

function testInferResultSelectQuery(db: Kysely<Database>) {
  const query0 = db.selectFrom('person').selectAll()
  const compiledQuery0 = query0.compile()

  type Expected0 = Selectable<Person>[]
  expectType<Equals<Expected0, InferResult<typeof query0>>>(true)
  expectType<Equals<Expected0, InferResult<typeof compiledQuery0>>>(true)

  const query1 = db.selectFrom('person').select(['id', 'first_name'])
  const compiledQuery1 = query1.compile()

  type Expected1 = { id: number; first_name: string }[]
  expectType<Equals<Expected1, InferResult<typeof query1>>>(true)
  expectType<Equals<Expected1, InferResult<typeof compiledQuery1>>>(true)

  const query2 = db
    .selectFrom('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .select(['person.first_name', 'pet.name'])
  const compiledQuery2 = query2.compile()

  type Expected2 = { first_name: string; name: string }[]
  expectType<Equals<Expected2, InferResult<typeof query2>>>(true)
  expectType<Equals<Expected2, InferResult<typeof compiledQuery2>>>(true)
}

function testInferResultInsertQuery(db: Kysely<Database>) {
  const query0 = db.insertInto('person').values({
    first_name: 'Foo',
    last_name: 'Barson',
    gender: 'other',
    age: 15,
  })
  const compiledQuery0 = query0.compile()

  type Expected0 = InsertResult
  expectType<Equals<Expected0, InferResult<typeof query0>>>(true)
  expectType<Equals<Expected0, InferResult<typeof compiledQuery0>>>(true)

  const query1 = query0.returningAll()
  const compiledQuery1 = query1.compile()

  type Expected1 = Selectable<Person>[]
  expectType<Equals<Expected1, InferResult<typeof query1>>>(true)
  expectType<Equals<Expected1, InferResult<typeof compiledQuery1>>>(true)

  const query2 = query0.returning('modified_at')
  const compiledQuery2 = query2.compile()

  type Expected2 = { modified_at: Date }[]
  expectType<Equals<Expected2, InferResult<typeof query2>>>(true)
  expectType<Equals<Expected2, InferResult<typeof compiledQuery2>>>(true)
}

function testInferResultUpdateQuery(db: Kysely<Database>) {
  const query0 = db
    .updateTable('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .set({ last_name: 'Jennifer' })
    .where('pet.id', '=', '1')
  const compiledQuery0 = query0.compile()

  type Expected0 = UpdateResult
  expectType<Equals<Expected0, InferResult<typeof query0>>>(true)
  expectType<Equals<Expected0, InferResult<typeof compiledQuery0>>>(true)

  const query1 = query0.returningAll()
  const compiledQuery1 = query1.compile()

  type Expected1 = {
    id: string | number
    first_name: string
    last_name: string | null
    age: number
    gender: 'male' | 'female' | 'other'
    marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
    modified_at: Date
    deleted_at: Date | null
    name: string
    owner_id: number
    species: 'dog' | 'cat'
  }[]

  const expected1: Expected1 = undefined!
  expectType<InferResult<typeof query1>>(expected1)
  expectType<InferResult<typeof compiledQuery1>>(expected1)

  const query2 = query0.returning('modified_at')
  const compiledQuery2 = query2.compile()

  type Expected2 = { modified_at: Date }[]
  expectType<Equals<Expected2, InferResult<typeof query2>>>(true)
  expectType<Equals<Expected2, InferResult<typeof compiledQuery2>>>(true)
}

function testInferResultDeleteQuery(db: Kysely<Database>) {
  const query0 = db.deleteFrom('pet').where('id', '=', '1')
  const compiledQuery0 = query0.compile()

  type Expected0 = DeleteResult
  expectType<Equals<Expected0, InferResult<typeof query0>>>(true)
  expectType<Equals<Expected0, InferResult<typeof compiledQuery0>>>(true)

  const query1 = query0.returningAll()
  const compiledQuery1 = query1.compile()

  type Expected1 = Selectable<Pet>[]
  expectType<Equals<Expected1, InferResult<typeof query1>>>(true)
  expectType<Equals<Expected1, InferResult<typeof compiledQuery1>>>(true)

  const query2 = query0.returning('id')
  const compiledQuery2 = query2.compile()

  type Expected2 = { id: string }[]
  expectType<Equals<Expected2, InferResult<typeof query2>>>(true)
  expectType<Equals<Expected2, InferResult<typeof compiledQuery2>>>(true)
}

function testInferResultMergeQuery(db: Kysely<Database>) {
  const query0 = db
    .mergeInto('person')
    .using('pet', 'pet.owner_id', 'person.id')
    .whenMatched()
    .thenDelete()
  const compiledQuery0 = query0.compile()

  type Expected0 = MergeResult
  expectType<Equals<Expected0, InferResult<typeof query0>>>(true)
  expectType<Equals<Expected0, InferResult<typeof compiledQuery0>>>(true)
}
