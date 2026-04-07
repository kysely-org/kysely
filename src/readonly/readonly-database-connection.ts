import type { QueryResult } from '../driver/database-connection.js'
import type { KyselyTypeError } from '../util/type-error.js'

/**
 * Similar to {@link QueryResult} but for read-only queries.
 */
export interface ReadonlyQueryResult<R> extends Pick<QueryResult<R>, 'rows'> {
  /**
   * @deprecated read-only queries do not affect any rows.
   */
  readonly numAffectedRows?: KyselyTypeError<'read-only queries do not affect any rows.'>

  /**
   * @deprecated read-only queries do not change any rows.
   */
  readonly numChangedRows?: KyselyTypeError<'read-only queries do not change any rows.'>

  /**
   * @deprecated read-only queries do not insert anything.
   */
  readonly insertId?: KyselyTypeError<'read-only queries do not insert anything.'>
}
