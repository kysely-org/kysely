import { AliasNode, createAliasNode } from '../../operation-node/alias-node'
import { ColumnNode, createColumnNode } from '../../operation-node/column-node'
import { isOperationNodeSource } from '../../operation-node/operation-node-source'
import { AliasedRawBuilder } from '../../raw-builder/raw-builder'
import { isFunction, isString } from '../../utils/object-utils'
import { AliasedQueryBuilder, QueryBuilder } from '../query-builder'

import {
  createReferenceNode,
  ReferenceNode,
} from '../../operation-node/reference-node'

import {
  createSelectAllSelectionNode,
  createSelectAllSelectionNodeWithTable,
  createSelectionNode,
  SelectionNode,
} from '../../operation-node/selection-node'

import {
  createTableNode,
  createTableNodeWithSchema,
} from '../../operation-node/table-node'

import {
  AliasedQueryBuilderFactory,
  AliasedRawBuilderFactory,
  AnyAliasedQueryBuilder,
  AnyColumn,
  AnyColumnWithTable,
  RowType,
  ValueType,
} from '../type-utils'

/**
 * `select` method argument type.
 */
export type SelectArg<DB, TB extends keyof DB, O> =
  | AnyAliasedColumnWithTable<DB, TB>
  | AnyColumnWithTable<DB, TB>
  | AnyColumn<DB, TB>
  | AliasedRawBuilder<any, any>
  | AliasedRawBuilderFactory<DB, TB, O>
  | AnyAliasedQueryBuilder
  | AliasedQueryBuilderFactory<DB, TB, O>

/**
 * `select` method output query builder type
 */
export type SelectQueryBuilder<DB, TB extends keyof DB, O, S> = QueryBuilder<
  DB,
  TB,
  O & SelectResultType<DB, TB, S>
>

/**
 * `selectAll` method output query builder type
 */
export type SelectAllQueryBuiler<
  DB,
  TB extends keyof DB,
  O,
  S extends keyof DB
> = QueryBuilder<DB, TB, O & RowType<DB, S>>

type AnyAliasedColumnWithTable<DB, TB extends keyof DB> = `${AnyColumnWithTable<
  DB,
  TB
>} as ${string}`

type SelectResultType<DB, TB extends keyof DB, S> = {
  [A in ExtractAliasesFromSelectArg<S>]: ExtractTypeFromSelectArg<DB, TB, S, A>
}

type ExtractAliasesFromSelectArg<
  S
> = S extends `${string}.${string}.${string} as ${infer A}`
  ? A
  : S extends `${string}.${string}.${infer C}`
  ? C
  : S extends `${string}.${string} as ${infer A}`
  ? A
  : S extends `${string}.${infer C}`
  ? C
  : S extends keyof any
  ? S
  : S extends AliasedRawBuilder<any, infer RA>
  ? RA
  : S extends (qb: any) => AliasedRawBuilder<any, infer RA>
  ? RA
  : S extends AliasedQueryBuilder<any, any, any, infer QA>
  ? QA
  : S extends (qb: any) => AliasedQueryBuilder<any, any, any, infer QA>
  ? QA
  : never

type ExtractTypeFromSelectArg<
  DB,
  TB extends keyof DB,
  S,
  A extends keyof any,
  R = RowType<DB, TB>
> = S extends `${infer SC}.${infer T}.${infer C} as ${infer RA}`
  ? RA extends A
    ? `${SC}.${T}` extends TB
      ? C extends keyof DB[`${SC}.${T}`]
        ? DB[`${SC}.${T}`][C]
        : never
      : never
    : never
  : S extends `${infer SC}.${infer T}.${infer C}`
  ? C extends A
    ? `${SC}.${T}` extends TB
      ? C extends keyof DB[`${SC}.${T}`]
        ? DB[`${SC}.${T}`][C]
        : never
      : never
    : never
  : S extends `${infer T}.${infer C} as ${infer RA}`
  ? RA extends A
    ? T extends TB
      ? C extends keyof DB[T]
        ? DB[T][C]
        : never
      : never
    : never
  : S extends `${infer T}.${infer C}`
  ? C extends A
    ? T extends TB
      ? C extends keyof DB[T]
        ? DB[T][C]
        : never
      : never
    : never
  : S extends A
  ? S extends keyof R
    ? R[S]
    : never
  : S extends AliasedRawBuilder<infer O, infer RA>
  ? RA extends A
    ? O
    : never
  : S extends (qb: any) => AliasedRawBuilder<infer O, infer RA>
  ? RA extends A
    ? O
    : never
  : S extends AliasedQueryBuilder<any, any, infer O, infer QA>
  ? QA extends A
    ? ValueType<O>
    : never
  : S extends (qb: any) => AliasedQueryBuilder<any, any, infer O, infer QA>
  ? QA extends A
    ? ValueType<O>
    : never
  : never

export function parseSelectArgs(
  selection: SelectArg<any, any, any> | SelectArg<any, any, any>[]
): SelectionNode[] {
  if (Array.isArray(selection)) {
    return selection.map((it) => parseSelectArg(it))
  } else {
    return [parseSelectArg(selection)]
  }
}

function parseSelectArg(selection: SelectArg<any, any, any>): SelectionNode {
  if (isString(selection)) {
    return createSelectionNode(parseAliasedStringReference(selection))
  } else if (isOperationNodeSource(selection)) {
    return createSelectionNode(selection.toOperationNode())
  } else if (isFunction(selection)) {
    return createSelectionNode(selection(new QueryBuilder()).toOperationNode())
  } else {
    throw new Error(
      `invalid value passed to select method: ${JSON.stringify(selection)}`
    )
  }
}

function parseAliasedStringReference(
  str: string
): ColumnNode | ReferenceNode | AliasNode {
  if (str.includes(' as ')) {
    const [tableColumn, alias] = str.split(' as ').map((it) => it.trim())
    const tableColumnNode = parseStringReference(tableColumn)
    return createAliasNode(tableColumnNode, alias)
  } else {
    return parseStringReference(str)
  }
}

export function parseStringReference(str: string): ColumnNode | ReferenceNode {
  if (str.includes('.')) {
    const parts = str.split('.').map((it) => it.trim())

    if (parts.length === 3) {
      return parseStringReferenceWithTableAndSchema(parts)
    } else if (parts.length === 2) {
      return parseStringReferenceWithTable(parts)
    } else {
      throw new Error(`invalid column reference ${str}`)
    }
  } else {
    return createColumnNode(str)
  }
}

function parseStringReferenceWithTableAndSchema(
  parts: string[]
): ReferenceNode {
  const [schema, table, column] = parts

  return createReferenceNode(
    createTableNodeWithSchema(schema, table),
    createColumnNode(column)
  )
}

function parseStringReferenceWithTable(parts: string[]): ReferenceNode {
  const [table, column] = parts
  return createReferenceNode(createTableNode(table), createColumnNode(column))
}

export function parseSelectAllArgs(table?: string | string[]): SelectionNode[] {
  if (!table) {
    return [createSelectAllSelectionNode()]
  } else if (Array.isArray(table)) {
    return table.map(parseSelectAllArg)
  } else {
    return [parseSelectAllArg(table)]
  }
}

export function parseSelectAllArg(table: string): SelectionNode {
  if (isString(table)) {
    return createSelectAllSelectionNodeWithTable(table)
  } else {
    throw new Error(
      `invalid value passed to selectAll method: ${JSON.stringify(table)}`
    )
  }
}
