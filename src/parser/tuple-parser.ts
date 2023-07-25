import { ExtractTypeFromReferenceExpression } from './reference-parser.js'
import { ExtractTypeFromValueExpression } from './value-parser.js'

export type RefTuple2<DB, TB extends keyof DB, R1, R2> = [R1] extends [unknown]
  ? [
      ExtractTypeFromReferenceExpression<DB, TB, R1>,
      ExtractTypeFromReferenceExpression<DB, TB, R2>
    ]
  : never

export type RefTuple3<DB, TB extends keyof DB, R1, R2, R3> = [R1] extends [
  unknown
]
  ? [
      ExtractTypeFromReferenceExpression<DB, TB, R1>,
      ExtractTypeFromReferenceExpression<DB, TB, R2>,
      ExtractTypeFromReferenceExpression<DB, TB, R3>
    ]
  : never

export type RefTuple4<DB, TB extends keyof DB, R1, R2, R3, R4> = [R1] extends [
  unknown
]
  ? [
      ExtractTypeFromReferenceExpression<DB, TB, R1>,
      ExtractTypeFromReferenceExpression<DB, TB, R2>,
      ExtractTypeFromReferenceExpression<DB, TB, R3>,
      ExtractTypeFromReferenceExpression<DB, TB, R4>
    ]
  : never

export type RefTuple5<DB, TB extends keyof DB, R1, R2, R3, R4, R5> = [
  R1
] extends [unknown]
  ? [
      ExtractTypeFromReferenceExpression<DB, TB, R1>,
      ExtractTypeFromReferenceExpression<DB, TB, R2>,
      ExtractTypeFromReferenceExpression<DB, TB, R3>,
      ExtractTypeFromReferenceExpression<DB, TB, R4>,
      ExtractTypeFromReferenceExpression<DB, TB, R5>
    ]
  : never

export type ValTuple2<V1, V2> = [V1] extends [unknown]
  ? [ExtractTypeFromValueExpression<V1>, ExtractTypeFromValueExpression<V2>]
  : never

export type ValTuple3<V1, V2, V3> = V1 extends any
  ? [
      ExtractTypeFromValueExpression<V1>,
      ExtractTypeFromValueExpression<V2>,
      ExtractTypeFromValueExpression<V3>
    ]
  : never

export type ValTuple4<V1, V2, V3, V4> = [V1] extends [unknown]
  ? [
      ExtractTypeFromValueExpression<V1>,
      ExtractTypeFromValueExpression<V2>,
      ExtractTypeFromValueExpression<V3>,
      ExtractTypeFromValueExpression<V4>
    ]
  : never

export type ValTuple5<V1, V2, V3, V4, V5> = [V1] extends [unknown]
  ? [
      ExtractTypeFromValueExpression<V1>,
      ExtractTypeFromValueExpression<V2>,
      ExtractTypeFromValueExpression<V3>,
      ExtractTypeFromValueExpression<V4>,
      ExtractTypeFromValueExpression<V5>
    ]
  : never
