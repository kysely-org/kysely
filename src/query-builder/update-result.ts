export class UpdateResult {
  readonly #numUpdatedRows: bigint
  readonly #numChangedRows: bigint

  constructor(numUpdatedRows: bigint, numChangedRows: bigint) {
    this.#numUpdatedRows = numUpdatedRows
    this.#numChangedRows = numChangedRows
  }

  get numUpdatedRows(): bigint {
    return this.#numUpdatedRows
  }

  /**
   * MySQL-only
   */
  get numChangedRows(): bigint {
    return this.#numChangedRows
  }
}

for (const property of ['numUpdatedRows', 'numChangedRows']) {
  Object.defineProperty(UpdateResult.prototype, property, { enumerable: true })
}
