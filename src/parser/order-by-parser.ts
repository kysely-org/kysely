import { ReferenceExpression } from './reference-parser'

export type OrderByExpression<DB, TB extends keyof DB, O> =
  | ReferenceExpression<DB, TB>
  | keyof O
