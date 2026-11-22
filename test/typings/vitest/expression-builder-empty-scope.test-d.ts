import { expectTypeOf, test } from 'vitest'
import type {
  ColumnType,
  Expression,
  ExpressionBuilder,
  FunctionModule,
  Kysely,
} from '../../../dist/index.js'
import { accept, type DatabaseAB } from './assignability.fixtures.js'

test('function modules with tables in scope are assignable to an empty scope', () => {
  const fn = null! as FunctionModule<DatabaseAB, 'a' | 'b'>
  accept<FunctionModule<DatabaseAB, never>>(fn)
})

test('expression builders with tables in scope are assignable to an empty scope', () => {
  const eb = null! as ExpressionBuilder<DatabaseAB, 'a' | 'b'>
  accept<ExpressionBuilder<DatabaseAB, never>>(eb)
  accept<ExpressionBuilder<Pick<DatabaseAB, 'a'>, never>>(eb)
})

test('empty scope helpers with their own subqueries can be passed to queries with tables in scope', () => {
  const db = null! as Kysely<DatabaseAB>
  const hasRows = (eb: ExpressionBuilder<DatabaseAB, never>) =>
    eb.exists(eb.selectFrom('b').select('id'))

  db.selectFrom('a').selectAll().where(hasRows)
})

test('empty scope helpers can be used in conflict updates with converted columns', () => {
  type DB = { a: { id: number; converted: ColumnType<Date, string, string> } }
  const db = null! as Kysely<DB>
  const id = (eb: ExpressionBuilder<DB, never>) => eb.val(1)

  db.insertInto('a').onConflict((oc) => oc.doUpdateSet({ id }))
  db.insertInto('a').onConflict((oc) =>
    oc.doUpdateSet((eb) => {
      accept<ExpressionBuilder<DB, never>>(eb)
      return { id: id(eb), converted: eb.ref('excluded.converted') }
    }),
  )
})

test('empty scopes reject column references, unknown tables and assignment to scopes with tables', () => {
  const eb = null! as ExpressionBuilder<DatabaseAB, never>
  // @ts-expect-error no table is in scope
  eb.ref('a.id')
  // @ts-expect-error the column-reference overload cannot be called
  eb.fn.any('a.id')
  // @ts-expect-error an empty scope does not provide table a
  accept<ExpressionBuilder<DatabaseAB, 'a'>>(eb)
  // @ts-expect-error an empty function-module scope does not provide table a
  accept<FunctionModule<DatabaseAB, 'a'>>(eb.fn)
  // @ts-expect-error introducing a subquery still requires a known table
  eb.selectFrom('missing')
})

test('fn.any accepts array expressions and subqueries in an empty scope', () => {
  const eb = null! as ExpressionBuilder<DatabaseAB, never>
  accept<Expression<number>>(eb.fn.any(eb.val([1, 2])))
  accept<Expression<number>>(eb.fn.any(eb.selectFrom('a').select('id')))
  // @ts-expect-error scalar values are not arrays or subqueries
  eb.fn.any(eb.val(1))
})

test('fn.any keeps column inference and errors with tables in scope', () => {
  const eb = null! as ExpressionBuilder<
    { a: { id: number; values: readonly string[] | null } },
    'a'
  >
  expectTypeOf(eb.fn.any('a.values').expressionType).toEqualTypeOf<
    string | undefined
  >()
  // @ts-expect-error ANY of a scalar column is still an error, not an expression
  accept<Expression<unknown>>(eb.fn.any('a.id'))
  // @ts-expect-error unknown references remain invalid
  eb.fn.any('a.missing')
})

test('scopes with tables are not assignable to scopes with incompatible column types', () => {
  const eb = null! as ExpressionBuilder<{ a: { id: string } }, 'a'>
  // @ts-expect-error an in-scope string column cannot satisfy a numeric column
  accept<ExpressionBuilder<{ a: { id: number } }, 'a'>>(eb)
})
