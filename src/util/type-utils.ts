import { SelectQueryBuilder } from '../query-builder/select-query-builder.js'
import { InsertResult } from '../query-builder/insert-result.js'
import { DeleteResult } from '../query-builder/delete-result.js'
import { UpdateResult } from '../query-builder/update-result.js'

/**
 * Given an object type, extracts the union of all value types.
 */
export type ValueType<T> = T[keyof T]

/**
 * Given a database type and a union of table names in that db, returns
 * a union type with all possible column names.
 *
 * Example:
 *
 * ```ts
 * interface Person {
 *   id: number
 * }
 *
 * interface Pet {
 *   name: string
 *   species: 'cat' | 'dog'
 * }
 *
 * interface Movie {
 *   stars: number
 * }
 *
 * interface Database {
 *   person: Person
 *   pet: Pet
 *   movie: Movie
 * }
 *
 * type Columns = AnyColumn<Database, 'person' | 'pet'>
 *
 * // Columns == 'id' | 'name' | 'species'
 * ```
 */
export type AnyColumn<DB, TB extends keyof DB> = {
  [T in TB]: keyof DB[T]
}[TB] &
  string

/**
 * Extracts a column type.
 */
export type ExtractColumnType<DB, TB extends keyof DB, C> = {
  [T in TB]: C extends keyof DB[T] ? DB[T][C] : never
}[TB]

/**
 * Given a database type and a union of table names in that db, returns
 * a union type with all possible `table`.`column` combinations.
 *
 * Example:
 *
 * ```ts
 * interface Person {
 *   id: number
 * }
 *
 * interface Pet {
 *   name: string
 *   species: 'cat' | 'dog'
 * }
 *
 * interface Movie {
 *   stars: number
 * }
 *
 * interface Database {
 *   person: Person
 *   pet: Pet
 *   movie: Movie
 * }
 *
 * type Columns = AnyColumnWithTable<Database, 'person' | 'pet'>
 *
 * // Columns == 'person.id' | 'pet.name' | 'pet.species'
 * ```
 */
export type AnyColumnWithTable<DB, TB extends keyof DB> = {
  [T in TB]: T extends string
    ? keyof DB[T] extends string
      ? `${T}.${keyof DB[T]}`
      : never
    : never
}[TB]

/**
 * Just like {@link AnyColumn} but with a ` as <string>` suffix.
 */
export type AnyAliasedColumn<DB, TB extends keyof DB> = {
  [T in TB]: T extends string
    ? keyof DB[T] extends string
      ? `${keyof DB[T]} as ${string}`
      : never
    : never
}[TB]

/**
 * Just like {@link AnyColumnWithTable} but with a ` as <string>` suffix.
 */
export type AnyAliasedColumnWithTable<DB, TB extends keyof DB> = {
  [T in TB]: T extends string
    ? keyof DB[T] extends string
      ? `${T}.${keyof DB[T]} as ${string}`
      : never
    : never
}[TB]

/**
 * Extracts the item type of an array.
 */
export type ArrayItemType<T> = T extends ReadonlyArray<infer I> ? I : never

export type AnySelectQueryBuilder = SelectQueryBuilder<any, any, any>

export type SingleResultType<O> = O extends InsertResult
  ? O
  : O extends DeleteResult
  ? O
  : O extends UpdateResult
  ? O
  : O | undefined

export type UnknownRow = Record<string, unknown>

export type Nullable<T> = { [P in keyof T]: T[P] | null }

/**
 * Takes all properties from T1 and merges all properties from T2
 * that don't exist in T1 as optional properties.
 *
 * Example:
 *
 * interface Person {
 *   name: string
 *   age: number
 * }
 *
 * interface Pet {
 *   name: string
 *   species: 'cat' | 'dog'
 * }
 *
 * type Merged = MergePartial<Person, Pet>
 *
 * // { name: string, age: number, species?: 'cat' | 'dog' }
 */
export type MergePartial<T1, T2> = T1 & Partial<Omit<T2, keyof T1>>

export type IsNever<T> = [T] extends [never] ? true : false

export type Equals<T, U> = (<G>() => G extends T ? 1 : 2) extends <
  G
>() => G extends U ? 1 : 2
  ? true
  : false

/**
 * Use to limit a generic object to a shape's keys, and throw ts errors on unexpected
 * keys.
 *
 * Workaround for {@link https://github.com/Microsoft/TypeScript/issues/12936 typescript issue #12936}
 *
 * Example:
 *
 * ```ts
 * interface Person {
 *   name: string
 * }
 *
 * function greet<T extends Person>(
 *   person: PickWith<T, Person>
 * ) {}
 *
 * greet({}) // ts error.
 * greet({ age: 15 }) // ts error.
 * greet({ name: 'Joe' }) // OK!
 * greet({ name: 15 }) // ts error.
 * greet({ name: 'Joe', age: 15 }) // ts error.
 * ```
 */
export type PickWith<O, S> = {
  [K in keyof O]: K extends keyof S ? O[K] : never
}

/**
 * Same as {@link PickWith}, but for arrays.
 */
export type PickListItemsWith<A, S> = A extends []
  ? A
  : A extends [infer L, ...infer R]
  ? [PickWith<L, S>, ...PickListItemsWith<R, S>]
  : A extends (infer I)[]
  ? PickWith<I, S>[]
  : A

export type ReadonlifyArray<A> = A extends [infer L, ...infer R]
  ? readonly [L, ...R]
  : A extends (infer I)[]
  ? readonly I[]
  : A
