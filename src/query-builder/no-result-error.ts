import { QueryNode } from '../operation-node/query-node.js'
import { RawNode } from '../operation-node/raw-node.js'

export type NoResultErrorConstructor = new (node: QueryNode | RawNode) => Error

export class NoResultError extends Error {
  /**
   * The operation node tree of the query that was executed.
   */
  readonly node: QueryNode | RawNode

  constructor(node: QueryNode | RawNode) {
    super('no result')
    this.node = node
  }
}
