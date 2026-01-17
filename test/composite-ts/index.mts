import type { Kysely, SelectExpression } from 'kysely'

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
    .execute()
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
