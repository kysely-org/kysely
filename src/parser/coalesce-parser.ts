import {
  ExtractTypeFromReferenceExpression,
  ReferenceExpression,
} from './reference-parser.js'

export type Coalesce<
  DB,
  TB extends keyof DB,
  Arr extends unknown[],
  Accumulator = never
> = Arr extends []
  ? Accumulator
  : Arr extends [infer L, ...infer R]
  ? L extends ReferenceExpression<any, any>
    ? null extends ExtractTypeFromReferenceExpression<DB, TB, L>
      ? Coalesce<
          DB,
          TB,
          R extends ReferenceExpression<any, any>[] ? R : never,
          Accumulator | ExtractTypeFromReferenceExpression<DB, TB, L>
        >
      :
          | Exclude<Accumulator, null>
          | ExtractTypeFromReferenceExpression<DB, TB, L>
    : null extends L
    ? Coalesce<
        DB,
        TB,
        R extends ReferenceExpression<any, any>[] ? R : never,
        Accumulator | L
      >
    : Exclude<Accumulator, null> | L
  : never
