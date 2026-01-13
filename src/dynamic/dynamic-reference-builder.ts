import {
  isOperationNodeSource,
  type OperationNodeSource,
} from '../operation-node/operation-node-source.js'
import type { SimpleReferenceExpressionNode } from '../operation-node/simple-reference-expression-node.js'
import { parseSimpleReferenceExpression } from '../parser/reference-parser.js'
import { isObject, isString } from '../util/object-utils.js'

export class DynamicReferenceBuilder<
  R extends string = never,
> implements OperationNodeSource {
  readonly #dynamicReference: string

  get dynamicReference(): string {
    return this.#dynamicReference
  }

  /**
   * @private
   *
   * This needs to be here just so that the typings work. Without this
   * the generated .d.ts file contains no reference to the type param R
   * which causes this type to be equal to DynamicReferenceBuilder with
   * any R.
   */
  protected get refType(): R {
    return undefined as unknown as R
  }

  constructor(reference: string) {
    this.#dynamicReference = reference
  }

  toOperationNode(): SimpleReferenceExpressionNode {
    return parseSimpleReferenceExpression(this.#dynamicReference)
  }
}

export function isDynamicReferenceBuilder(
  obj: unknown,
): obj is DynamicReferenceBuilder<any> {
  return (
    isObject(obj) &&
    isOperationNodeSource(obj) &&
    isString(obj.dynamicReference)
  )
}
