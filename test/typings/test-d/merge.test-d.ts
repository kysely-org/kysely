import { expectError, expectType } from 'tsd'
import {
  ExpressionBuilder,
  JoinBuilder,
  Kysely,
  MergeResult,
  WheneableMergeQueryBuilder,
  sql,
} from '..'
import { Database } from '../shared'

async function testMergeInto(db: Kysely<Database>) {
  db.mergeInto('person')
  db.mergeInto('person as p')
  expectError(db.mergeInto('NO_SUCH_TABLE'))
  expectError(db.mergeInto('NO_SUCH_TABLE as n'))
  expectError(db.mergeInto(['person']))
  expectError(db.mergeInto(['person as p']))
  expectError(db.mergeInto(db.selectFrom('person').selectAll().as('person')))
  expectError(
    db.mergeInto((eb: ExpressionBuilder<Database, keyof Database>) =>
      eb.selectFrom('person').selectAll().as('person')
    )
  )
}

async function testUsing(db: Kysely<Database>) {
  db.mergeInto('person').using('pet', 'pet.owner_id', 'person.id')
  db.mergeInto('person as p').using('pet as p2', 'p2.owner_id', 'p.id')
  expectError(db.mergeInto('person').using('pet'))
  expectError(db.mergeInto('person').using('pet', 'pet'))
  expectError(db.mergeInto('person').using('pet', 'pet.NO_SUCH_COLUMN'))
  expectError(db.mergeInto('person').using('pet', 'pet.owner_id', 'person'))
  expectError(
    db.mergeInto('person').using('pet', 'pet.owner_id', 'person.NO_SUCH_COLUMN')
  )
  expectError(
    db
      .mergeInto('person')
      .using('NO_SUCH_TABLE as n', 'n.owner_id', 'person.id')
  )
  db.mergeInto('person').using('pet', (join) => {
    // already tested in join.test-d.ts
    expectType<JoinBuilder<Database, 'person' | 'pet'>>(join)

    return join.onTrue()
  })

  const baseQuery = db
    .mergeInto('person')
    .using('pet', 'pet.owner_id', 'person.id')

  expectType<MergeResult>(
    await db
      .mergeInto('person')
      .using('pet', 'pet.owner_id', 'person.id')
      .executeTakeFirstOrThrow()
  )
}

async function testWhenMatched(
  baseQuery: WheneableMergeQueryBuilder<Database, 'person', 'pet', MergeResult>
) {
  baseQuery.whenMatched()
  expectError(baseQuery.whenMatched('age'))
  expectError(baseQuery.whenMatchedAnd('age'))
  expectError(baseQuery.whenMatchedAnd('NO_SUCH_COLUMN'))
  expectError(baseQuery.whenMatchedAnd('age', '>'))
  expectError(baseQuery.whenMatchedAnd('age', '>', 'string'))
  baseQuery.whenMatchedAnd('age', '>', 2)
  expectError(baseQuery.whenMatchedAnd('age', 'NO_SUCH_OPERATOR', 2))
  baseQuery.whenMatchedAnd('person.age', sql`>`, 2)
  baseQuery.whenMatchedAnd('pet.species', '>', 'cat')
  baseQuery.whenMatchedAnd('age', '>', (eb) => {
    expectType<ExpressionBuilder<Database, 'person' | 'pet'>>(eb)
    return eb.ref('person.age')
  })
  expectError(
    baseQuery.whenMatchedAnd('age', '>', (eb) => eb.ref('person.first_name'))
  )
  baseQuery.whenMatchedAnd((eb) => {
    // already tested in many places
    expectType<ExpressionBuilder<Database, 'person' | 'pet'>>(eb)
    return eb.and([])
  })
  expectError(baseQuery.whenMatchedAndRef('age'))
  expectError(baseQuery.whenMatchedAndRef('NO_SUCH_COLUMN'))
  expectError(baseQuery.whenMatchedAndRef('age', '>'))
  expectError(baseQuery.whenMatchedAndRef('age', '>', 'string'))
  expectError(baseQuery.whenMatchedAndRef('age', '>', 2))
  baseQuery.whenMatchedAndRef('pet.name', '>', 'person.age')
  baseQuery.whenMatchedAndRef('person.age', '>', 'pet.name')
  baseQuery.whenMatchedAndRef('age', '>', sql`person.age`)
  baseQuery.whenMatchedAndRef('age', sql`>`, 'person.age')
  expectError(baseQuery.whenMatchedAndRef('age', 'NO_SUCH_OPERATOR', 'age'))
}

async function testWhenNotMatched(
  baseQuery: WheneableMergeQueryBuilder<Database, 'person', 'pet', MergeResult>
) {
  baseQuery.whenNotMatched()
  expectError(baseQuery.whenNotMatched('species'))
  expectError(baseQuery.whenNotMatchedAnd('species'))
  expectError(baseQuery.whenNotMatchedAnd('NO_SUCH_COLUMN'))
  expectError(baseQuery.whenNotMatchedAnd('species', '>'))
  expectError(baseQuery.whenNotMatchedAnd('species', '>', 'string'))
  expectError(baseQuery.whenNotMatchedAnd('species', '>', 2))
  baseQuery.whenNotMatchedAnd('species', '>', 'dog')
  expectError(
    baseQuery.whenNotMatchedAnd('species', 'NOT_SUCH_OPERATOR', 'dog')
  )
  // when not matched can only reference the source table's columns.
  expectError(baseQuery.whenNotMatchedAnd('age', '>', 'dog'))
  baseQuery.whenNotMatchedAnd('species', sql`>`, 'dog')
  baseQuery.whenNotMatchedAnd('pet.species', '>', sql`dog`)
  baseQuery.whenNotMatchedAnd('species', '>', (eb) => {
    // already tested in many places
    expectType<ExpressionBuilder<Database, 'pet'>>(eb)
    return eb.ref('pet.species')
  })
  expectError(
    baseQuery.whenNotMatchedAnd('species', '>', (eb) => eb.ref('pet.owner_id'))
  )
  baseQuery.whenNotMatchedAnd((eb) => {
    // already tested in many places
    expectType<ExpressionBuilder<Database, 'pet'>>(eb)
    return eb.and([])
  })
  expectError(baseQuery.whenNotMatchedAndRef('species'))
  expectError(baseQuery.whenNotMatchedAndRef('NO_SUCH_COLUMN'))
  expectError(baseQuery.whenNotMatchedAndRef('species', '>'))
  expectError(baseQuery.whenNotMatchedAndRef('species', '>', 'string'))
  expectError(baseQuery.whenNotMatchedAndRef('species', '>', 2))
  baseQuery.whenNotMatchedAndRef('pet.name', '>', 'pet.species')
  // when not matched can only reference the source table's columns.
  baseQuery.whenNotMatchedAndRef('pet.name', '>', 'person.first_name')
  baseQuery.whenNotMatchedAndRef('person.first_name', '>', 'pet.species')
  baseQuery.whenNotMatchedAndRef('species', '>', sql`person.age`)
  baseQuery.whenNotMatchedAndRef('species', sql`>`, 'pet.species')
  expectError(
    baseQuery.whenNotMatchedAndRef('species', 'NO_SUCH_OPERATOR', 'name')
  )
}
