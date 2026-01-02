import type {
  AnyColumnWithTable,
  ExtractTypeFromReferenceExpression,
  ReferenceExpression,
  SelectQueryBuilder,
  StringReference,
} from '..'
import { expectAssignable, expectError } from 'tsd'

interface DB {
  person: { id: number; name: string }
  pet: { id: number; owner_id: number }
}

function wherePersonHasName<DBT extends DB, TB extends keyof DBT, O>(
  qb: SelectQueryBuilder<DBT, 'person' | TB, O>,
  name: ExtractTypeFromReferenceExpression<DBT, TB | 'person', 'person.name'>,
): SelectQueryBuilder<DBT, 'person' | TB, O> {
  const tableQualifiedRef = 'person.name' as const

  expectAssignable<AnyColumnWithTable<DBT, TB | 'person'>>(tableQualifiedRef)
  expectAssignable<StringReference<DBT, TB | 'person'>>(tableQualifiedRef)
  expectAssignable<ReferenceExpression<DBT, TB | 'person'>>(tableQualifiedRef)

  expectError(qb.where(tableQualifiedRef, '=', 123))
  expectError(qb.where('person.not_a_column', '=', 'alice'))

  return qb.where(tableQualifiedRef, '=', name)
}

declare const concreteQuery: SelectQueryBuilder<
  DB,
  'person' | 'pet',
  { id: number }
>
wherePersonHasName(concreteQuery, 'alice')

declare const petOnlyQuery: SelectQueryBuilder<DB, 'pet', { id: number }>
expectError(wherePersonHasName(petOnlyQuery, 'alice'))
