import type {
  ControlledTransaction,
  Kysely,
  Transaction,
} from '../../../dist/index.js'

export type Row = { id: number }
export type DatabaseA = { a: Row }
export type DatabaseB = { b: Row }
export type DatabaseAB = DatabaseA & DatabaseB

export type Instances<DB> = {
  db: Kysely<DB>
  transaction: Transaction<DB>
  controlled: ControlledTransaction<DB>
}

export declare const a: Instances<DatabaseA>
export declare const b: Instances<DatabaseB>
export declare const ab: Instances<DatabaseAB>

export declare function accept<T>(value: T): void
