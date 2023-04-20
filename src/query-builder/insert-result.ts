import { setEnumerableProperties } from '../util/object-utils.js'

/**
 * The result of an insert query.
 *
 * If the table has an auto incrementing primary key {@link insertId} will hold
 * the generated id on dialects that support it. For example PostgreSQL doesn't
 * return the id by default and {@link insertId} is undefined. On PostgreSQL you
 * need to use {@link ReturningInterface.returning} or {@link ReturningInterface.returningAll}
 * to get out the inserted id.
 *
 * {@link numInsertedOrUpdatedRows} holds the number of (actually) inserted rows.
 * On MySQL, updated rows are counted twice when using `on duplicate key update`.
 *
 * ### Examples
 *
 * ```ts
 * const result = await db
 *   .insertInto('person')
 *   .values(person)
 *   .executeTakeFirst()
 *
 * console.log(result.insertId)
 * ```
 */
export class InsertResult {
  readonly #insertId: bigint | undefined
  readonly #numInsertedOrUpdatedRows: bigint | undefined

  constructor(
    insertId: bigint | undefined,
    numInsertedOrUpdatedRows: bigint | undefined
  ) {
    this.#insertId = insertId
    this.#numInsertedOrUpdatedRows = numInsertedOrUpdatedRows
  }

  /**
   * The auto incrementing primary key
   */
  get insertId(): bigint | undefined {
    return this.#insertId
  }

  /**
   * Affected rows count.
   */
  get numInsertedOrUpdatedRows(): bigint | undefined {
    return this.#numInsertedOrUpdatedRows
  }
}

setEnumerableProperties(InsertResult, 'insertId', 'numInsertedOrUpdatedRows')
