import { DrainOuterGeneric } from '../util/type-utils.js'
import { ExtractTypeFromReferenceExpression } from './reference-parser.js'
import { ExtractTypeFromValueExpression } from './value-parser.js'

export type RefTuple2<DB, TB extends keyof DB, R1, R2> = DrainOuterGeneric<
  [
    ExtractTypeFromReferenceExpression<DB, TB, R1>,
    ExtractTypeFromReferenceExpression<DB, TB, R2>,
  ]
>

export type RefTuple3<DB, TB extends keyof DB, R1, R2, R3> = DrainOuterGeneric<
  [
    ExtractTypeFromReferenceExpression<DB, TB, R1>,
    ExtractTypeFromReferenceExpression<DB, TB, R2>,
    ExtractTypeFromReferenceExpression<DB, TB, R3>,
  ]
>

export type RefTuple4<
  DB,
  TB extends keyof DB,
  R1,
  R2,
  R3,
  R4,
> = DrainOuterGeneric<
  [
    ExtractTypeFromReferenceExpression<DB, TB, R1>,
    ExtractTypeFromReferenceExpression<DB, TB, R2>,
    ExtractTypeFromReferenceExpression<DB, TB, R3>,
    ExtractTypeFromReferenceExpression<DB, TB, R4>,
  ]
>

export type RefTuple5<
  DB,
  TB extends keyof DB,
  R1,
  R2,
  R3,
  R4,
  R5,
> = DrainOuterGeneric<
  [
    ExtractTypeFromReferenceExpression<DB, TB, R1>,
    ExtractTypeFromReferenceExpression<DB, TB, R2>,
    ExtractTypeFromReferenceExpression<DB, TB, R3>,
    ExtractTypeFromReferenceExpression<DB, TB, R4>,
    ExtractTypeFromReferenceExpression<DB, TB, R5>,
  ]
>

export type RefTuple6<
  DB,
  TB extends keyof DB,
  R1,
  R2,
  R3,
  R4,
  R5,
  R6,
> = DrainOuterGeneric<
  [
    ExtractTypeFromReferenceExpression<DB, TB, R1>,
    ExtractTypeFromReferenceExpression<DB, TB, R2>,
    ExtractTypeFromReferenceExpression<DB, TB, R3>,
    ExtractTypeFromReferenceExpression<DB, TB, R4>,
    ExtractTypeFromReferenceExpression<DB, TB, R5>,
    ExtractTypeFromReferenceExpression<DB, TB, R6>,
  ]
>

export type RefTuple7<
  DB,
  TB extends keyof DB,
  R1,
  R2,
  R3,
  R4,
  R5,
  R6,
  R7,
> = DrainOuterGeneric<
  [
    ExtractTypeFromReferenceExpression<DB, TB, R1>,
    ExtractTypeFromReferenceExpression<DB, TB, R2>,
    ExtractTypeFromReferenceExpression<DB, TB, R3>,
    ExtractTypeFromReferenceExpression<DB, TB, R4>,
    ExtractTypeFromReferenceExpression<DB, TB, R5>,
    ExtractTypeFromReferenceExpression<DB, TB, R6>,
    ExtractTypeFromReferenceExpression<DB, TB, R7>,
  ]
>

export type RefTuple8<
  DB,
  TB extends keyof DB,
  R1,
  R2,
  R3,
  R4,
  R5,
  R6,
  R7,
  R8,
> = DrainOuterGeneric<
  [
    ExtractTypeFromReferenceExpression<DB, TB, R1>,
    ExtractTypeFromReferenceExpression<DB, TB, R2>,
    ExtractTypeFromReferenceExpression<DB, TB, R3>,
    ExtractTypeFromReferenceExpression<DB, TB, R4>,
    ExtractTypeFromReferenceExpression<DB, TB, R5>,
    ExtractTypeFromReferenceExpression<DB, TB, R6>,
    ExtractTypeFromReferenceExpression<DB, TB, R7>,
    ExtractTypeFromReferenceExpression<DB, TB, R8>,
  ]
>

export type ValTuple2<V1, V2> = DrainOuterGeneric<
  [ExtractTypeFromValueExpression<V1>, ExtractTypeFromValueExpression<V2>]
>

export type ValTuple3<V1, V2, V3> = DrainOuterGeneric<
  [
    ExtractTypeFromValueExpression<V1>,
    ExtractTypeFromValueExpression<V2>,
    ExtractTypeFromValueExpression<V3>,
  ]
>

export type ValTuple4<V1, V2, V3, V4> = DrainOuterGeneric<
  [
    ExtractTypeFromValueExpression<V1>,
    ExtractTypeFromValueExpression<V2>,
    ExtractTypeFromValueExpression<V3>,
    ExtractTypeFromValueExpression<V4>,
  ]
>

export type ValTuple5<V1, V2, V3, V4, V5> = DrainOuterGeneric<
  [
    ExtractTypeFromValueExpression<V1>,
    ExtractTypeFromValueExpression<V2>,
    ExtractTypeFromValueExpression<V3>,
    ExtractTypeFromValueExpression<V4>,
    ExtractTypeFromValueExpression<V5>,
  ]
>

export type ValTuple6<V1, V2, V3, V4, V5, V6> = DrainOuterGeneric<
  [
    ExtractTypeFromValueExpression<V1>,
    ExtractTypeFromValueExpression<V2>,
    ExtractTypeFromValueExpression<V3>,
    ExtractTypeFromValueExpression<V4>,
    ExtractTypeFromValueExpression<V5>,
    ExtractTypeFromValueExpression<V6>,
  ]
>

export type ValTuple7<V1, V2, V3, V4, V5, V6, V7> = DrainOuterGeneric<
  [
    ExtractTypeFromValueExpression<V1>,
    ExtractTypeFromValueExpression<V2>,
    ExtractTypeFromValueExpression<V3>,
    ExtractTypeFromValueExpression<V4>,
    ExtractTypeFromValueExpression<V5>,
    ExtractTypeFromValueExpression<V6>,
    ExtractTypeFromValueExpression<V7>,
  ]
>

export type ValTuple8<V1, V2, V3, V4, V5, V6, V7, V8> = DrainOuterGeneric<
  [
    ExtractTypeFromValueExpression<V1>,
    ExtractTypeFromValueExpression<V2>,
    ExtractTypeFromValueExpression<V3>,
    ExtractTypeFromValueExpression<V4>,
    ExtractTypeFromValueExpression<V5>,
    ExtractTypeFromValueExpression<V6>,
    ExtractTypeFromValueExpression<V7>,
    ExtractTypeFromValueExpression<V8>,
  ]
>
