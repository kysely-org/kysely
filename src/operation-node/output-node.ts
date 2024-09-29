import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface OutputNode extends OperationNode {
  readonly kind: 'OutputNode'
  readonly selections: ReadonlyArray<OperationNode>
}

/**
 * @internal
 */
export const OutputNode = freeze({
  is(node: OperationNode): node is OutputNode {
    return node.kind === 'OutputNode'
  },

  create(selections: ReadonlyArray<OperationNode>): OutputNode {
    return freeze({
      kind: 'OutputNode',
      selections: freeze(selections),
    })
  },

  cloneWithSelections(
    output: OutputNode,
    selections: ReadonlyArray<OperationNode>,
  ): OutputNode {
    return freeze({
      ...output,
      selections: output.selections
        ? freeze([...output.selections, ...selections])
        : freeze(selections),
    })
  },
})
