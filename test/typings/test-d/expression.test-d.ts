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
}
