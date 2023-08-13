export class UpdateResult {
  /**
   * The number of rows the update query updated. Even the rows whose value
   * didn't change are counted in this value. Consider this query:
   *
   * ```ts
   * db.updateTable('person')
   *   .set({ first_name: 'Jennifer' })
   *   .where('last_name', '=', 'Aniston')
   *   .execute()
   * ```
   *
   * `numUpdatedRows` will return the total number of rows whose `last_name` is
   * `Aniston`, even if their `first_name` was already `Jennifer`.
   */
  readonly numUpdatedRows: bigint

  /**
   * The number of rows whose value was changed by the update. This
   * value is only returned by some dialects like `MySQL`.
   */
  readonly numChangedRows?: bigint

  constructor(numUpdatedRows: bigint, numChangedRows: bigint | undefined) {
    this.numUpdatedRows = numUpdatedRows
    this.numChangedRows = numChangedRows
  }
}
