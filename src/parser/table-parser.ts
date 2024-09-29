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
import { DrainOuterGeneric, ShallowRecord } from '../util/type-utils.js'

export type TableExpression<DB, TB extends keyof DB> =
  | AnyAliasedTable<DB>
  | AnyTable<DB>
  | AliasedExpressionOrFactory<DB, TB>

export type TableExpressionOrList<DB, TB extends keyof DB> =
  | TableExpression<DB, TB>
  | ReadonlyArray<TableExpression<DB, TB>>

export type TableReference<DB> =
  | SimpleTableReference<DB>
  | AliasedExpression<any, any>

export type SimpleTableReference<DB> = AnyAliasedTable<DB> | AnyTable<DB>

export type AnyAliasedTable<DB> = `${AnyTable<DB>} as ${string}`

export type TableReferenceOrList<DB> =
  | TableReference<DB>
  | ReadonlyArray<TableReference<DB>>

export type From<DB, TE> = DrainOuterGeneric<{
  [C in
    | keyof DB
    | ExtractAliasFromTableExpression<
        DB,
        TE
      >]: C extends ExtractAliasFromTableExpression<DB, TE>
    ? ExtractRowTypeFromTableExpression<DB, TE, C>
    : C extends keyof DB
      ? DB[C]
      : never
}>

export type FromTables<DB, TB extends keyof DB, TE> = DrainOuterGeneric<
  TB | ExtractAliasFromTableExpression<DB, TE>
>

export type ExtractTableAlias<DB, TE> = TE extends `${string} as ${infer TA}`
  ? TA extends keyof DB
    ? TA
    : never
  : TE extends keyof DB
    ? TE
    : never

export type PickTableWithAlias<
  DB,
  T extends AnyAliasedTable<DB>,
> = T extends `${infer TB} as ${infer A}`
  ? TB extends keyof DB
    ? ShallowRecord<A, DB[TB]>
    : never
  : never

type ExtractAliasFromTableExpression<DB, TE> = TE extends string
  ? TE extends `${string} as ${infer TA}`
    ? TA
    : TE extends keyof DB
      ? TE
      : never
  : TE extends AliasedExpression<any, infer QA>
    ? QA
    : TE extends (qb: any) => AliasedExpression<any, infer QA>
      ? QA
      : never

type ExtractRowTypeFromTableExpression<
  DB,
  TE,
  A extends keyof any,
> = TE extends `${infer T} as ${infer TA}`
  ? TA extends A
    ? T extends keyof DB
      ? DB[T]
      : never
    : never
  : TE extends A
    ? TE extends keyof DB
      ? DB[TE]
      : never
    : TE extends AliasedExpression<infer O, infer QA>
      ? QA extends A
        ? O
        : never
      : TE extends (qb: any) => AliasedExpression<infer O, infer QA>
        ? QA extends A
          ? O
          : never
        : never

type AnyTable<DB> = keyof DB & string

export function parseTableExpressionOrList(
  table: TableExpressionOrList<any, any>,
): OperationNode[] {
  if (isReadonlyArray(table)) {
    return table.map((it) => parseTableExpression(it))
  } else {
    return [parseTableExpression(table)]
  }
}

export function parseTableExpression(
  table: TableExpression<any, any>,
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
