export function preventAwait(clazz: Function, message: string): void {
  Object.defineProperties(clazz.prototype, {
    then: {
      enumerable: false,
      value: () => {
        throw new Error(message)
      },
    },
  })
}
