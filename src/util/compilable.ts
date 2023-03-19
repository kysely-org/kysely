import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { isFunction, isObject } from './object-utils.js'

export interface Compilable<O = unknown> {
  compile(): CompiledQuery<O>
}

export function isCompilable(value: unknown): value is Compilable {
  return isObject(value) && isFunction(value.compile)
}
