export class DeleteResult {
  readonly numDeletedRows: bigint

  constructor(numDeletedRows: bigint) {
    this.numDeletedRows = numDeletedRows
  }
}
