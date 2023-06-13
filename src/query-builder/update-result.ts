export class UpdateResult {
  readonly numUpdatedRows: bigint
  readonly numChangedRows?: bigint

  constructor(numUpdatedRows: bigint, numChangedRows: bigint) {
    this.numUpdatedRows = numUpdatedRows
    this.numChangedRows = numChangedRows
  }
}
