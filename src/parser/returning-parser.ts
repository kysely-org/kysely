import type { DeleteResult } from '../query-builder/delete-result.js'
import type { InsertResult } from '../query-builder/insert-result.js'
import type { MergeResult } from '../query-builder/merge-result.js'
import type { UpdateResult } from '../query-builder/update-result.js'
import type {
  Selection,
  AllSelection,
  CallbackSelection,
} from './select-parser.js'

export type ReturningRow<DB, TB extends keyof DB, O, SE> = O extends
  | InsertResult
  | DeleteResult
  | UpdateResult
  | MergeResult
  ? Selection<DB, TB, SE>
  : O & Selection<DB, TB, SE>

export type ReturningCallbackRow<DB, TB extends keyof DB, O, CB> = O extends
  | InsertResult
  | DeleteResult
  | UpdateResult
  | MergeResult
  ? CallbackSelection<DB, TB, CB>
  : O & CallbackSelection<DB, TB, CB>

export type ReturningAllRow<DB, TB extends keyof DB, O> = O extends
  | InsertResult
  | DeleteResult
  | UpdateResult
  | MergeResult
  ? AllSelection<DB, TB>
  : O & AllSelection<DB, TB>
