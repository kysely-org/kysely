import {
  AliasedQueryBuilder,
  QueryBuilder,
} from '../query-builder/query-builder.js'
import { isFunction, isReadonlyArray, isString } from '../util/object-utils.js'
import { AliasNode } from '../operation-node/alias-node.js'
import { TableNode } from '../operation-node/table-node.js'
import {
  AliasedQueryBuilderFactory,
  AnyAliasedQueryBuilder,
  AnyAliasedRawBuilder,
} from '../util/type-utils.js'
import { isOperationNodeSource } from '../operation-node/operation-node-source.js'
import { AliasedRawBuilder } from '../raw-builder/raw-builder.js'
import { TableExpressionNode } from '../operation-node/operation-node-utils.js'
import { ParseContext } from './parse-context.js'

export type TableExpression<DB, TB extends keyof DB> =
  | TableReference<DB>
  | AnyAliasedQueryBuilder
  | AliasedQueryBuilderFactory<DB, TB>

export type TableExpressionOrList<DB, TB extends keyof DB> =
  | TableExpression<DB, TB>
  | ReadonlyArray<TableExpression<DB, TB>>

export type TableReference<DB> =
  | AnyAliasedTable<DB, any, any>
  | AnyTable<DB>
  | AnyAliasedRawBuilder

export type QueryBuilderWithTable<
  DB,
  TB extends keyof DB,
  O,
  TE
> = QueryBuilder<
  TableExpressionDatabaseType<DB, TE>,
  TB | ExtractAliasFromTableExpression<DB, TE>,
  O
>

export type TableExpressionDatabaseType<DB, TE> =
  DB extends ExtractDatabaseTypeFromTableExpression<DB, TE>
    ? DB
    : DB & ExtractDatabaseTypeFromTableExpression<DB, TE>

export type ExtractAliasFromTableExpression<DB, TE> =
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

type AnyAliasedTable<
  DB,
  TB extends keyof DB,
  A extends string
> = TB extends string ? `${TB} as ${A}` : never

type AnyTable<DB> = keyof DB

type ExtractDatabaseTypeFromTableExpression<DB, TE> = {
  [A in ExtractAliasFromTableExpression<
    DB,
    TE
  >]: ExtractRowTypeFromTableExpression<DB, TE, A>
}

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
  : never

export function parseTableExpressionOrList(
  ctx: ParseContext,
  table: TableExpressionOrList<any, any>
): TableExpressionNode[] {
  if (isReadonlyArray(table)) {
    return table.map((it) => parseTableExpression(ctx, it))
  } else {
    return [parseTableExpression(ctx, table)]
  }
}

export function parseTableExpression(
  ctx: ParseContext,
  table: TableExpression<any, any>
): TableExpressionNode {
  if (isString(table)) {
    return parseAliasedTable(table)
  } else if (isOperationNodeSource(table)) {
    return table.toOperationNode()
  } else if (isFunction(table)) {
    return table(ctx.createExpressionBuilder()).toOperationNode()
  } else {
    throw new Error(`invalid table expression ${JSON.stringify(table)}`)
  }
}

export function parseAliasedTable(from: string): TableExpressionNode {
  const ALIAS_SEPARATOR = ' as '

  if (from.includes(ALIAS_SEPARATOR)) {
    const [table, alias] = from.split(ALIAS_SEPARATOR).map(trim)

    return AliasNode.create(parseTable(table), alias)
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
