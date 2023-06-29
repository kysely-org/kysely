import { expectAssignable, expectNotAssignable, expectError } from 'tsd'
import { Expression, ExpressionBuilder, Kysely, SqlBool } from '..'
import { Database } from '../shared'

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

function testExpressionBuilder(eb: ExpressionBuilder<Database, 'person'>) {
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

  // `neg` expression
  expectAssignable<Expression<number>>(eb.neg(eb('age', '+', 10)))

  // Binary expression in a comparison expression
  expectAssignable<Expression<SqlBool>>(eb(eb('age', '+', 1), '>', 0))

  // A custom function call
  expectAssignable<Expression<string>>(eb.fn<string>('upper', ['first_name']))

  expectError(eb('not_a_person_column', '=', 'Jennifer'))
  expectError(eb('not_a_person_column', '=', 'Jennifer'))

  expectError(eb.and([eb.val('not booleanish'), eb.val(true)]))
  expectError(eb.and([eb('age', '+', 1), eb.val(true)]))

  expectError(eb.or([eb.val('not booleanish'), eb.val(true)]))
  expectError(eb.or([eb('age', '+', 1), eb.val(true)]))
}
