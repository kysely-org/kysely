import { DynamicReferenceBuilder } from '../dynamic/dynamic-reference-builder.js'
import {
  ExpressionBuilder,
  expressionBuilder,
} from '../expression/expression-builder.js'
import { ExpressionWrapper } from '../expression/expression-wrapper.js'
import { AliasedExpression } from '../expression/expression.js'
import { InsertQueryNode } from '../operation-node/insert-query-node.js'
import { MatchedNode } from '../operation-node/matched-node.js'
import {
  OperationNodeSource,
  isOperationNodeSource,
} from '../operation-node/operation-node-source.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { RawNode } from '../operation-node/raw-node.js'
import { SelectionNode } from '../operation-node/selection-node.js'
import { WhenNode } from '../operation-node/when-node.js'
import { isString } from '../util/object-utils.js'
import {
  AnyAliasedColumn,
  AnyAliasedColumnWithTable,
  AnyColumn,
  AnyColumnWithTable,
} from '../util/type-utils.js'
import {
  parseFilterList,
  parseReferentialBinaryOperation,
  parseValueBinaryOperationOrExpression,
} from './binary-operation-parser.js'
import { parseSelectArg, SelectArg, SelectExpression } from './select-parser.js'

export type MergeAction = 'INSERT' | 'UPDATE' | 'DELETE'

export type MergeReturningExpression<DB, TB extends keyof DB> =
  | AnyAliasedColumnWithTable<DB, TB>
  | AnyAliasedColumn<DB, TB>
  | AnyColumnWithTable<DB, TB>
  | AnyColumn<DB, TB>
  | DynamicReferenceBuilder<any>
  | AliasedExpression<any, any>
  | ((
      eb: MergeReturningExpressionBuilder<DB, TB>,
    ) => AliasedExpression<any, any>)

export type MergeReturningCallback<DB, TB extends keyof DB> = (
  eb: MergeReturningExpressionBuilder<DB, TB>,
) => ReadonlyArray<MergeReturningExpression<DB, TB>>

export type MergeReturningExpressionBuilder<
  DB,
  TB extends keyof DB,
> = ExpressionBuilder<DB, TB> & {
  mergeAction(): ExpressionWrapper<DB, TB, MergeAction>
}

export function parseMergeReturningArg(
  returning: SelectArg<any, any, SelectExpression<any, any>>,
): SelectionNode[] {
  return parseSelectArg(returning, mergeReturningExpressionBuilder)
}

function mergeReturningExpressionBuilder() {
  const eb = expressionBuilder() as MergeReturningExpressionBuilder<any, any>
  eb.mergeAction = () => eb.fn('merge_action', [])
  return eb
}

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
