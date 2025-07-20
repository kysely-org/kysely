import { expectError, expectType } from 'tsd'
import { ExpressionBuilder, ExpressionWrapper, sql } from '..'
import { Database } from '../shared'

async function testCase(eb: ExpressionBuilder<Database, 'person'>) {
  // case...when...then...when...then...end
  expectType<ExpressionWrapper<Database, 'person', string | number | null>>(
    eb
      .case()
      .when('gender', '=', 'male')
      .then('Mr.')
      .when('gender', '=', 'female')
      .then(12)
      .end(),
  )

  // case...when...then...when...then...end (as const)
  expectType<ExpressionWrapper<Database, 'person', 'Mr.' | 12 | null>>(
    eb
      .case()
      .when('gender', '=', 'male')
      .then('Mr.' as const)
      .when('gender', '=', 'female')
      .then(12 as const)
      .end(),
  )

  // case...when...then...when...then...else...end
  expectType<ExpressionWrapper<Database, 'person', string | number | boolean>>(
    eb
      .case()
      .when('gender', '=', 'male')
      .then('Mr.')
      .when('gender', '=', 'female')
      .then(12)
      .else(true)
      .end(),
  )

  // case...when...then...when...then...else...end (as const)
  expectType<ExpressionWrapper<Database, 'person', 'Mr.' | 12 | true>>(
    eb
      .case()
      .when('gender', '=', 'male')
      .then('Mr.' as const)
      .when('gender', '=', 'female')
      .then(12 as const)
      .else(true as const)
      .end(),
  )

  // nested case
  expectType<
    ExpressionWrapper<Database, 'person', 'Mr.' | 'Ms.' | 'Mrs.' | null>
  >(
    eb
      .case()
      .when('gender', '=', 'male')
      .then('Mr.' as const)
      .when('gender', '=', 'female')
      .then(
        eb
          .case()
          .when('marital_status', '=', 'single')
          .then('Ms.' as const)
          .else('Mrs.' as const)
          .end(),
      )
      .end(),
  )

  // references
  expectType<ExpressionWrapper<Database, 'person', string | number>>(
    eb
      .case()
      .when('gender', '=', 'male')
      .then(eb.ref('first_name'))
      .else(eb.ref('age'))
      .end(),
  )

  // then references
  expectType<ExpressionWrapper<Database, 'person', string | number>>(
    eb
      .case()
      .when('gender', '=', 'male')
      .thenRef('first_name')
      .else(eb.ref('age'))
      .end(),
  )

  // expressions
  expectType<ExpressionWrapper<Database, 'person', `Mr. ${string}` | null>>(
    eb
      .case()
      .when('gender', '=', 'male')
      .then(
        eb.fn<`Mr. ${string}`>('concat', [
          eb.val('Mr.'),
          sql.lit(' '),
          eb.ref('last_name'),
        ]),
      )
      .end(),
  )

  // subquery
  expectType<ExpressionWrapper<Database, 'person', string | null>>(
    eb
      .case()
      .when('gender', '=', 'male')
      .then(eb.selectFrom('person').select('first_name'))
      .end(),
  )

  // errors

  expectError(eb.case().when('no_such_column', '=', 'male').then('Mr.').end())
  expectError(eb.case().when('gender', '??', 'male').then('Mr.').end())
  expectError(eb.case().when('gender', '=', 42).then('Mr.').end())
  expectError(eb.case().when('male').then('Mr.').end())
}

function testCaseValue(eb: ExpressionBuilder<Database, 'person'>) {
  // case...value...when...then...when...then...end
  expectType<ExpressionWrapper<Database, 'person', string | number | null>>(
    eb.case('gender').when('male').then('Mr.').when('female').then(12).end(),
  )

  // case...value...when...then...when...then...else...end
  expectType<ExpressionWrapper<Database, 'person', string | number | boolean>>(
    eb
      .case('gender')
      .when('male')
      .then('Mr.')
      .when('female')
      .then(12)
      .else(true)
      .end(),
  )

  // nested case
  expectType<
    ExpressionWrapper<Database, 'person', 'Mr.' | 'Ms.' | 'Mrs.' | null>
  >(
    eb
      .case('gender')
      .when('male')
      .then('Mr.' as const)
      .when('female')
      .then(
        eb
          .case('marital_status')
          .when('single')
          .then('Ms.' as const)
          .else('Mrs.' as const)
          .end(),
      )
      .end(),
  )

  // errors

  expectError(eb.case('no_such_column').when('male').then('Mr.').end())
  expectError(eb.case('gender').when('robot').then('Mr.').end())
  expectError(eb.case('gender').when('gender', '=', 'male').then('Mr.').end())
}
