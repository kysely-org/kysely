import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'
import { WhenNode } from './when-node.js'

export interface CaseNode extends OperationNode {
  readonly kind: 'CaseNode'
  readonly value?: OperationNode
  readonly when?: ReadonlyArray<WhenNode>
  readonly else?: OperationNode
  readonly isStatement?: boolean
}

/**
 * @internal
 */
export const CaseNode = freeze({
  is(node: OperationNode): node is CaseNode {
    return node.kind === 'CaseNode'
  },

  create(value?: OperationNode): CaseNode {
    return freeze({
      kind: 'CaseNode',
      value,
    })
  },

  cloneWithWhen(caseNode: CaseNode, when: WhenNode): CaseNode {
    return freeze({
      ...caseNode,
      when: caseNode.when ? [...caseNode.when, when] : [when],
    })
  },

  cloneWithThen(caseNode: CaseNode, then: OperationNode): CaseNode {
    return freeze({
      ...caseNode,
      when: caseNode.when
        ? [
            ...caseNode.when.slice(0, -1),
            WhenNode.cloneWithResult(
              caseNode.when[caseNode.when.length - 1],
              then
            ),
          ]
        : undefined,
    })
  },

  cloneWith(
    caseNode: CaseNode,
    props: Partial<Pick<CaseNode, 'else' | 'isStatement'>>
  ): CaseNode {
    return freeze({
      ...caseNode,
      ...props,
    })
  },
})
