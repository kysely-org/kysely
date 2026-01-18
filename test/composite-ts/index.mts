import type { Kysely } from 'kysely'

interface DB {
  MyTable: {
    myColumn: string
    anotherColumn: number
  }
}

export function foo<T extends 'myColumn'>(db: Kysely<DB>, field: T) {
  return db
    .selectFrom('MyTable')
    .select(field) // <------- was missing DrainOuterGeneric & ExtractColumnType
    .$narrowType<{}>() // <------- was missing KyselyTypeError
    .executeTakeFirst() // <------- was missing SimplifySingleResult
}

export function bar<T extends keyof DB['MyTable']>(
  db: Kysely<DB>,
  columns: T[],
) {
  return db
    .insertInto('MyTable')
    .values({ myColumn: 'test', anotherColumn: 1 })
    .returning(columns) // <----- was missing SimplifyResult
    .execute()
}

export function fizz(db: Kysely<DB>) {
  return db.with(
    // <----- was missing QueryCreatorWithCommonTableExpression
    'cte',
    (db) => db.selectFrom('MyTable').selectAll(),
  )
}
