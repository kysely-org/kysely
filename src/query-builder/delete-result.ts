export class DeleteResult {
  readonly #numDeletedRows: bigint

  constructor(numDeletedRows: bigint) {
    this.#numDeletedRows = numDeletedRows
  }

  get numDeletedRows(): bigint {
    return this.#numDeletedRows
  }
}

Object.defineProperty(DeleteResult.prototype, 'numDeletedRows', {
  enumerable: true,
})
