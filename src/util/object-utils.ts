export type PrimitiveValue =
  | string
  | number
  | boolean
  | null
  | Date
  | Buffer
  | BigInt

export function isEmpty(
  obj: ArrayLike<any> | string | object | Buffer
): boolean {
  if (Array.isArray(obj) || isString(obj) || Buffer.isBuffer(obj)) {
    return obj.length === 0
  } else if (obj) {
    return Object.keys(obj).length === 0
  }

  return false
}

export function isString(obj: any): obj is string {
  return typeof obj === 'string'
}

export function isNumber(obj: any): obj is number {
  return typeof obj === 'number'
}

export function isBoolean(obj: any): obj is boolean {
  return typeof obj === 'boolean'
}

export function isNull(obj: any): obj is null {
  return obj === null
}

export function isDate(obj: any): obj is Date {
  return obj instanceof Date
}

export function isBuffer(obj: any): obj is Buffer {
  return Buffer.isBuffer(obj)
}

export function isBigInt(obj: any): obj is BigInt {
  return typeof obj === 'bigint'
}

export function isPrimitive(obj: any): obj is PrimitiveValue {
  return (
    isString(obj) ||
    isNumber(obj) ||
    isBoolean(obj) ||
    isNull(obj) ||
    isDate(obj) ||
    isBuffer(obj) ||
    isBigInt(obj)
  )
}

export function isFunction(obj: any): obj is Function {
  return typeof obj === 'function'
}

export function isObject(obj: any): obj is Record<string, any> {
  return obj && typeof obj === 'object'
}

export function getLast<T>(arr: ArrayLike<T>): T | undefined {
  return arr[arr.length - 1]
}

export function freeze<T>(obj: T): Readonly<T> {
  return Object.freeze(obj)
}

export function asArray<T>(arg: T | T[]): T[] {
  if (Array.isArray(arg)) {
    return arg
  } else {
    return [arg]
  }
}

export function asReadonlyArray<T>(
  arg: T | ReadonlyArray<T>
): ReadonlyArray<T> {
  if (isReadonlyArray(arg)) {
    return arg
  } else {
    return freeze([arg])
  }
}

function isReadonlyArray(arg: any): arg is ReadonlyArray<any> {
  return Array.isArray(arg)
}
