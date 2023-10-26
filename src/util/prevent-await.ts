let prevent = true

export function preventAwait(clazz: Function, message: string): void {
  Object.defineProperty(clazz.prototype, 'then', {
    configurable: true,
    value(resolve: any, reject: any) {
      if (prevent) {
        reject(new Error(`${message} (see also: allowNoopAwait)`))
      } else {
        delete clazz.prototype.then
        return resolve(this)
      }
    },
  })
}

/**
 * Kysely objects intentionally throw errors when awaited
 * to prevent confusion for people coming from knex.
 * Calling this function will disable the error-throwing behavior globally,
 * useful when managing Kysely objects within Promises.
 *
 * This action cannot be undone.
 */
export function allowNoopAwait() {
  prevent = false
}
