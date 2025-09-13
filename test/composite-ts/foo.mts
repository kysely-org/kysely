import { Kysely } from 'kysely'

export function foo<T extends 'myColumn'>(
  db: Kysely<{
    MyTable: {
      myColumn: string
    }
  }>,
  field: T,
) {
  return db.selectFrom('MyTable').select(field)
}
