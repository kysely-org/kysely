export class UpdateResult {
  /**
   * The number of rows the update query updated.
  */
  readonly numUpdatedRows: bigint

  /**
   * The number of rows the update query changed.
   * This is **optional** and only provided by some drivers like `node-mysql2`.
   * You would probably use `numUpdatedRows` in most cases.
  */
  readonly numChangedRows?: bigint

  constructor(numUpdatedRows: bigint, numChangedRows: bigint | undefined) {
    this.numUpdatedRows = numUpdatedRows
    this.numChangedRows = numChangedRows
  }
}
