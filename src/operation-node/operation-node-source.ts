import { isFunction, isObject } from '../util/object-utils.js'
import type { OperationNode } from './operation-node.js'

export interface OperationNodeSource {
  toOperationNode(): OperationNode
}

export function isOperationNodeSource(
  obj: unknown,
): obj is OperationNodeSource {
  return isObject(obj) && isFunction(obj.toOperationNode)
}
