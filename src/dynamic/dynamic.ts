import { freeze } from '../util/object-utils'
import { DynamicReferenceBuilder } from './dynamic-reference-builder'

export interface Dynamic {
  ref<R extends string = never>(reference: string): DynamicReferenceBuilder<R>
}

export function createDynamicObject(): Dynamic {
  return freeze({
    ref<R extends string = never>(reference: string) {
      return new DynamicReferenceBuilder<R>(reference)
    },
  })
}
