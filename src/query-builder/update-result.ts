export class UpdateResult {
  readonly numUpdatedRows: bigint
  readonly numChangedRows?: bigint

  constructor(numUpdatedRows: bigint, numChangedRows: bigint | undefined) {
    this.numUpdatedRows = numUpdatedRows
    this.numChangedRows = numChangedRows
  }
}
