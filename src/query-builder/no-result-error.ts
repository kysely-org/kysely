import { QueryNode } from '../operation-node/query-node.js'

export class NoResultError extends Error {
  /**
   * The operation node tree of the query that was executed.
   */
  readonly node: QueryNode

  constructor(node: QueryNode) {
    super('no result')
    this.node = node
  }
}
