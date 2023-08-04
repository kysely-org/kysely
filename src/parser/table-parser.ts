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
import { Database } from '../database.js'

export type TableExpression<
  DB extends Database,
  TB extends keyof DB['tables']
> = AnyAliasedTable<DB> | AnyTable<DB> | AliasedExpressionOrFactory<DB, TB>

export type TableExpressionOrList<
  DB extends Database,
  TB extends keyof DB['tables']
> = TableExpression<DB, TB> | ReadonlyArray<TableExpression<DB, TB>>

export type TableReference<DB extends Database> =
  | AnyAliasedTable<DB>
  | AnyTable<DB>
  | AliasedExpression<any, any>

export type AnyAliasedTable<DB extends Database> =
  `${AnyTable<DB>} as ${string}`

export type TableReferenceOrList<DB extends Database> =
  | TableReference<DB>
  | ReadonlyArray<TableReference<DB>>

export type From<DB extends Database, TE> = DrainOuterGeneric<{
  tables: {
    [C in
      | keyof DB['tables']
      | ExtractAliasFromTableExpression<
          DB,
          TE
        >]: C extends ExtractAliasFromTableExpression<DB, TE>
      ? ExtractRowTypeFromTableExpression<DB, TE, C>
      : C extends keyof DB['tables']
      ? DB['tables'][C]
      : never
  }
  config: DB['config']
}>

export type FromTables<
  DB extends Database,
  TB extends keyof DB['tables'],
  TE
> = DrainOuterGeneric<TB | ExtractAliasFromTableExpression<DB, TE>>

export type ExtractTableAlias<
  DB extends Database,
  TE
> = TE extends `${string} as ${infer TA}`
  ? TA
  : TE extends keyof DB['tables']
  ? TE
  : never

export type PickTableWithAlias<
  DB extends Database,
  T extends AnyAliasedTable<DB>
> = T extends `${infer TB} as ${infer A}`
  ? TB extends keyof DB['tables']
    ? ShallowRecord<A, DB['tables'][TB]>
    : never
  : never

type ExtractAliasFromTableExpression<
  DB extends Database,
  TE
> = TE extends string
  ? ExtractTableAlias<DB, TE>
  : TE extends AliasedExpression<any, infer QA>
  ? QA
  : TE extends (qb: any) => AliasedExpression<any, infer QA>
  ? QA
  : never

type ExtractRowTypeFromTableExpression<
  DB extends Database,
  TE,
  A extends keyof any
> = TE extends `${infer T} as ${infer TA}`
  ? TA extends A
    ? T extends keyof DB['tables']
      ? DB['tables'][T]
      : never
    : never
  : TE extends A
  ? TE extends keyof DB['tables']
    ? DB['tables'][TE]
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

type AnyTable<DB extends Database> = keyof DB['tables'] & string

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
