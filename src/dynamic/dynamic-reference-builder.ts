import { ColumnNode } from '../operation-node/column-node.js'
import { OperationNodeSource } from '../operation-node/operation-node-source.js'
import { ReferenceNode } from '../operation-node/reference-node.js'
import { parseStringReference } from '../parser/reference-parser.js'

export class DynamicReferenceBuilder<R extends string = never>
  implements OperationNodeSource
{
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

  toOperationNode(): ReferenceNode | ColumnNode {
    return parseStringReference(this.#dynamicReference)
  }
}
