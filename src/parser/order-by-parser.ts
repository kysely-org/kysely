import { ReferenceExpression } from './reference-parser.js'

export type OrderByExpression<DB, TB extends keyof DB, O> =
  | ReferenceExpression<DB, TB>
  | keyof O
