import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'

export interface OutputNode extends OperationNode {
  readonly kind: 'OutputNode'
  readonly selections: ReadonlyArray<OperationNode>
}

type OutputNodeFactory = Readonly<{
  is(node: OperationNode): node is OutputNode
  create(selections: ReadonlyArray<OperationNode>): Readonly<OutputNode>
  cloneWithSelections(
    output: OutputNode,
    selections: ReadonlyArray<OperationNode>,
  ): Readonly<OutputNode>
}>

/**
 * @internal
 */
export const OutputNode: OutputNodeFactory = freeze<OutputNodeFactory>({
  is(node): node is OutputNode {
    return node.kind === 'OutputNode'
  },

  create(selections) {
    return freeze({
      kind: 'OutputNode',
      selections: freeze(selections),
    })
  },

  cloneWithSelections(output, selections) {
    return freeze({
      ...output,
      selections: output.selections
        ? freeze([...output.selections, ...selections])
        : freeze(selections),
    })
  },
})
