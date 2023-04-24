import { ExtractTypeFromReferenceExpression } from './reference-parser.js'

export type JSONPathOperandExpression<
  DB,
  TB extends keyof DB,
  RE
> = Array<any> extends ExtractTypeFromReferenceExpression<DB, TB, RE>
  ? number
  : ExtractTypeFromReferenceExpression<DB, TB, RE> & {} extends object
  ? keyof NonNullable<ExtractTypeFromReferenceExpression<DB, TB, RE>>
  : never

export type ExtractTypeFromJSONOperation<
  DB,
  TB extends keyof DB,
  RE,
  OP,
  JP
> = OP extends '->>'
  ? unknown
  : undefined extends ExtractTypeFromReferenceExpression<DB, TB, RE>
  ?
      | null
      | (JP extends keyof NonNullable<
          ExtractTypeFromReferenceExpression<DB, TB, RE>
        >
          ? NonNullable<
              NonNullable<ExtractTypeFromReferenceExpression<DB, TB, RE>>[JP]
            >
          : never)
  : null extends ExtractTypeFromReferenceExpression<DB, TB, RE>
  ?
      | null
      | (JP extends keyof NonNullable<
          ExtractTypeFromReferenceExpression<DB, TB, RE>
        >
          ? NonNullable<
              NonNullable<ExtractTypeFromReferenceExpression<DB, TB, RE>>[JP]
            >
          : never)
  : JP extends keyof ExtractTypeFromReferenceExpression<DB, TB, RE>
  ? undefined extends ExtractTypeFromReferenceExpression<DB, TB, RE>[JP]
    ? null | NonNullable<ExtractTypeFromReferenceExpression<DB, TB, RE>[JP]>
    : ExtractTypeFromReferenceExpression<DB, TB, RE>[JP]
  : null
