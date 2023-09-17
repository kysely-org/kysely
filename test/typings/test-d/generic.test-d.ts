import {
  Kysely,
  SelectType,
  SelectQueryBuilder,
  ExpressionBuilder,
  TableNameSet,
} from '..'

import { Database } from '../shared'
import { expectAssignable } from 'tsd'

async function testGenericSelect<T extends keyof Database>(
  db: Kysely<Database>,
  table: T
) {
  const r1 = await db.selectFrom(table).select('id').executeTakeFirstOrThrow()
  expectAssignable<string | number>(r1.id)
}

async function testGenericSelect2<
  T extends keyof Database,
  C extends keyof Database[T] & string
>(
  db: Kysely<Database>,
  table: T,
  cursorColumn: C,
  id: SelectType<Database[T][C]>
): Promise<boolean> {
  const prevRow = await db
    .selectFrom(table)
    .where(cursorColumn, '<', id as any)
    .orderBy(cursorColumn)
    .limit(1)
    .select((eb) => eb.fn.count<number>('id').as('count'))
    .executeTakeFirst()

  return (prevRow?.count ?? 0) > 0
}

// TODO: The types on this are insanely slow!
function testSelectQueryBuilderExtends() {
  type A = { a: number }
  type B = { b: string }

  type T1 = SelectQueryBuilder<{ a: A }, TableNameSet<'a'>, any>

  // This type extends T1 and should be assignable to it.
  type T2 = SelectQueryBuilder<
    { a: A; b: B },
    TableNameSet<'a' | 'b'>,
    { x: string }
  >

  const t2: T2 = undefined!
  expectAssignable<T1>(t2)
}

// TODO: The types on this are insanely slow!
function testSelectExpressionBuilderExtends() {
  type A = { a: number }
  type B = { b: string }

  type T1 = ExpressionBuilder<{ a: A }, TableNameSet<'a'>>

  // This type extends T1 and should be assignable to it.
  type T2 = ExpressionBuilder<{ a: A; b: B }, TableNameSet<'a' | 'b'>>

  const t2: T2 = undefined!
  expectAssignable<T1>(t2)
}

async function testGenericUpdate(db: Kysely<Database>, table: 'pet' | 'movie') {
  await db.updateTable(table).set({ id: '123' }).execute()
}
