import { expectError, expectType } from 'tsd'
import {
  ExpressionBuilder,
  JoinBuilder,
  Kysely,
  MatchedThenableMergeQueryBuilder,
  MergeQueryBuilder,
  MergeResult,
  NotMatchedThenableMergeQueryBuilder,
  UpdateQueryBuilder,
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

  expectType<MergeQueryBuilder<Database, 'person', MergeResult>>(
    db.mergeInto('person')
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

  expectType<
    WheneableMergeQueryBuilder<Database, 'person', 'pet', MergeResult>
  >(db.mergeInto('person').using('pet', 'pet.owner_id', 'person.id'))

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

  type ExpectedReturnType = MatchedThenableMergeQueryBuilder<
    Database,
    'person',
    'pet',
    'person' | 'pet',
    MergeResult
  >
  expectType<ExpectedReturnType>(baseQuery.whenMatched())
  expectType<ExpectedReturnType>(baseQuery.whenMatchedAnd('age', '>', 2))
  expectType<ExpectedReturnType>(
    baseQuery.whenMatchedAndRef('pet.name', '>', 'person.age')
  )
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
  expectError(
    baseQuery.whenNotMatchedAndRef('pet.name', '>', 'person.first_name')
  )
  expectError(
    baseQuery.whenNotMatchedAndRef('person.first_name', '>', 'pet.species')
  )
  baseQuery.whenNotMatchedAndRef('species', '>', sql`person.age`)
  baseQuery.whenNotMatchedAndRef('species', sql`>`, 'pet.species')
  expectError(
    baseQuery.whenNotMatchedAndRef('species', 'NO_SUCH_OPERATOR', 'name')
  )

  type ExpectedReturnType = NotMatchedThenableMergeQueryBuilder<
    Database,
    'person',
    'pet',
    MergeResult
  >
  expectType<ExpectedReturnType>(baseQuery.whenNotMatched())
  expectType<ExpectedReturnType>(
    baseQuery.whenNotMatchedAnd('species', '>', 'dog')
  )
  expectType<ExpectedReturnType>(
    baseQuery.whenNotMatchedAndRef('pet.name', '>', 'pet.species')
  )
}

async function testWhenNotMatchedBySource(
  baseQuery: WheneableMergeQueryBuilder<Database, 'person', 'pet', MergeResult>
) {
  baseQuery.whenNotMatchedBySource()
  expectError(baseQuery.whenNotMatchedBySource('age'))
  expectError(baseQuery.whenNotMatchedBySourceAnd('age'))
  expectError(baseQuery.whenNotMatchedBySourceAnd('NO_SUCH_COLUMN'))
  expectError(baseQuery.whenNotMatchedBySourceAnd('age', '>'))
  expectError(baseQuery.whenNotMatchedBySourceAnd('age', '>', 'string'))
  baseQuery.whenNotMatchedBySourceAnd('age', '>', 2)
  expectError(
    baseQuery.whenNotMatchedBySourceAnd('age', 'NOT_SUCH_OPERATOR', 'dog')
  )
  // when not matched by source can only reference the target table's columns.
  expectError(baseQuery.whenNotMatchedBySourceAnd('species', '>', 'dog'))
  baseQuery.whenNotMatchedBySourceAnd('age', sql`>`, 2)
  baseQuery.whenNotMatchedBySourceAnd('person.age', '>', sql`2`)
  baseQuery.whenNotMatchedBySourceAnd('age', '>', (eb) => {
    // already tested in many places
    expectType<ExpressionBuilder<Database, 'person'>>(eb)
    return eb.ref('person.age')
  })
  expectError(
    baseQuery.whenNotMatchedBySourceAnd('age', '>', (eb) =>
      eb.ref('person.gender')
    )
  )
  baseQuery.whenNotMatchedBySourceAnd((eb) => {
    // already tested in many places
    expectType<ExpressionBuilder<Database, 'person'>>(eb)
    return eb.and([])
  })
  expectError(baseQuery.whenNotMatchedBySourceAndRef('age'))
  expectError(baseQuery.whenNotMatchedBySourceAndRef('NO_SUCH_COLUMN'))
  expectError(baseQuery.whenNotMatchedBySourceAndRef('age', '>'))
  expectError(baseQuery.whenNotMatchedBySourceAndRef('age', '>', 'string'))
  expectError(baseQuery.whenNotMatchedBySourceAndRef('age', '>', 2))
  baseQuery.whenNotMatchedBySourceAndRef(
    'person.first_name',
    '>',
    'person.last_name'
  )
  // when not matched by source can only reference the target table's columns.
  expectError(
    baseQuery.whenNotMatchedBySourceAndRef('person.first_name', '>', 'pet.name')
  )
  expectError(
    baseQuery.whenNotMatchedBySourceAndRef('pet.name', '>', 'person.first_name')
  )

  type ExpectedReturnType = MatchedThenableMergeQueryBuilder<
    Database,
    'person',
    'pet',
    'person',
    MergeResult
  >
  expectType<ExpectedReturnType>(baseQuery.whenNotMatchedBySource())
  expectType<ExpectedReturnType>(
    baseQuery.whenNotMatchedBySourceAnd('age', '>', 2)
  )
  expectType<ExpectedReturnType>(
    baseQuery.whenNotMatchedBySourceAndRef(
      'person.first_name',
      '>',
      'person.last_name'
    )
  )
}

async function testThenDelete(
  baseQuery: MatchedThenableMergeQueryBuilder<
    Database,
    'person',
    'pet',
    'person' | 'pet',
    MergeResult
  >
) {
  baseQuery.thenDelete()
  expectError(baseQuery.thenDelete('person'))
  expectError(baseQuery.thenDelete(['person']))

  expectType<
    WheneableMergeQueryBuilder<Database, 'person', 'pet', MergeResult>
  >(baseQuery.thenDelete())
}

async function testThenDoNothing(
  matchedBaseQuery: MatchedThenableMergeQueryBuilder<
    Database,
    'person',
    'pet',
    'person' | 'pet',
    MergeResult
  >,
  notMatchedBaseQuery: NotMatchedThenableMergeQueryBuilder<
    Database,
    'person',
    'pet',
    MergeResult
  >
) {
  matchedBaseQuery.thenDoNothing()
  expectError(matchedBaseQuery.thenDoNothing('person'))
  expectError(matchedBaseQuery.thenDoNothing(['person']))
  notMatchedBaseQuery.thenDoNothing()
  expectError(notMatchedBaseQuery.thenDoNothing('person'))
  expectError(notMatchedBaseQuery.thenDoNothing(['person']))

  expectType<
    WheneableMergeQueryBuilder<Database, 'person', 'pet', MergeResult>
  >(matchedBaseQuery.thenDoNothing())
  expectType<
    WheneableMergeQueryBuilder<Database, 'person', 'pet', MergeResult>
  >(notMatchedBaseQuery.thenDoNothing())
}

async function testThenUpdate(
  baseQuery: MatchedThenableMergeQueryBuilder<
    Database,
    'person',
    'pet',
    'person' | 'pet',
    MergeResult
  >,
  limitedBaseQuery: MatchedThenableMergeQueryBuilder<
    Database,
    'person',
    'pet',
    'person',
    MergeResult
  >
) {
  expectError(baseQuery.thenUpdate())
  expectError(baseQuery.thenUpdate('person'))
  expectError(baseQuery.thenUpdate(['person']))
  expectError(baseQuery.thenUpdate({ age: 2 }))
  baseQuery.thenUpdate((ub) => {
    expectType<UpdateQueryBuilder<Database, 'person', 'person' | 'pet', never>>(
      ub
    )
    return ub
  })
  limitedBaseQuery.thenUpdate((ub) => {
    expectType<UpdateQueryBuilder<Database, 'person', 'person', never>>(ub)
    return ub
  })

  baseQuery.thenUpdateSet({ age: 2 })
  expectError(baseQuery.thenUpdateSet({ age: 'not_a_number' }))
  baseQuery.thenUpdateSet((eb) => {
    expectType<ExpressionBuilder<Database, 'person' | 'pet'>>(eb)
    return { first_name: eb.ref('pet.name') }
  })
  limitedBaseQuery.thenUpdateSet((eb) => {
    expectType<ExpressionBuilder<Database, 'person'>>(eb)
    return { last_name: eb.ref('person.first_name') }
  })
  baseQuery.thenUpdateSet('age', 2)
  expectError(baseQuery.thenUpdateSet('age', 'not_a_number'))
  baseQuery.thenUpdateSet('first_name', (eb) => {
    expectType<ExpressionBuilder<Database, 'person' | 'pet'>>(eb)
    return eb.ref('pet.name')
  })
  expectError(
    limitedBaseQuery.thenUpdateSet('last_name', (eb) => {
      expectType<ExpressionBuilder<Database, 'person'>>(eb)
      return eb.ref('person.first_name')
    })
  )

  type ExpectedReturnType = WheneableMergeQueryBuilder<
    Database,
    'person',
    'pet',
    MergeResult
  >
  expectType<ExpectedReturnType>(baseQuery.thenUpdate((ub) => ub))
  expectType<ExpectedReturnType>(baseQuery.thenUpdateSet({ age: 2 }))
  expectType<ExpectedReturnType>(
    baseQuery.thenUpdateSet((eb) => ({ first_name: eb.ref('pet.name') }))
  )
  expectType<ExpectedReturnType>(baseQuery.thenUpdateSet('age', 2))
}

async function testThenInsert(
  baseQuery: NotMatchedThenableMergeQueryBuilder<
    Database,
    'person',
    'pet',
    MergeResult
  >
) {
  expectError(baseQuery.thenInsertValues())
  expectError(baseQuery.thenInsertValues('person'))
  expectError(baseQuery.thenInsertValues(['person']))
  expectError(baseQuery.thenInsertValues({ age: 2 }))
  baseQuery.thenInsertValues({ age: 2, first_name: 'Moshe', gender: 'other' })
  expectError(
    baseQuery.thenInsertValues({
      age: 'not_a_number',
      first_name: 'Moshe',
      gender: 'other',
    })
  )
  baseQuery.thenInsertValues((eb) => {
    expectType<ExpressionBuilder<Database, 'person' | 'pet'>>(eb)
    return { age: 2, first_name: eb.ref('pet.name'), gender: 'other' }
  })
  expectError(
    baseQuery.thenInsertValues((eb) => {
      expectType<ExpressionBuilder<Database, 'person' | 'pet'>>(eb)
      return {
        age: 'not_a_number',
        first_name: eb.ref('pet.name'),
        gender: 'other',
      }
    })
  )

  expectType<
    WheneableMergeQueryBuilder<Database, 'person', 'pet', MergeResult>
  >(
    baseQuery.thenInsertValues({ age: 2, first_name: 'Moshe', gender: 'other' })
  )
}
