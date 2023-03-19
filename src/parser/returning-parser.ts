import { DeleteResult } from '../query-builder/delete-result.js'
import { InsertResult } from '../query-builder/insert-result.js'
import { UpdateResult } from '../query-builder/update-result.js'
import { Selection, AllSelection } from './select-parser.js'

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

export type ReturningAllRow<DB, TB extends keyof DB, O> = O extends InsertResult
  ? AllSelection<DB, TB>
  : O extends DeleteResult
  ? AllSelection<DB, TB>
  : O extends UpdateResult
  ? AllSelection<DB, TB>
  : O & AllSelection<DB, TB>
