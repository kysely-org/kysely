import type {
  AnyColumn,
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

type PersonColumns = AnyColumn<DB, 'person'>
// Single-table AnyColumn should accept only that table's columns.
expectAssignable<PersonColumns>('id')
expectAssignable<PersonColumns>('name')
expectError(() => {
  const column: PersonColumns = 'owner_id'
  return column
})

type PersonPetColumns = AnyColumn<DB, 'person' | 'pet'>
// Union-table AnyColumn should accept columns from any table in the union.
expectAssignable<PersonPetColumns>('owner_id')
expectError(() => {
  const column: PersonPetColumns = 'not_a_column'
  return column
})

type PersonColumnsWithTable = AnyColumnWithTable<DB, 'person'>
// Table-qualified columns must be scoped to the allowed table.
expectAssignable<PersonColumnsWithTable>('person.id')
expectAssignable<PersonColumnsWithTable>('person.name')
expectError(() => {
  const column: PersonColumnsWithTable = 'pet.owner_id'
  return column
})

type PersonPetColumnsWithTable = AnyColumnWithTable<DB, 'person' | 'pet'>
// Union-table qualified columns should stay correlated per table.
expectAssignable<PersonPetColumnsWithTable>('person.name')
expectAssignable<PersonPetColumnsWithTable>('pet.owner_id')
expectError(() => {
  const column: PersonPetColumnsWithTable = 'person.owner_id'
  return column
})
expectError(() => {
  const column: PersonPetColumnsWithTable = 'pet.name'
  return column
})

type PersonNameType = ExtractTypeFromReferenceExpression<
  DB,
  'person',
  'person.name'
>
// Reference expression type extraction should yield the column's value type.
expectAssignable<PersonNameType>('alice')
expectError(() => {
  const name: PersonNameType = 123
  return name
})

type PetOwnerIdType = ExtractTypeFromReferenceExpression<
  DB,
  'pet',
  'pet.owner_id'
>
// Reference expression type extraction should reject incompatible values.
expectAssignable<PetOwnerIdType>(123)
expectError(() => {
  const ownerId: PetOwnerIdType = 'not_present'
  return ownerId
})

interface NullableDB {
  person?: { id: number; name: string } | null
  pet: { id: number; owner_id: number }
}

type NullablePersonColumns = AnyColumn<NullableDB, 'person'>
// AnyColumn should tolerate nullable/optional table shapes.
expectAssignable<NullablePersonColumns>('id')
expectAssignable<NullablePersonColumns>('name')
expectError(() => {
  const column: NullablePersonColumns = 'owner_id'
  return column
})

type NullablePersonNameType = ExtractTypeFromReferenceExpression<
  NullableDB,
  'person',
  'name'
>
// Unqualified reference extraction should still resolve through NonNullable.
expectAssignable<NullablePersonNameType>('alice')
expectError(() => {
  const name: NullablePersonNameType = 123
  return name
})

function wherePersonHasName<
  TB extends Exclude<keyof DB, 'person'>,
  O,
>(
  qb: SelectQueryBuilder<DB, 'person' | TB, O>,
  name: ExtractTypeFromReferenceExpression<DB, TB | 'person', 'person.name'>,
): SelectQueryBuilder<DB, 'person' | TB, O> {
  const tableQualifiedRef = 'person.name' as const

  // Table-qualified string refs should be accepted at all reference boundaries.
  expectAssignable<AnyColumnWithTable<DB, TB | 'person'>>(tableQualifiedRef)
  expectAssignable<StringReference<DB, TB | 'person'>>(tableQualifiedRef)
  expectAssignable<ReferenceExpression<DB, TB | 'person'>>(tableQualifiedRef)

  // Invalid value types and unknown columns should be rejected.
  expectError(qb.where(tableQualifiedRef, '=', 123))
  expectError(qb.where('person.not_a_column', '=', 'alice'))

  return qb.where(tableQualifiedRef, '=', name)
}

interface ExtendedDB extends DB {
  toy: { id: number; owner_id: number }
}

function wherePersonHasNameAcrossTables<
  TB extends Exclude<keyof ExtendedDB, 'person'>,
  O,
>(
  qb: SelectQueryBuilder<ExtendedDB, 'person' | TB, O>,
  name: ExtractTypeFromReferenceExpression<
    ExtendedDB,
    TB | 'person',
    'person.name'
  >,
): SelectQueryBuilder<ExtendedDB, 'person' | TB, O> {
  // Generic helpers avoid duplicating filters per join/shape.
  return qb.where('person.name', '=', name)
}

declare const concreteQuery: SelectQueryBuilder<
  DB,
  'person' | 'pet',
  { id: number }
>
// Concrete queries with both tables should accept the helper.
wherePersonHasName(concreteQuery, 'alice')

declare const personPetQuery: SelectQueryBuilder<
  ExtendedDB,
  'person' | 'pet',
  { id: number }
>

declare const personToyQuery: SelectQueryBuilder<
  ExtendedDB,
  'person' | 'toy',
  { id: number }
>

wherePersonHasNameAcrossTables(personPetQuery, 'alice')
wherePersonHasNameAcrossTables(personToyQuery, 'alice')

declare const petOnlyQuery: SelectQueryBuilder<DB, 'pet', { id: number }>
// Queries without the required table should be rejected.
expectError(wherePersonHasName(petOnlyQuery, 'alice'))
