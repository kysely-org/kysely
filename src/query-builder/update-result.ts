import { makePropertiesEnumerable } from '../util/object-utils.js'

export class UpdateResult {
  readonly #numUpdatedRows: bigint
  readonly #numChangedRows?: bigint

  constructor(numUpdatedRows: bigint, numChangedRows: bigint | undefined) {
    this.#numUpdatedRows = numUpdatedRows
    this.#numChangedRows = numChangedRows
  }

  get numUpdatedRows(): bigint {
    return this.#numUpdatedRows
  }

  /**
   * This is only supported by some dialects like MySQL.
   */
  get numChangedRows(): bigint | undefined {
    return this.#numChangedRows
  }
}

makePropertiesEnumerable(UpdateResult, 'numUpdatedRows', 'numChangedRows')
