import { ExtractTypeFromReferenceExpression } from './reference-parser.js'

export type ExtractTypeFromCoalesce1<
  DB,
  TB extends keyof DB,
  R1
> = ExtractTypeFromReferenceExpression<DB, TB, R1>

export type ExtractTypeFromCoalesce2<
  DB,
  TB extends keyof DB,
  R1,
  R2
> = ExtractTypeFromCoalesceValues2<
  ExtractTypeFromReferenceExpression<DB, TB, R1>,
  ExtractTypeFromReferenceExpression<DB, TB, R2>
>

type ExtractTypeFromCoalesceValues2<V1, V2> = null extends V1
  ? null extends V2
    ? V1 | V2
    : NotNull<V1 | V2>
  : NotNull<V1>

export type ExtractTypeFromCoalesce3<
  DB,
  TB extends keyof DB,
  R1,
  R2,
  R3
> = ExtractTypeFromCoalesceValues3<
  ExtractTypeFromReferenceExpression<DB, TB, R1>,
  ExtractTypeFromReferenceExpression<DB, TB, R2>,
  ExtractTypeFromReferenceExpression<DB, TB, R3>
>

type ExtractTypeFromCoalesceValues3<V1, V2, V3> = null extends V1
  ? null extends V2
    ? null extends V3
      ? V1 | V2 | V3
      : NotNull<V1 | V2 | V3>
    : NotNull<V1 | V2>
  : NotNull<V1>

export type ExtractTypeFromCoalesce4<
  DB,
  TB extends keyof DB,
  R1,
  R2,
  R3,
  R4
> = ExtractTypeFromCoalesceValues4<
  ExtractTypeFromReferenceExpression<DB, TB, R1>,
  ExtractTypeFromReferenceExpression<DB, TB, R2>,
  ExtractTypeFromReferenceExpression<DB, TB, R3>,
  ExtractTypeFromReferenceExpression<DB, TB, R4>
>

type ExtractTypeFromCoalesceValues4<V1, V2, V3, V4> = null extends V1
  ? null extends V2
    ? null extends V3
      ? null extends V4
        ? V1 | V2 | V3 | V4
        : NotNull<V1 | V2 | V3 | V4>
      : NotNull<V1 | V2 | V3>
    : NotNull<V1 | V2>
  : NotNull<V1>

export type ExtractTypeFromCoalesce5<
  DB,
  TB extends keyof DB,
  R1,
  R2,
  R3,
  R4,
  R5
> = ExtractTypeFromCoalesceValues5<
  ExtractTypeFromReferenceExpression<DB, TB, R1>,
  ExtractTypeFromReferenceExpression<DB, TB, R2>,
  ExtractTypeFromReferenceExpression<DB, TB, R3>,
  ExtractTypeFromReferenceExpression<DB, TB, R4>,
  ExtractTypeFromReferenceExpression<DB, TB, R5>
>

type ExtractTypeFromCoalesceValues5<V1, V2, V3, V4, V5> = null extends V1
  ? null extends V2
    ? null extends V3
      ? null extends V4
        ? null extends V5
          ? V1 | V2 | V3 | V4 | V5
          : NotNull<V1 | V2 | V3 | V4 | V5>
        : NotNull<V1 | V2 | V3 | V4>
      : NotNull<V1 | V2 | V3>
    : NotNull<V1 | V2>
  : NotNull<V1>

type NotNull<T> = Exclude<T, null>
