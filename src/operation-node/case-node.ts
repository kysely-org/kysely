import { freeze } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'
import { WhenNode } from './when-node.js'

export interface CaseNode extends OperationNode {
  readonly kind: 'CaseNode'
  readonly value?: OperationNode
  readonly when?: ReadonlyArray<WhenNode>
  readonly else?: OperationNode
  readonly isStatement?: boolean
}

type CaseNodeFactory = Readonly<{
  is(node: OperationNode): node is CaseNode
  create(value?: OperationNode): Readonly<CaseNode>
  cloneWithWhen(caseNode: CaseNode, when: WhenNode): Readonly<CaseNode>
  cloneWithThen(caseNode: CaseNode, then: OperationNode): Readonly<CaseNode>
  cloneWith(
    caseNode: CaseNode,
    props: Partial<Pick<CaseNode, 'else' | 'isStatement'>>,
  ): Readonly<CaseNode>
}>

/**
 * @internal
 */
export const CaseNode: CaseNodeFactory = freeze<CaseNodeFactory>({
  is(node): node is CaseNode {
    return node.kind === 'CaseNode'
  },

  create(value?) {
    return freeze({
      kind: 'CaseNode',
      value,
    })
  },

  cloneWithWhen(caseNode, when) {
    return freeze({
      ...caseNode,
      when: freeze(caseNode.when ? [...caseNode.when, when] : [when]),
    })
  },

  cloneWithThen(caseNode, then) {
    return freeze({
      ...caseNode,
      when: caseNode.when
        ? freeze([
            ...caseNode.when.slice(0, -1),
            WhenNode.cloneWithResult(
              caseNode.when[caseNode.when.length - 1],
              then,
            ),
          ])
        : undefined,
    })
  },

  cloneWith(caseNode, props) {
    return freeze({
      ...caseNode,
      ...props,
    })
  },
})
