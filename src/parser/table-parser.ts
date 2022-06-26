import { AliasedQueryBuilder } from '../query-builder/select-query-builder.js'
import { isReadonlyArray, isString } from '../util/object-utils.js'
import { AliasNode } from '../operation-node/alias-node.js'
import { TableNode } from '../operation-node/table-node.js'
import { AnyAliasedRawBuilder } from '../util/type-utils.js'
import { AliasedRawBuilder } from '../raw-builder/raw-builder.js'
import { TableExpressionNode } from '../operation-node/operation-node-utils.js'
import {
  AliasedComplexExpression,
  parseAliasedComplexExpression,
} from './complex-expression-parser.js'
import { IdentifierNode } from '../operation-node/identifier-node.js'

export type TableExpression<DB, TB extends keyof DB> =
  | TableReference<DB>
  | AliasedComplexExpression<DB, TB>

export type TableExpressionOrList<DB, TB extends keyof DB> =
  | TableExpression<DB, TB>
  | ReadonlyArray<TableExpression<DB, TB>>

export type TableReference<DB> =
  | AnyAliasedTable<DB>
  | AnyTable<DB>
  | AnyAliasedRawBuilder

export type From<DB, TE> = {
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
}

export type FromTables<DB, TB extends keyof DB, TE> =
  | TB
  | ExtractAliasFromTableExpression<DB, TE>

type ExtractAliasFromTableExpression<DB, TE> =
  TE extends `${string} as ${infer TA}`
    ? TA
    : TE extends keyof DB
    ? TE
    : TE extends AliasedQueryBuilder<any, any, any, infer QA>
    ? QA
    : TE extends (qb: any) => AliasedQueryBuilder<any, any, any, infer QA>
    ? QA
    : TE extends AliasedRawBuilder<any, infer RA>
    ? RA
    : TE extends (qb: any) => AliasedRawBuilder<any, infer RA>
    ? RA
    : never

type ExtractRowTypeFromTableExpression<
  DB,
  TE,
  A extends keyof any
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
  : TE extends AliasedQueryBuilder<any, any, infer O, infer QA>
  ? QA extends A
    ? O
    : never
  : TE extends (qb: any) => AliasedQueryBuilder<any, any, infer O, infer QA>
  ? QA extends A
    ? O
    : never
  : TE extends AliasedRawBuilder<infer O, infer RA>
  ? RA extends A
    ? O
    : never
  : TE extends (qb: any) => AliasedRawBuilder<infer O, infer RA>
  ? RA extends A
    ? O
    : never
  : never

type AnyAliasedTable<DB> = `${AnyTable<DB>} as ${string}`
type AnyTable<DB> = keyof DB & string

export function parseTableExpressionOrList(
  table: TableExpressionOrList<any, any>
): TableExpressionNode[] {
  if (isReadonlyArray(table)) {
    return table.map((it) => parseTableExpression(it))
  } else {
    return [parseTableExpression(table)]
  }
}

export function parseTableExpression(
  table: TableExpression<any, any>
): TableExpressionNode {
  if (isString(table)) {
    return parseAliasedTable(table)
  } else {
    return parseAliasedComplexExpression(table)
  }
}

export function parseAliasedTable(from: string): TableExpressionNode {
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
