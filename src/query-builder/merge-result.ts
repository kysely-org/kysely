export class MergeResult {
  readonly numChangedRows: bigint | undefined

  constructor(numChangedRows: bigint | undefined) {
    this.numChangedRows = numChangedRows
  }
}
