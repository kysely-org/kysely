import { BinaryOperationNode } from '../operation-node/binary-operation-node.js'
import {
  isBoolean,
  isNull,
  isString,
  isUndefined,
} from '../util/object-utils.js'
import {
  OperationNodeSource,
  isOperationNodeSource,
} from '../operation-node/operation-node-source.js'
import {
  OperatorNode,
  ComparisonOperator,
  BinaryOperator,
  Operator,
  OPERATORS,
} from '../operation-node/operator-node.js'
import {
  ExtractTypeFromReferenceExpression,
  ExtractTypeFromStringReference,
  parseReferenceExpression,
  ReferenceExpression,
  StringReference,
} from './reference-parser.js'
import {
  parseValueExpression,
  parseValueExpressionOrList,
  ValueExpression,
  ValueExpressionOrList,
} from './value-parser.js'
import { ValueNode } from '../operation-node/value-node.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { Expression } from '../expression/expression.js'
import { SelectType } from '../util/column-type.js'
import { AndNode } from '../operation-node/and-node.js'
import { ParensNode } from '../operation-node/parens-node.js'
import { OrNode } from '../operation-node/or-node.js'

export type OperandValueExpression<
  DB,
  TB extends keyof DB,
  RE
> = ValueExpression<DB, TB, ExtractTypeFromReferenceExpression<DB, TB, RE>>

export type OperandValueExpressionOrList<
  DB,
  TB extends keyof DB,
  RE
> = ValueExpressionOrList<
  DB,
  TB,
  ExtractTypeFromReferenceExpression<DB, TB, RE> | null
>

export type OperatorExpression = Operator | Expression<unknown>
export type BinaryOperatorExpression = BinaryOperator | Expression<unknown>

export type ComparisonOperatorExpression =
  | ComparisonOperator
  | Expression<unknown>

export type FilterObject<DB, TB extends keyof DB> = {
  [R in StringReference<DB, TB>]?: ValueExpressionOrList<
    DB,
    TB,
    SelectType<ExtractTypeFromStringReference<DB, TB, R>>
  >
}

export function parseValueBinaryOperationOrExpression(
  args: any[]
): OperationNode {
  if (args.length === 3) {
    return parseValueBinaryOperation(args[0], args[1], args[2])
  } else if (args.length === 1) {
    return parseValueExpression(args[0])
  }

  throw new Error(`invalid arguments: ${JSON.stringify(args)}`)
}

export function parseValueBinaryOperation(
  left: ReferenceExpression<any, any>,
  operator: BinaryOperatorExpression,
  right: OperandValueExpressionOrList<any, any, any>
): BinaryOperationNode {
  if (isIsOperator(operator) && needsIsOperator(right)) {
    return BinaryOperationNode.create(
      parseReferenceExpression(left),
      parseOperator(operator),
      ValueNode.createImmediate(right)
    )
  }

  return BinaryOperationNode.create(
    parseReferenceExpression(left),
    parseOperator(operator),
    parseValueExpressionOrList(right)
  )
}

export function parseReferentialBinaryOperation(
  left: ReferenceExpression<any, any>,
  operator: BinaryOperatorExpression,
  right: OperandValueExpressionOrList<any, any, any>
): BinaryOperationNode {
  return BinaryOperationNode.create(
    parseReferenceExpression(left),
    parseOperator(operator),
    parseReferenceExpression(right)
  )
}

export function parseFilterObject(
  obj: Readonly<FilterObject<any, any>>,
  combinator: 'and' | 'or'
): OperationNode {
  return parseFilterList(
    Object.entries(obj)
      .filter(([, v]) => !isUndefined(v))
      .map(([k, v]) =>
        parseValueBinaryOperation(k, needsIsOperator(v) ? 'is' : '=', v)
      ),
    combinator
  )
}

export function parseFilterList(
  list: ReadonlyArray<OperationNodeSource | OperationNode>,
  combinator: 'and' | 'or'
): OperationNode {
  const combine = combinator === 'and' ? AndNode.create : OrNode.create

  if (list.length === 0) {
    return BinaryOperationNode.create(
      ValueNode.createImmediate(1),
      OperatorNode.create('='),
      ValueNode.createImmediate(combinator === 'and' ? 1 : 0)
    )
  }

  let node = toOperationNode(list[0])

  for (let i = 1; i < list.length; ++i) {
    node = combine(node, toOperationNode(list[i]))
  }

  if (list.length > 1) {
    return ParensNode.create(node)
  }

  return node
}

function isIsOperator(
  operator: BinaryOperatorExpression
): operator is 'is' | 'is not' {
  return operator === 'is' || operator === 'is not'
}

function needsIsOperator(value: unknown): value is null | boolean {
  return isNull(value) || isBoolean(value)
}

function parseOperator(operator: OperatorExpression): OperationNode {
  if (isString(operator) && OPERATORS.includes(operator)) {
    return OperatorNode.create(operator)
  }

  if (isOperationNodeSource(operator)) {
    return operator.toOperationNode()
  }

  throw new Error(`invalid operator ${JSON.stringify(operator)}`)
}

function toOperationNode(
  nodeOrSource: OperationNode | OperationNodeSource
): OperationNode {
  return isOperationNodeSource(nodeOrSource)
    ? nodeOrSource.toOperationNode()
    : nodeOrSource
}
