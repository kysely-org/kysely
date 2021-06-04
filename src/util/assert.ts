export function assertNotNullOrUndefined<T>(
  value: T
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(`${value} must not be null or undefined`)
  }
}

export function assertIsString(value: any): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`${value} must be a string`)
  }
}
