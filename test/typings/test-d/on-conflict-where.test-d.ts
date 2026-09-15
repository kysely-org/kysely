import { expectAssignable, expectType } from 'tsd'
import type { ColumnType, ExpressionBuilder, Kysely } from '../index.js'

interface Database {
  person: {
    id: ColumnType<number, number, never>
    employerId: ColumnType<number, number, never>
    employeeNumber: number
    createdAt: ColumnType<Date, never, never>
    deletedAt: ColumnType<Date | null, never, string | undefined>
  }
  company: {
    id: ColumnType<number, number, never>
  }
}

declare const db: Kysely<Database>

function testImmutableColumns() {
  // Reproduces #1189: employerId is readable but cannot be updated.
  db.insertInto('person')
    .values({ id: 32, employerId: 1, employeeNumber: 4343 })
    .onConflict((oc) =>
      oc
        .column('id')
        .doUpdateSet((eb) => ({
          employeeNumber: eb.ref('excluded.employeeNumber'),
        }))
        .where('person.employerId', '=', 1)
        .where('id', '=', 32),
    )
}

function testGeneratedAndExcludedColumns() {
  // Covers #1409, including a column with both write types set to never.
  db.insertInto('person').onConflict((oc) =>
    oc
      .doUpdateSet({ employeeNumber: 1 })
      .where('person.createdAt', '<', new Date())
      .where('excluded.createdAt', '<', new Date())
      .where('excluded.employerId', '=', 1),
  )
}

function testImmutableReferenceComparisons() {
  db.insertInto('person').onConflict((oc) =>
    oc
      .doUpdateSet({ employeeNumber: 1 })
      .whereRef('person.employerId', '=', 'excluded.employerId')
      .whereRef('person.createdAt', '=', 'excluded.createdAt'),
  )
}

function testReusablePredicateHelpers() {
  const sameEmployer = (eb: ExpressionBuilder<Database, 'person'>) =>
    eb('person.employerId', '=', 1)
  const excludedEmployer = (
    eb: ExpressionBuilder<{ excluded: Database['person'] }, 'excluded'>,
  ) => eb('excluded.employerId', '=', 1)

  db.insertInto('person').onConflict((oc) =>
    oc
      .doUpdateSet({ employeeNumber: 1 })
      .where(sameEmployer)
      .where(excludedEmployer)
      .where((eb) => {
        expectAssignable<ExpressionBuilder<Database, 'person'>>(eb)
        return eb.exists(
          eb
            .selectFrom('company')
            .select('company.id')
            .whereRef('company.id', '=', 'person.employerId'),
        )
      }),
  )
}

function testUpdateAndSelectTypes() {
  // Preserve #792/#617: excluded.deletedAt must use its update type in SET.
  db.insertInto('person').onConflict((oc) =>
    oc
      .doUpdateSet((eb) => ({ deletedAt: eb.ref('excluded.deletedAt') }))
      .where('person.deletedAt', '=', new Date())
      .where('excluded.deletedAt', 'is', null)
      .where((eb) => {
        expectType<Promise<{ createdAt: Date; deletedAt: Date | null }[]>>(
          eb
            .selectFrom('excluded')
            .select(['createdAt', 'deletedAt'])
            .execute(),
        )
        return eb('person.deletedAt', 'is', null)
      }),
  )
}

function testClearWhereAndCall() {
  db.insertInto('person').onConflict((oc) =>
    oc
      .doUpdateSet({ employeeNumber: 1 })
      .where('person.employerId', '=', 1)
      .clearWhere()
      .$call((builder) => builder.where('excluded.employerId', '=', 2))
      .whereRef('person.createdAt', '=', 'excluded.createdAt'),
  )
}

function testInvalidPredicates() {
  db.insertInto('person').onConflict((oc) => {
    const update = oc.doUpdateSet({ employeeNumber: 1 })
    // @ts-expect-error the column does not exist
    update.where('person.missing', '=', 1)
    // @ts-expect-error excluded contains person columns
    update.whereRef('person.id', '=', 'excluded.missing')
    // @ts-expect-error company is available to subqueries but is not in scope
    update.where('company.id', '=', 1)
    // @ts-expect-error employerId selects numbers
    update.where('person.employerId', '=', '1')
    // @ts-expect-error WHERE uses Date, not the string update type
    update.where('person.deletedAt', '=', '2026-09-15')
    // @ts-expect-error excluded references also use select types in WHERE
    update.where('excluded.deletedAt', '=', '2026-09-15')
    return update
  })
}

function testImmutableSetColumns() {
  db.insertInto('person').onConflict((oc) => {
    // @ts-expect-error employerId still cannot be updated
    oc.doUpdateSet({ employerId: 2 })
    // @ts-expect-error createdAt still cannot be updated
    oc.doUpdateSet({ createdAt: new Date() })
    // @ts-expect-error SET still requires the string update type
    oc.doUpdateSet({ deletedAt: new Date() })
    return oc
      .doUpdateSet({ deletedAt: undefined })
      .where('person.employerId', '=', 1)
  })
}
