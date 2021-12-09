export class UpdateResult {
  readonly #numUpdatedRows: bigint

  constructor(numUpdatedRows: bigint) {
    this.#numUpdatedRows = numUpdatedRows
  }

  get numUpdatedRows(): bigint {
    return this.#numUpdatedRows
  }
}
