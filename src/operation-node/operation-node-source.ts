import { isFunction, isObject } from '../utils/object-utils'
import { OperationNode } from './operation-node'

export interface OperationNodeSource {
  toOperationNode(): OperationNode
}

export function isOperationNodeSource(obj: any): obj is OperationNodeSource {
  return isObject(obj) && isFunction((obj as any).toOperationNode)
}
