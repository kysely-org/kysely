import { freeze } from '../util/object-utils'
import { DynamicReferenceBuilder } from './dynamic-reference-builder'

export interface DynamicModule {
  ref<R extends string = never>(reference: string): DynamicReferenceBuilder<R>
}

export function createDynamicModule(): DynamicModule {
  return freeze({
    ref<R extends string = never>(reference: string) {
      return new DynamicReferenceBuilder<R>(reference)
    },
  })
}
