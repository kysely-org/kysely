import { AliasedRawBuilder, RawBuilder } from '../raw-builder/raw-builder'
import { AliasedQueryBuilder, QueryBuilder } from './query-builder'

export type ValueType<T> = T[keyof T]

/**
 * Given a database type and a union of table names returns the row type
 * that you would get by selecting all columns from tables TB.
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
 * type Row = RowType<Database, 'person' | 'movie'>
 *
 * // Row == Person & Movie
 * ```
 */
export type RowType<DB, TB extends keyof DB> = UnionToIntersection<DB[TB]>

/**
 * Evil typescript magic to convert a union type `A | B | C` into an
 * intersection type `A & B & C`.
 */
export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never

/**
 * Given a database type and a union of table name in that db returns
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
 * // Columns == 'id' | 'name' | 'species'
 * ```
 */
export type AnyColumn<DB, TB extends keyof DB> = {
  [T in TB]: keyof DB[T]
}[TB]

/**
 * Given a database type and a union of table names in that db returns
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
 * type Columns = AnyColumn<Database, 'person' | 'pet'>
 *
 * // Columns == 'person.id' | 'pet.name' | 'pet.species'
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
 * Extracts an array item type.
 */
export type ArrayItemType<T> = T extends ReadonlyArray<infer I> ? I : never

export type AnyQueryBuilder = QueryBuilder<any, any, any>
export type AnyAliasedQueryBuilder = AliasedQueryBuilder<any, any, any, any>

export type QueryBuilderFactory<DB, TB extends keyof DB, O> = (
  qb: QueryBuilder<DB, TB, O>
) => QueryBuilder<any, any, any>

export type AliasedQueryBuilderFactory<DB, TB extends keyof DB, O> = (
  qb: QueryBuilder<DB, TB, O>
) => AnyAliasedQueryBuilder

export type RawBuilderFactory<DB, TB extends keyof DB, O> = (
  qb: QueryBuilder<DB, TB, O>
) => RawBuilder<any>

export type AliasedRawBuilderFactory<DB, TB extends keyof DB, O> = (
  qb: QueryBuilder<DB, TB, O>
) => AliasedRawBuilder<any, any>
