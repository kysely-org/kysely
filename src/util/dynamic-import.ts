import { isFunction, isObject } from './object-utils.js'

export async function importFunction<T extends Function>(
  modulePath: string
): Promise<T> {
  const module: unknown = await import(modulePath)
  const errorMessage = `module "${modulePath}" doesn't export a function`

  if (isFunction(module)) {
    return module as T
  } else if (isObject(module) && isFunction(module.default)) {
    return module.default as T
  }

  throw new Error(errorMessage)
}

export async function importNamedFunction<T extends Function>(
  modulePath: string,
  exportName: string
): Promise<T> {
  const module: unknown = await import(modulePath)
  const errorMessage = `no function export named "${exportName}" found in module "${modulePath}"`

  if (!isObject(module)) {
    throw new Error(errorMessage)
  }

  if (isFunction(module[exportName])) {
    return module[exportName] as T
  } else if (
    isObject(module.default) &&
    isFunction(module.default[exportName])
  ) {
    return module.default[exportName] as T
  }

  throw new Error(errorMessage)
}
