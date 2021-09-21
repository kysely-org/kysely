import { GeneratedPlaceholder } from '../query-builder/type-utils'
import { freeze, isObject } from './object-utils'

export const generatedPlaceholder: GeneratedPlaceholder = freeze({
  __isGeneratedPlaceholder__: true,
})

export function isGeneratedPlaceholder(
  obj: unknown
): obj is GeneratedPlaceholder {
  return isObject(obj) && obj.__isGeneratedPlaceholder__ === true
}
