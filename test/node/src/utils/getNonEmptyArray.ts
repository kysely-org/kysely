/**
 * Returns same array if it is not empty or `undefined` otherwise
 *
 * @example
 * getNonEmptyArray([]) => undefined
 * getNonEmptyArray([1]) => [1]
 */
export function getNonEmptyArray<T>(arr: T[]): [T, ...T[]] | undefined {
  if (!arr.length) return undefined
  return arr as [T, ...T[]]
}
