import { isFunction, isObject } from '../util/object-utils.js'
import { OperationNode } from './operation-node.js'

export interface OperationNodeSource {
  toOperationNode(): OperationNode
}

export function isOperationNodeSource(obj: any): obj is OperationNodeSource {
  return isObject(obj) && isFunction(obj.toOperationNode)
}
