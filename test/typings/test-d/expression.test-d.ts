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

  expectAssignable<Expression<SqlBool>>(eb.cmp(eb.bin('age', '+', 1), '>', 0))
}
