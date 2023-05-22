import { JSONPathNode } from '../operation-node/json-path-node.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import {
  JSONPathBuilder,
  createJSONPathBuilder,
} from '../query-builder/json-path-builder.js'
import { isFunction } from '../util/object-utils.js'

export type JSONPathExpression<S, O> = JSONPathBuilderOrFactory<S, O>

export type JSONPathBuilderOrFactory<S, O> =
  | JSONPathBuilder<S, O>
  | ((pb: JSONPathBuilder<S>) => JSONPathBuilder<S, O>)

export function parseJSONPathExpression(
  expr: JSONPathExpression<any, any>
): JSONPathNode {
  if (isFunction(expr)) {
    const path = expr(createJSONPathBuilder(JSONPathNode.create()))

    return path.toOperationNode() as JSONPathNode
  }

  if (isOperationNodeSource(expr)) {
    return expr.toOperationNode() as JSONPathNode
  }

  throw new Error('Invalid JSON path expression')
}
