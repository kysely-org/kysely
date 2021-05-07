import { AliasedQueryBuilder, QueryBuilder } from '../query-builder'
import { isFunction, isString } from '../../utils/object-utils'
import { AliasNode, createAliasNode } from '../../operation-node/alias-node'
import {
  createTableNode,
  createTableNodeWithSchema,
  TableNode,
} from '../../operation-node/table-node'
import {
  AliasedQueryBuilderFactory,
  AnyAliasedQueryBuilder,
} from '../type-utils'
import { isOperationNodeSource } from '../../operation-node/operation-node-source'
import { AliasedRawBuilder } from '../../raw-builder/raw-builder'
import { FromItemNode } from '../../operation-node/from-node'

/**
 * Table argument type.
 */
export type TableArg<DB, TB extends keyof DB, O> =
  | AnyAliasedTable<DB, any, any>
  | AnyTable<DB>
  | AnyAliasedQueryBuilder
  | AliasedQueryBuilderFactory<DB, TB, O>
  | AliasedRawBuilder<any, any>

/**
 * `from` method output query builder type
 */
export type FromQueryBuilder<DB, TB extends keyof DB, O, F> = QueryBuilder<
  FromArgDatabaseType<DB, F>,
  TB | ExtractAliasesFromFromArg<DB, F>,
  O
>

export type FromArgDatabaseType<DB, F> = DB extends ExtractDatabaseTypeFromArg<
  DB,
  F
>
  ? DB
  : DB & ExtractDatabaseTypeFromArg<DB, F>

type AnyAliasedTable<
  DB,
  TB extends keyof DB,
  A extends string
> = TB extends string ? `${TB} as ${A}` : never

type AnyTable<DB> = keyof DB

type ExtractDatabaseTypeFromArg<DB, F> = {
  [A in ExtractAliasesFromFromArg<DB, F>]: ExtractRowTypeFromFromArg<DB, F, A>
}

export type ExtractAliasesFromFromArg<
  DB,
  F
> = F extends `${string} as ${infer TA}`
  ? TA
  : F extends keyof DB
  ? F
  : F extends AliasedQueryBuilder<any, any, any, infer QA>
  ? QA
  : F extends (qb: any) => AliasedQueryBuilder<any, any, any, infer QA>
  ? QA
  : F extends (qb: any) => AliasedRawBuilder<any, infer RA>
  ? RA
  : never

type ExtractRowTypeFromFromArg<
  DB,
  F,
  A extends keyof any
> = F extends `${infer T} as ${infer TA}`
  ? TA extends A
    ? T extends keyof DB
      ? DB[T]
      : never
    : never
  : F extends A
  ? F extends keyof DB
    ? DB[F]
    : never
  : F extends AliasedQueryBuilder<any, any, infer O, infer QA>
  ? QA extends A
    ? O
    : never
  : F extends (qb: any) => AliasedQueryBuilder<any, any, infer O, infer QA>
  ? QA extends A
    ? O
    : never
  : F extends AliasedRawBuilder<infer O, infer RA>
  ? RA extends A
    ? O
    : never
  : never

export function parseFromArgs(
  from: TableArg<any, any, any> | TableArg<any, any, any>[]
): FromItemNode[] {
  if (Array.isArray(from)) {
    return from.map((it) => parseFromArg(it))
  } else {
    return [parseFromArg(from)]
  }
}

export function parseFromArg(from: TableArg<any, any, any>): FromItemNode {
  if (isString(from)) {
    return parseAliasedTable(from)
  } else if (isOperationNodeSource(from)) {
    return from.toOperationNode()
  } else if (isFunction(from)) {
    return from(new QueryBuilder()).toOperationNode()
  } else {
    throw new Error(
      `invalid value passed to query method: ${JSON.stringify(from)}`
    )
  }
}

export function parseAliasedTable(from: string): AliasNode | TableNode {
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
