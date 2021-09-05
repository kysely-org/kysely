import { DynamicReferenceBuilder } from './dynamic-reference-builder'

export class DynamicModule {
  ref<R extends string = never>(reference: string): DynamicReferenceBuilder<R> {
    return new DynamicReferenceBuilder<R>(reference)
  }
}
