import { GeneratedPlaceholder } from './type-utils.js'
import { freeze, isObject } from './object-utils.js'

export const GENERATED_PLACEHOLDER: GeneratedPlaceholder = freeze({
  __isGeneratedPlaceholder__: true,
})

export function isGeneratedPlaceholder(
  obj: unknown
): obj is GeneratedPlaceholder {
  return isObject(obj) && obj.__isGeneratedPlaceholder__ === true
}
