export class MergeResult {
  /**
   * The number of rows affected by the merge, if provided by the dialect.
   */
  readonly numChangedRows: bigint | undefined

  constructor(numChangedRows: bigint | undefined) {
    this.numChangedRows = numChangedRows
  }
}
