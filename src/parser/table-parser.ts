import { isReadonlyArray, isString } from '../util/object-utils.js'
import { AliasNode } from '../operation-node/alias-node.js'
import { TableNode } from '../operation-node/table-node.js'
import {
  AliasedExpressionOrFactory,
  parseAliasedExpression,
} from './expression-parser.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'
import { OperationNode } from '../operation-node/operation-node.js'
import { AliasedExpression } from '../expression/expression.js'
import { DrainOuterGeneric, TableNames } from '../util/type-utils.js'

export type TableExpression<DB extends TB, TB extends TableNames> =
  | AnyAliasedTable<DB>
  | AnyTable<DB>
  | AliasedExpressionOrFactory<DB, TB>

export type TableExpressionOrList<DB extends TB, TB extends TableNames> =
  | TableExpression<DB, TB>
  | ReadonlyArray<TableExpression<DB, TB>>

export type TableReference<DB> =
  | AnyAliasedTable<DB>
  | AnyTable<DB>
  | AliasedExpression<any, any>

export type AnyAliasedTable<DB> = `${AnyTable<DB>} as ${string}`

export type TableReferenceOrList<DB> =
  | TableReference<DB>
  | ReadonlyArray<TableReference<DB>>

// Given a database type and a `TableExpression` TE, creates a new DB type
// that contains `DB` and the new names in `TE`. If any of the names in TE
// collide with the existing table names in DB, types from TE take precedence.
export type From<DB, TE> = DrainOuterGeneric<{
  [T in
    | keyof DB
    | ExtractNameUnionFromTableExpression<
        DB,
        TE
      >]: T extends ExtractNameUnionFromTableExpression<DB, TE>
    ? ExtractRowTypeFromTableExpression<DB, TE, T>
    : T extends keyof DB
    ? DB[T]
    : never
}>

export type FromTables<
  DB extends TB,
  TB extends TableNames,
  TE
> = DrainOuterGeneric<{
  [T in keyof TB | ExtractNameUnionFromTableExpression<DB, TE>]: unknown
}>

export type ExtractNamesFromTableExpression<DB, TE> = DrainOuterGeneric<{
  [T in ExtractNameUnionFromTableExpression<DB, TE>]: unknown
}>

export type MergeNamesFromTableExpression<
  DB extends TB,
  TB extends TableNames,
  TE
> = DrainOuterGeneric<{
  [T in keyof TB | ExtractNameUnionFromTableExpression<DB, TE>]: unknown
}>

export type PickTableWithAlias<
  DB,
  T extends AnyAliasedTable<DB>
> = T extends `${infer TB} as ${infer A}`
  ? TB extends keyof DB
    ? Record<A, DB[TB]>
    : never
  : never

export type ExtractNameUnionFromTableExpression<DB, TE> =
  TE extends `${string} as ${infer TA}`
    ? TA
    : TE extends keyof DB
    ? TE
    : TE extends AliasedExpression<any, infer QA>
    ? QA
    : TE extends (qb: any) => AliasedExpression<any, infer QA>
    ? QA
    : never

type ExtractRowTypeFromTableExpression<
  DB,
  TE,
  N extends keyof any
> = TE extends `${infer T} as ${infer TA}`
  ? TA extends N
    ? T extends keyof DB
      ? DB[T]
      : never
    : never
  : TE extends N
  ? TE extends keyof DB
    ? DB[TE]
    : never
  : TE extends AliasedExpression<infer O, infer QA>
  ? QA extends N
    ? O
    : never
  : TE extends (qb: any) => AliasedExpression<infer O, infer QA>
  ? QA extends N
    ? O
    : never
  : never

type AnyTable<DB> = keyof DB & string

export function parseTableExpressionOrList(
  table: TableExpressionOrList<any, any>
): OperationNode[] {
  if (isReadonlyArray(table)) {
    return table.map((it) => parseTableExpression(it))
  } else {
    return [parseTableExpression(table)]
  }
}

export function parseTableExpression(
  table: TableExpression<any, any>
): OperationNode {
  if (isString(table)) {
    return parseAliasedTable(table)
  } else {
    return parseAliasedExpression(table)
  }
}

export function parseAliasedTable(from: string): TableNode | AliasNode {
  const ALIAS_SEPARATOR = ' as '

  if (from.includes(ALIAS_SEPARATOR)) {
    const [table, alias] = from.split(ALIAS_SEPARATOR).map(trim)

    return AliasNode.create(parseTable(table), IdentifierNode.create(alias))
  } else {
    return parseTable(from)
  }
}

export function parseTable(from: string): TableNode {
  const SCHEMA_SEPARATOR = '.'

  if (from.includes(SCHEMA_SEPARATOR)) {
    const [schema, table] = from.split(SCHEMA_SEPARATOR).map(trim)

    return TableNode.createWithSchema(schema, table)
  } else {
    return TableNode.create(from)
  }
}

function trim(str: string): string {
  return str.trim()
}
