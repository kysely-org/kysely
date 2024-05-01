import { freeze } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

type OrConflictNodeResolutions =
  | 'Rollback'
  | 'Abort'
  | 'Fail'
  | 'Ignore'
  | 'Replace'

export interface OrConflictNode extends OperationNode {
  readonly kind: 'OrConflictNode'
  readonly resolution: OrConflictNodeResolutions
}

/**
 * @internal
 */
export const OrConflictNode = freeze({
  is(node: OperationNode): node is OrConflictNode {
    return node.kind === 'OrConflictNode'
  },

  create(resolution: OrConflictNodeResolutions): OrConflictNode {
    return freeze({
      kind: 'OrConflictNode',
      resolution,
    })
  },
})
