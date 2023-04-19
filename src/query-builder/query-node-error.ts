import { QueryNode } from '../operation-node/query-node.js'
import { isClass } from '../util/object-utils.js'

export type QueryNodeErrorConstructor =
  | QueryNodeErrorClass
  | QueryNodeErrorFunction
export type QueryNodeErrorClass = new (node: QueryNode) => Error
export type QueryNodeErrorFunction = (node: QueryNode) => Error

export function createQueryNodeError(
  fn: QueryNodeErrorConstructor,
  node: QueryNode
): Error {
  return isClass(fn) ? new fn(node) : fn(node)
}
