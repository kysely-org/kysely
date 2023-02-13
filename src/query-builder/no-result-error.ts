import { QueryNode } from '../operation-node/query-node.js'

export type NoResultErrorConstructor = new (node: QueryNode) => Error

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

export function isNoResultErrorConstructor(
  fn: NoResultErrorConstructor | ((node: QueryNode) => Error)
): fn is NoResultErrorConstructor {
  return Object.prototype.hasOwnProperty.call(fn, 'prototype')
}
