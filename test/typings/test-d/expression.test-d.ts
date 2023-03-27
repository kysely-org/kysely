import { expectAssignable, expectNotAssignable, expectType } from 'tsd'

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

  const eb: ExpressionBuilder<Database, 'person'> = undefined!

  // Binary operation in a comparison operation
  expectAssignable<Expression<SqlBool>>(eb.cmp(eb.bxp('age', '+', 1), '>', 0))

  // A custom function call
  expectAssignable<Expression<string>>(eb.fn<string>('upper', ['first_name']))
}
