export class DeleteResult {
  /**
   * The number of rows deleted by the query. Zero if no rows matched.
   */
  readonly numDeletedRows: bigint

  constructor(numDeletedRows: bigint) {
    this.numDeletedRows = numDeletedRows
  }
}
