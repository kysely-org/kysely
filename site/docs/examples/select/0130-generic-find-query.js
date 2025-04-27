export const genericFindQuery = `import { SelectType } from 'kysely'
import { Database } from 'type-editor'

async function getRowByColumn<
  T extends keyof Database,
  C extends keyof Database[T] & string,
  V extends SelectType<Database[T][C]>,
>(t: T, c: C, v: V) {
  // We need to use the dynamic module since the table name
  // is not known at compile time.
  const { table, ref } = db.dynamic

  return await db
    .selectFrom(table(t).as('t'))
    .selectAll()
    .where(ref(c), '=', v)
    .orderBy('t.id')
    .executeTakeFirstOrThrow()
}

const person = await getRowByColumn('person', 'first_name', 'Arnold')`