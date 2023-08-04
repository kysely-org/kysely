import {
  expectAssignable,
  expectNotAssignable,
  expectError,
  expectType,
} from 'tsd'
import { Expression, ExpressionBuilder, Kysely, SqlBool } from '..'
import { Database } from '../shared'
import { KyselyTypeError } from '../../../dist/cjs/util/type-error'

function testExpression(db: Kysely<Database>) {
  const e1: Expression<number> = undefined!

  expectAssignable<Expression<number>>(e1)
  expectNotAssignable<Expression<string>>(e1)

  expectAssignable<Expression<{ first_name: string }>>(
    db.selectFrom('person').select('first_name')
  )
  expectNotAssignable<Expression<{ first_name: number }>>(
    db.selectFrom('person').select('first_name')
  )
  expectNotAssignable<Expression<{ age: number }>>(
    db.selectFrom('person').select('first_name')
  )
}

async function testExpressionBuilder(
  eb: ExpressionBuilder<Database, 'person'>
) {
  // Binary expression
  expectAssignable<Expression<number>>(eb('age', '+', 1))

  // `not` expression
  expectAssignable<Expression<SqlBool>>(eb.not(eb('age', '>', 10)))

  // `and` expression with one item
  expectAssignable<Expression<SqlBool>>(
    eb.and([eb('first_name', '=', 'Jennifer')])
  )

  // `and` expression with two items
  expectAssignable<Expression<SqlBool>>(
    eb.and([
      eb('first_name', '=', 'Jennifer'),
      eb.not(eb('last_name', '=', 'Aniston')),
    ])
  )

  // `or` expression with one item
  expectAssignable<Expression<SqlBool>>(
    eb.or([eb('first_name', '=', 'Jennifer')])
  )

  // `or` expression with two items
  expectAssignable<Expression<SqlBool>>(
    eb.or([
      eb('first_name', '=', 'Jennifer'),
      eb.not(eb('last_name', '=', 'Aniston')),
    ])
  )

  // `or` chain with three items
  expectAssignable<Expression<SqlBool>>(
    eb('first_name', '=', 'Jennifer')
      .or(eb.not(eb('last_name', '=', 'Aniston')))
      .or('age', '>', 23)
  )

  // `and` chain with three items
  expectAssignable<Expression<SqlBool>>(
    eb('first_name', '=', 'Jennifer')
      .and(eb.not(eb('last_name', '=', 'Aniston')))
      .and('age', '>', 23)
  )

  // nested `and` and `or` chains.
  expectAssignable<Expression<SqlBool>>(
    eb.and([
      eb('age', '=', 1).or('age', '=', 2),
      eb('first_name', '=', 'Jennifer').or('first_name', '=', 'Arnold'),
    ])
  )

  expectAssignable<Expression<1>>(eb.lit(1))
  expectAssignable<Expression<boolean>>(eb.lit(true))
  expectAssignable<Expression<null>>(eb.lit(null))

  expectAssignable<Expression<SqlBool>>(
    eb.and({
      'person.age': 10,
      first_name: 'Jennifer',
      last_name: eb.ref('first_name'),
    })
  )

  expectAssignable<Expression<SqlBool>>(
    eb.or({
      'person.age': 10,
      first_name: 'Jennifer',
      last_name: eb.ref('first_name'),
    })
  )

  expectType<
    KyselyTypeError<'or() method can only be called on boolean expressions'>
  >(eb('age', '+', 1).or('age', '=', 1))

  expectType<
    KyselyTypeError<'and() method can only be called on boolean expressions'>
  >(eb('age', '+', 1).and('age', '=', 1))

  // `neg` expression
  expectAssignable<Expression<number>>(eb.neg(eb('age', '+', 10)))

  // Binary expression in a comparison expression
  expectAssignable<Expression<SqlBool>>(eb(eb('age', '+', 1), '>', 0))

  // A custom function call
  expectAssignable<Expression<string>>(eb.fn<string>('upper', ['first_name']))

  expectAssignable<Expression<SqlBool>>(eb.between('age', 10, 20))
  expectAssignable<Expression<SqlBool>>(eb.betweenSymmetric('age', 10, 20))

  expectError(eb('not_a_person_column', '=', 'Jennifer'))
  expectError(eb('not_a_person_column', '=', 'Jennifer'))

  expectError(eb.and([eb.val('not booleanish'), eb.val(true)]))
  expectError(eb.and([eb('age', '+', 1), eb.val(true)]))

  expectError(eb.or([eb.val('not booleanish'), eb.val(true)]))
  expectError(eb.or([eb('age', '+', 1), eb.val(true)]))

  expectError(eb.and({ unknown_column: 'Jennifer' }))
  expectError(eb.and({ age: 'wrong type' }))

  expectError(eb.or({ unknown_column: 'Jennifer' }))
  expectError(eb.or({ age: 'wrong type' }))

  // String literals are not allowed.
  expectError(eb.lit('foobar'))

  expectError(eb.between('age', 'wrong type', 2))
  expectError(eb.between('age', 1, 'wrong type'))
  expectError(eb.betweenSymmetric('age', 'wrong type', 2))
  expectError(eb.betweenSymmetric('age', 1, 'wrong type'))
}

async function testExpressionBuilderSelect(
  db: Kysely<Database>,
  eb: ExpressionBuilder<Database, 'person'>
) {
  expectAssignable<Expression<{ first_name: string }>>(
    eb.selectNoFrom(eb.val('Jennifer').as('first_name'))
  )

  expectAssignable<Expression<{ first_name: string }>>(
    eb.selectNoFrom((eb) => eb.val('Jennifer').as('first_name'))
  )

  expectAssignable<Expression<{ first_name: string; last_name: string }>>(
    eb.selectNoFrom([
      eb.val('Jennifer').as('first_name'),
      eb(eb.val('Anis'), '||', eb.val('ton')).as('last_name'),
    ])
  )

  expectAssignable<
    Expression<{ first_name: string; last_name: string | null }>
  >(
    eb.selectNoFrom((eb) => [
      eb.val('Jennifer').as('first_name'),
      eb.selectFrom('person').select('last_name').limit(1).as('last_name'),
    ])
  )

  const r1 = await db
    .selectFrom('person as p')
    .select((eb) => [eb.selectNoFrom('p.age').as('age')])
    .executeTakeFirstOrThrow()
  expectType<{ age: number | null }>(r1)

  expectError(
    db
      .selectFrom('person')
      .select((eb) => [eb.selectNoFrom('pet.name').as('name')])
  )
}

async function textExpressionBuilderAny(
  eb: ExpressionBuilder<
    {
      tables: Database['tables'] & {
        actor: {
          id: string
          movie_earnings: number[]
          nicknames: string[] | null
        }
      }
      config: Database['config']
    },
    'actor'
  >
) {
  expectAssignable<Expression<string>>(eb.fn.any('nicknames'))
  expectAssignable<Expression<number>>(eb.fn.any('movie_earnings'))
  expectAssignable<Expression<number>>(eb.fn.any(eb.val([1, 2, 3])))

  expectAssignable<Expression<SqlBool>>(
    eb(eb.val('Jen'), '=', eb.fn.any('nicknames'))
  )

  expectAssignable<Expression<SqlBool>>(
    eb(eb.val(42_000_000), '=', eb.fn.any('movie_earnings'))
  )

  expectAssignable<Expression<SqlBool>>(
    eb(eb.val('cat'), '=', eb.fn.any(eb.selectFrom('pet').select('species')))
  )

  // Wrong array type
  expectError(eb(eb.val('Jen'), '=', eb.fn.any('movie_earnings')))

  // Not an array
  expectError(eb(eb.val('Jen'), '=', eb.fn.any('id')))
}

function testExpressionBuilderTuple(db: Kysely<Database>) {
  db.selectFrom('person')
    .selectAll()
    .where(({ eb, refTuple, tuple }) =>
      eb(refTuple('first_name', 'last_name'), 'in', [
        tuple('Jennifer', 'Aniston'),
        tuple('Sylvester', 'Stallone'),
      ])
    )

  db.selectFrom('person')
    .selectAll()
    .where(({ eb, refTuple, selectFrom }) =>
      eb(
        refTuple('first_name', 'last_name'),
        'in',
        selectFrom('person')
          .select(['first_name', 'last_name'])
          .$asTuple('first_name', 'last_name')
      )
    )

  // Wrong tuple type
  expectError(
    db
      .selectFrom('person')
      .where(({ eb, refTuple, tuple }) =>
        eb(refTuple('first_name', 'last_name'), 'in', [
          tuple('Jennifer', 'Aniston'),
          tuple('Sylvester', 1),
        ])
      )
  )

  // Wrong tuple length
  expectError(
    db
      .selectFrom('person')
      .where(({ eb, refTuple, tuple }) =>
        eb(refTuple('first_name', 'last_name'), 'in', [
          tuple('Jennifer', 'Aniston', 'Extra'),
          tuple('Sylvester', 'Stallone'),
        ])
      )
  )

  // Not all selected columns provided for $asTuple
  expectType<
    KyselyTypeError<'$asTuple() call failed: All selected columns must be provided as arguments'>
  >(
    db
      .selectFrom('person')
      .select(['first_name', 'last_name', 'age'])
      .$asTuple('first_name', 'last_name')
  )

  // Duplicate column provided for $asTuple
  expectError(
    db
      .selectFrom('person')
      .select(['first_name', 'last_name'])
      .$asTuple('first_name', 'last_name', 'last_name')
  )
}
