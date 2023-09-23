import { Expression } from '../expression/expression.js'
import { InsertQueryNode } from '../operation-node/insert-query-node.js'
import {
  OperationNodeSource,
  isOperationNodeSource,
} from '../operation-node/operation-node-source.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import { UpdateQueryNode } from '../operation-node/update-query-node.js'
import { WhenNode } from '../operation-node/when-node.js'
import { isString } from '../util/object-utils.js'
import { parseFilterList } from './binary-operation-parser.js'

export function parseMergeWhen(
  isMatched: boolean,
  and: Expression<any> | undefined
): WhenNode {
  return WhenNode.create(
    parseFilterList(
      [
        RawNode.create([isMatched ? 'matched' : 'not matched'], []),
        ...(and ? [and] : []),
      ],
      'and'
    )
  )
}

export function parseMergeThen(
  result: 'delete' | 'do nothing' | OperationNodeSource | InsertQueryNode
): OperationNode {
  if (isString(result)) {
    return RawNode.create([result], [])
  }

  if (isOperationNodeSource(result)) {
    return result.toOperationNode()
  }

  return result
}
