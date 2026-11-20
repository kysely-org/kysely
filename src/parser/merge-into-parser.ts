import type { MergeQueryBuilder } from '../query-builder/merge-query-builder.js'
import type { MergeResult } from '../query-builder/merge-result.js'
import type {
  ExtractTableAlias,
  ShadowTableWith,
  SimpleTableReference,
} from './table-parser.js'

export type MergeInto<DB, TE extends SimpleTableReference<DB>> = [TE] extends [
  keyof DB,
]
  ? MergeQueryBuilder<DB, ExtractTableAlias<DB, TE>, MergeResult>
  : [TE] extends [`${infer T} as ${infer A}`]
    ? T extends keyof DB
      ? MergeQueryBuilder<ShadowTableWith<DB, A, DB[T]>, A, MergeResult>
      : never
    : never
