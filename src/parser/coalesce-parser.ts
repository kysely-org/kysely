import { TableNames } from '../util/type-utils.js'
import {
  ExtractTypeFromReferenceExpression,
  ReferenceExpression,
} from './reference-parser.js'

export type CoalesceReferenceExpressionList<
  DB extends TB,
  TB extends TableNames,
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
