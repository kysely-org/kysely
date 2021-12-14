import { DeleteResult } from '../query-builder/delete-result.js'
import { InsertResult } from '../query-builder/insert-result.js'
import { UpdateResult } from '../query-builder/update-result.js'
import { Selection } from './select-parser.js'

export type ReturningRow<
  DB,
  TB extends keyof DB,
  O,
  SE
> = O extends InsertResult
  ? Selection<DB, TB, SE>
  : O extends DeleteResult
  ? Selection<DB, TB, SE>
  : O extends UpdateResult
  ? Selection<DB, TB, SE>
  : O & Selection<DB, TB, SE>
