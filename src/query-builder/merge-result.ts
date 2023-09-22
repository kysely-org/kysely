export class MergeResult {
  readonly numChangedRows?: bigint

  constructor(numChangedRows: bigint | undefined) {
    this.numChangedRows = numChangedRows
  }
}
