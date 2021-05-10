import {
  AliasedQueryBuilder,
  createEmptySelectQuery,
  QueryBuilder,
} from '../query-builder/query-builder'
import { isFunction, isString } from '../utils/object-utils'
import { createAliasNode } from '../operation-node/alias-node'
import {
  createTableNode,
  createTableNodeWithSchema,
  TableNode,
} from '../operation-node/table-node'
import {
  AliasedQueryBuilderFactory,
  AnyAliasedQueryBuilder,
} from '../query-builder/type-utils'
import { isOperationNodeSource } from '../operation-node/operation-node-source'
import { AliasedRawBuilder } from '../raw-builder/raw-builder'
import { TableExpressionNode } from '../operation-node/operation-node-utils'

export type TableExpression<DB, TB extends keyof DB, O> =
  | AnyAliasedTable<DB, any, any>
  | AnyTable<DB>
  | AnyAliasedQueryBuilder
  | AliasedQueryBuilderFactory<DB, TB, O>
  | AliasedRawBuilder<any, any>

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

export type TableExpressionDatabaseType<
  DB,
  TE
> = DB extends ExtractDatabaseTypeFromTableExpression<DB, TE>
  ? DB
  : DB & ExtractDatabaseTypeFromTableExpression<DB, TE>

export type ExtractAliasFromTableExpression<
  DB,
  TE
> = TE extends `${string} as ${infer TA}`
  ? TA
  : TE extends keyof DB
  ? TE
  : TE extends AliasedQueryBuilder<any, any, any, infer QA>
  ? QA
  : TE extends (qb: any) => AliasedQueryBuilder<any, any, any, infer QA>
  ? QA
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
  table: TableExpression<any, any, any> | TableExpression<any, any, any>[]
): TableExpressionNode[] {
  if (Array.isArray(table)) {
    return table.map((it) => parseTableExpression(it))
  } else {
    return [parseTableExpression(table)]
  }
}

export function parseTableExpression(
  table: TableExpression<any, any, any>
): TableExpressionNode {
  if (isString(table)) {
    return parseAliasedTable(table)
  } else if (isOperationNodeSource(table)) {
    return table.toOperationNode()
  } else if (isFunction(table)) {
    return table(createEmptySelectQuery()).toOperationNode()
  } else {
    throw new Error(`invalid table expression ${JSON.stringify(table)}`)
  }
}

export function parseAliasedTable(from: string): TableExpressionNode {
  const [table, alias] = from.split(' as ').map((it) => it.trim())

  if (alias) {
    return createAliasNode(createTableNode(table), alias)
  } else {
    return parseTable(table)
  }
}

export function parseTable(from: string): TableNode {
  if (from.includes('.')) {
    const [schema, table] = from.split('.').map((it) => it.trim())

    return createTableNodeWithSchema(schema, table)
  } else {
    return createTableNode(from)
  }
}
