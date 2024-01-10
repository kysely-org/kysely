import {
  AnyQueryBuilder,
  DeleteResult,
  InsertResult,
  Kysely,
  MatchedThenableMergeQueryBuilder,
  MergeQueryBuilder,
  MergeResult,
  NotMatchedThenableMergeQueryBuilder,
  UpdateResult,
  WheneableMergeQueryBuilder,
  isDeleteQueryBuilder,
  isInsertQueryBuilder,
  isMergeQueryBuilder,
  isSelectQueryBuilder,
  isUpdateQueryBuilder,
} from '..'
import { Database } from '../shared'
import { expectType } from 'tsd'

function testIsSelectQueryBuilder(db: Kysely<Database>) {
  const query: AnyQueryBuilder<Database, 'person', { age: number }> = db
    .selectFrom('person')
    .select('age')
  expectType<true>(query.isSelectQueryBuilder)
  expectType<boolean>(isSelectQueryBuilder(query))
}

function testIsInsertQueryBuilder(db: Kysely<Database>) {
  const query: AnyQueryBuilder<Database, 'person', InsertResult> = db
    .insertInto('person')
    .values({
      first_name: 'David',
      last_name: 'Bowie',
      gender: 'male',
      age: 69,
    })
  expectType<true>(query.isInsertQueryBuilder)
  expectType<boolean>(isInsertQueryBuilder(query))
}

function testIsUpdateQueryBuilder(db: Kysely<Database>) {
  const query: AnyQueryBuilder<Database, 'pet', UpdateResult> = db
    .updateTable('pet')
    .where('name', '=', 'Max')
    .set({ name: 'Dana' })
  expectType<true>(query.isUpdateQueryBuilder)
  expectType<boolean>(isUpdateQueryBuilder(query))
}

function testIsDeleteQueryBuilder(db: Kysely<Database>) {
  const query: AnyQueryBuilder<Database, 'person', DeleteResult> = db
    .deleteFrom('person')
    .where('gender', '=', 'male')
  expectType<true>(query.isDeleteQueryBuilder)
  expectType<boolean>(isDeleteQueryBuilder(query))
}

function testIsMergeQueryBuilder(db: Kysely<Database>) {
  let query: AnyQueryBuilder<Database, 'person', MergeResult> =
    db.mergeInto('person')
  expectType<MergeQueryBuilder<Database, 'person', MergeResult>>(query)
  expectType<true>(query.isMergeQueryBuilder)
  expectType<boolean>(isMergeQueryBuilder(query))

  query = db.mergeInto('person').using('pet', 'pet.owner_id', 'person.id')
  expectType<
    WheneableMergeQueryBuilder<Database, 'person', 'pet', MergeResult>
  >(query)
  expectType<true>(query.isMergeQueryBuilder)
  expectType<boolean>(isMergeQueryBuilder(query))

  query = db
    .mergeInto('person')
    .using('pet', 'pet.owner_id', 'person.id')
    .whenMatched()
  expectType<
    MatchedThenableMergeQueryBuilder<
      Database,
      'person',
      'pet',
      'person' | 'pet',
      MergeResult
    >
  >(query)
  expectType<true>(query.isMergeQueryBuilder)
  expectType<boolean>(isMergeQueryBuilder(query))

  query = db
    .mergeInto('person')
    .using('pet', 'pet.owner_id', 'person.id')
    .whenNotMatched()
  expectType<
    NotMatchedThenableMergeQueryBuilder<Database, 'person', 'pet', MergeResult>
  >(query)
  expectType<true>(query.isMergeQueryBuilder)
  expectType<boolean>(isMergeQueryBuilder(query))
}
