import { AnyColumn } from '../util/type-utils.js'

export type TableSimilarity<DB, C extends AnyColumn<DB, keyof DB>> = {
  TB: SimilarTables<DB, C>
  DB: DatabaseWithSimilarTables<DB, C>
}

export type SimilarTables<DB, C extends AnyColumn<DB, keyof DB>> = {
  [T in keyof DB]: HasEveryColumn<DB, T, C>
}[keyof DB]

export type HasEveryColumn<DB, TB extends keyof DB, C> = [C] extends [
  keyof DB[TB],
]
  ? TB
  : never

export type DatabaseWithSimilarTables<
  DB,
  C extends AnyColumn<DB, keyof DB>,
> = Omit<DB, SimilarTables<DB, C>> & {
  [T in SimilarTables<DB, C>]: Pick<DB[T], keyof DB[SimilarTables<DB, C>]>
}

export type ScopedTableSimilarity<
  DB,
  TB extends keyof DB,
  C extends AnyColumn<DB, TB>,
> = {
  TB: ScopedSimilarTables<DB, TB, C>
  DB: DatabaseWithScopedSimilarTables<DB, TB, C>
}

export type ScopedSimilarTables<
  DB,
  TB extends keyof DB,
  C extends AnyColumn<DB, TB>,
> = {
  [T in TB]: HasEveryColumn<DB, T, C>
}[TB]

export type DatabaseWithScopedSimilarTables<
  DB,
  TB extends keyof DB,
  C extends AnyColumn<DB, TB>,
> = Omit<DB, ScopedSimilarTables<DB, TB, C>> & {
  [T in ScopedSimilarTables<DB, TB, C>]: Pick<
    DB[T],
    keyof DB[ScopedSimilarTables<DB, TB, C>]
  >
}
