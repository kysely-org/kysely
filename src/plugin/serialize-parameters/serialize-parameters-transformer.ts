import { ColumnUpdateNode } from '../../operation-node/column-update-node.js'
import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js'
import { PrimitiveValueListNode } from '../../operation-node/primitive-value-list-node.js'
import { ValueListNode } from '../../operation-node/value-list-node.js'
import { ValueNode } from '../../operation-node/value-node.js'
import { ValuesNode } from '../../operation-node/values-node.js'
import {
  Caster,
  defaultSerializer,
  Serializer,
} from './serialize-parameters.js'

export class SerializeParametersTransformer extends OperationNodeTransformer {
  readonly #caster: Caster | undefined
  readonly #serializer: Serializer

  constructor(serializer: Serializer | undefined, caster: Caster | undefined) {
    super()
    this.#caster = caster
    this.#serializer = serializer || defaultSerializer
  }

  protected override transformValues(node: ValuesNode): ValuesNode {
    if (!this.#caster) {
      return super.transformValues(node)
    }

    return super.transformValues({
      ...node,
      values: node.values.map((valueItemNode) => {
        if (valueItemNode.kind !== 'PrimitiveValueListNode') {
          return valueItemNode
        }

        return {
          kind: 'ValueListNode',
          values: valueItemNode.values.map(
            (value) =>
              ({
                kind: 'ValueNode',
                value,
              } as ValueNode)
          ),
        } as ValueListNode
      }),
    })
  }

  protected override transformValueList(node: ValueListNode): ValueListNode {
    if (!this.#caster) {
      return super.transformValueList(node)
    }

    return super.transformValueList({
      ...node,
      values: node.values.map((listNodeItem) => {
        if (listNodeItem.kind !== 'ValueNode') {
          return listNodeItem
        }

        const { value } = listNodeItem

        const serializedValue = this.#serializer(value)

        if (value === serializedValue) {
          return listNodeItem
        }

        return this.#caster!(serializedValue, value).toOperationNode()
      }),
    })
  }

  protected override transformPrimitiveValueList(
    node: PrimitiveValueListNode
  ): PrimitiveValueListNode {
    return {
      ...node,
      values: node.values.map(this.#serializer),
    }
  }

  protected transformColumnUpdate(node: ColumnUpdateNode): ColumnUpdateNode {
    const { value: valueNode } = node

    if (!this.#caster || valueNode.kind !== 'ValueNode') {
      return super.transformColumnUpdate(node)
    }

    const { value } = valueNode

    const serializedValue = this.#serializer(value)

    if (value === serializedValue) {
      return super.transformColumnUpdate(node)
    }

    return super.transformColumnUpdate({
      ...node,
      value: this.#caster(serializedValue, value).toOperationNode(),
    })
  }

  protected override transformValue(node: ValueNode): ValueNode {
    return {
      ...node,
      value: this.#serializer(node.value),
    }
  }
}
