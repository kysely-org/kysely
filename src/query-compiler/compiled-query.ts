import { RawNode } from '../operation-node/raw-node.js'
import {
  isRootOperationNode,
  type RootOperationNode,
} from '../operation-node/root-operation-node.js'
import { freeze, isObject, isString } from '../util/object-utils.js'
import { createQueryId, type QueryId } from '../util/query-id.js'

export interface CompiledQuery<O = unknown> {
  readonly query: RootOperationNode
  readonly queryId: QueryId
  readonly sql: string
  readonly parameters: ReadonlyArray<unknown>
}

export function isCompiledQuery<R>(thing: unknown): thing is CompiledQuery<R> {
  return (
    isObject(thing) &&
    Object.hasOwn(thing, 'parameters') &&
    Object.hasOwn(thing, 'query') &&
    Object.hasOwn(thing, 'queryId') &&
    Object.hasOwn(thing, 'sql') &&
    isString(thing.sql) &&
    Array.isArray(thing.parameters) &&
    isRootOperationNode(thing.query)
  )
}

type CompiledQueryFactory = Readonly<{
  raw(sql: string, parameters?: unknown[]): Readonly<CompiledQuery>
}>

export const CompiledQuery: CompiledQueryFactory = freeze<CompiledQueryFactory>(
  {
    raw(sql, parameters = []) {
      return freeze({
        sql,
        query: RawNode.createWithSql(sql),
        parameters: freeze(parameters),
        queryId: createQueryId(),
      })
    },
  },
)
