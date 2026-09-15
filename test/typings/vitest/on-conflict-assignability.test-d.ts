import { expectTypeOf, test } from 'vitest'
import type {
  ColumnType,
  Expression,
  ExpressionBuilder,
  Kysely,
} from '../../../dist/index.js'
import {
  accept,
  type DatabaseA,
  type DatabaseAB,
} from './assignability.fixtures.js'

test('accepts expression helpers in conflict update values', () => {
  const db = null! as Kysely<DatabaseAB>
  const id = (eb: ExpressionBuilder<DatabaseA, 'a'>) => eb.ref('a.id')

  db.insertInto('a')
    .values({ id: 1 })
    .onConflict((oc) => oc.column('id').doUpdateSet({ id }))
})

test('accepts expression helpers in conflict update factories', () => {
  const db = null! as Kysely<DatabaseAB>

  db.insertInto('a')
    .values({ id: 1 })
    .onConflict((oc) =>
      oc.column('id').doUpdateSet((eb) => {
        accept<ExpressionBuilder<DatabaseA, 'a'>>(eb)
        accept<ExpressionBuilder<{ excluded: { id: number } }, 'excluded'>>(eb)
        return { id: eb.ref('excluded.id') }
      }),
    )
})

test('accepts reusable conflict update factories', () => {
  const db = null! as Kysely<DatabaseAB>
  const update = (
    eb: ExpressionBuilder<{ excluded: { id: number } }, 'excluded'>,
  ) => ({
    id: eb.ref('excluded.id'),
  })

  db.insertInto('a')
    .values({ id: 1 })
    .onConflict((oc) => oc.column('id').doUpdateSet(update))
})

test('keeps conflict update values optional', () => {
  const db = null! as Kysely<DatabaseAB>

  db.insertInto('a')
    .values({ id: 1 })
    .onConflict((oc) => oc.doUpdateSet({}))
  db.insertInto('a')
    .values({ id: 1 })
    .onConflict((oc) => oc.doUpdateSet({ id: undefined }))
})

test('preserves explicit undefined and null in conflict column update types', () => {
  const db = null! as Kysely<{
    a: {
      id: number
      converted: ColumnType<Date, string, string>
      optional: ColumnType<string, string | undefined, string | undefined>
      nullable: number | null
    }
  }>

  db.insertInto('a').onConflict((oc) =>
    oc.doUpdateSet((eb) => {
      accept<Expression<number>>(eb.ref('a.id'))
      accept<Expression<number>>(eb.ref('excluded.id'))
      accept<Expression<string>>(eb.ref('excluded.converted'))
      // @ts-expect-error conflict expressions use the update type, not Date
      accept<Expression<Date>>(eb.ref('excluded.converted'))
      accept<Expression<string | undefined>>(eb.ref('excluded.optional'))
      expectTypeOf(
        eb.selectFrom('excluded').select('optional').execute(),
      ).toEqualTypeOf<Promise<{ optional: string | undefined }[]>>()
      accept<Expression<number | null>>(eb.ref('excluded.nullable'))
      // @ts-expect-error nullable columns must not become nonnullable
      accept<Expression<number>>(eb.ref('excluded.nullable'))
      return { converted: eb.ref('excluded.converted') }
    }),
  )
})

test('keeps non-updatable columns out of conflict updates', () => {
  const db = null! as Kysely<{
    a: { id: number; locked: ColumnType<number, number, never> }
  }>

  db.insertInto('a').onConflict((oc) =>
    oc.doUpdateSet((eb) => {
      // @ts-expect-error locked is not an updatable column
      eb.ref('excluded.locked')
      // @ts-expect-error excluded contains columns of a, not arbitrary columns
      eb.ref('excluded.missing')
      return { id: eb.ref('excluded.id') }
    }),
  )
  db.insertInto('a').onConflict((oc) =>
    oc.doUpdateSet({
      // @ts-expect-error locked cannot be updated
      locked: 1,
    }),
  )
})

test('rejects incompatible conflict expression helpers', () => {
  const db = null! as Kysely<DatabaseA>
  const id = (eb: ExpressionBuilder<{ a: { id: string } }, 'a'>) => eb.lit(1)

  db.insertInto('a')
    .values({ id: 1 })
    .onConflict((oc) =>
      oc.doUpdateSet({
        // @ts-expect-error a.id is numeric, not a string
        id,
      }),
    )
})
