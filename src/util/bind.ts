import { isFunction } from './object-utils.js'

export function bindAllMethods(obj: any) {
  for (const k of Object.getOwnPropertyNames(Object.getPrototypeOf(obj))) {
    if (isFunction(obj[k]) && k !== 'constructor' && k !== 'then') {
      obj[k] = obj[k].bind(obj)
    }
  }
}
