import { ExtractTypeFromReferenceExpression } from './reference-parser.js'

export type JSONPathOperandExpression<
  DB,
  TB extends keyof DB,
  RE
> = ExtractTypeFromReferenceExpression<DB, TB, RE> extends Array<any>
  ? number
  : ExtractTypeFromReferenceExpression<DB, TB, RE> extends object
  ? keyof Exclude<
      ExtractTypeFromReferenceExpression<DB, TB, RE>,
      null | undefined
    >
  : never

export type ExtractTypeFromJSONOperation<
  DB,
  TB extends keyof DB,
  RE,
  OP,
  JP extends keyof ExtractTypeFromReferenceExpression<DB, TB, RE>
> = OP extends '->>'
  ? unknown
  : undefined extends ExtractTypeFromReferenceExpression<DB, TB, RE>
  ? null | Exclude<
      Exclude<
        ExtractTypeFromReferenceExpression<DB, TB, RE>,
        null | undefined
      >[JP],
      undefined
    >
  : null extends ExtractTypeFromReferenceExpression<DB, TB, RE>
  ? null | Exclude<
      Exclude<ExtractTypeFromReferenceExpression<DB, TB, RE>, null>[JP],
      undefined
    >
  : undefined extends ExtractTypeFromReferenceExpression<DB, TB, RE>[JP]
  ? null | Exclude<
      ExtractTypeFromReferenceExpression<DB, TB, RE>[JP],
      undefined
    >
  : ExtractTypeFromReferenceExpression<DB, TB, RE>[JP]
