import type { Kysely } from 'kysely'

interface DB {
  MyTable: {
    myColumn: string
  }
}

export function foo<T extends 'myColumn'>(db: Kysely<DB>, field: T) {
  return db.selectFrom('MyTable').select(field).execute()
}
