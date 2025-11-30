import type { InsertQueryNode } from '../operation-node/insert-query-node.js'
import { MatchedNode } from '../operation-node/matched-node.js'
import {
  type OperationNodeSource,
  isOperationNodeSource,
} from '../operation-node/operation-node-source.js'
import type { OperationNode } from '../operation-node/operation-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import { WhenNode } from '../operation-node/when-node.js'
import { isString } from '../util/object-utils.js'
import {
  parseFilterList,
  parseReferentialBinaryOperation,
  parseValueBinaryOperationOrExpression,
} from './binary-operation-parser.js'

export function parseMergeWhen(
  type: {
    isMatched: boolean
    bySource?: boolean
  },
  args?: any[],
  refRight?: boolean,
): WhenNode {
  return WhenNode.create(
    parseFilterList(
      [
        MatchedNode.create(!type.isMatched, type.bySource),
        ...(args && args.length > 0
          ? [
              args.length === 3 && refRight
                ? parseReferentialBinaryOperation(args[0], args[1], args[2])
                : parseValueBinaryOperationOrExpression(args),
            ]
          : []),
      ],
      'and',
      false,
    ),
  )
}

export function parseMergeThen(
  result: 'delete' | 'do nothing' | OperationNodeSource | InsertQueryNode,
): OperationNode {
  if (isString(result)) {
    return RawNode.create([result], [])
  }

  if (isOperationNodeSource(result)) {
    return result.toOperationNode()
  }

  return result
}
