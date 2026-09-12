import { expectTypeOf, test } from 'vitest'
import type { ColumnType, FunctionModule } from '../../../dist/index.js'
import {
  accept,
  type DatabaseA,
  type DatabaseAB,
} from './assignability.fixtures.js'

type Functions<DB, TB extends keyof DB = keyof DB> = {
  readonly fn: FunctionModule<DB, TB>
}

test('accepts extra tables through function-module properties', () => {
  const source = null! as Functions<DatabaseAB>

  // Exercise both the module and a containing type: older compilers could
  // accept the first assignment, then reject the second using cached variance.
  accept<FunctionModule<DatabaseA, 'a'>>(source.fn)
  accept<Functions<DatabaseA>>(source)
})

test('rejects function modules missing required tables', () => {
  const source = null! as Functions<DatabaseA>
  const unknown = null! as Functions<unknown>

  // @ts-expect-error the source cannot reference table b
  accept<Functions<DatabaseAB>>(source)
  // @ts-expect-error the source does not know table a
  accept<Functions<DatabaseA>>(unknown)
})

test('preserves function-module table scope independently of other tables', () => {
  const small = null! as Functions<DatabaseA, 'a'>
  const large = null! as Functions<DatabaseAB, 'a'>

  accept<Functions<DatabaseA, 'a'>>(large)
  accept<Functions<DatabaseAB, 'a'>>(small)
  // @ts-expect-error b is outside the source module's visible tables
  accept<Functions<DatabaseAB, 'b'>>(large)
})

test('allows wider nullable function-module reads', () => {
  const source = null! as Functions<DatabaseA>
  accept<Functions<{ a: { id: number | null } }>>(source)
})

test('rejects incompatible function-module reads', () => {
  const nullable = null! as Functions<{ a: { id: number | null } }>
  const string = null! as Functions<{ a: { id: string } }>

  // @ts-expect-error the source can produce null
  accept<Functions<DatabaseA>>(nullable)
  // @ts-expect-error the source produces strings instead of numbers
  accept<Functions<DatabaseA>>(string)
})

test('ignores insert and update types when assigning function modules', () => {
  const source = null! as Functions<{
    a: { id: ColumnType<number, string, boolean> }
  }>
  accept<Functions<{ a: { id: ColumnType<number, Date, number> } }>>(source)
})

test('allows any as a function-module schema escape hatch', () => {
  const typed = null! as Functions<DatabaseA>
  const untyped = null! as Functions<any>

  accept<Functions<DatabaseA>>(untyped)
  accept<Functions<any>>(typed)
})

test('keeps the function-module schema marker out of public keys', () => {
  expectTypeOf<
    '~DB' extends keyof FunctionModule<DatabaseA, 'a'> ? true : false
  >().toEqualTypeOf<false>()
})
