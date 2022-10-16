import { RawNode } from '../operation-node/raw-node.js'
import {
  ExtractTypeFromReferenceExpression,
  parseReferenceExpressionOrList,
  ReferenceExpression,
} from './reference-parser.js'

export type CoalesceReferenceExpressionList<
  DB,
  TB extends keyof DB,
  RE extends unknown[],
  O = never
> = RE extends []
  ? O
  : RE extends [infer L, ...infer R]
  ? L extends ReferenceExpression<any, any>
    ? null extends ExtractTypeFromReferenceExpression<DB, TB, L>
      ? CoalesceReferenceExpressionList<
          DB,
          TB,
          R extends ReferenceExpression<any, any>[] ? R : never,
          O | ExtractTypeFromReferenceExpression<DB, TB, L>
        >
      : Exclude<O, null> | ExtractTypeFromReferenceExpression<DB, TB, L>
    : never
  : never

export function parseCoalesce(
  values: ReferenceExpression<any, any>[]
): RawNode {
  return RawNode.create(
    values.length > 1
      ? ['coalesce(', ...new Array(values.length - 1).fill(', '), ')']
      : ['coalesce(', ')'],
    parseReferenceExpressionOrList(values)
  )
}
