import { QueryResult } from '../../driver/database-connection.js'
import { RootOperationNode } from '../../query-compiler/query-compiler.js'
import { isPlainObject, isString } from '../../util/object-utils.js'
import { UnknownRow } from '../../util/type-utils.js'
import {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
} from '../kysely-plugin.js'

/**
 * Parses JSON strings in query results into JSON objects.
 *
 * This plugin can be useful with dialects that don't automatically parse
 * JSON into objects and arrays but return JSON strings instead.
 *
 * ```ts
 * const db = kysely<Tables>()
 *   .dialect(new SqliteDialect(config))
 *   .plugin(new ParseJSONResultsPlugin())
 *   .build()
 * ```
 */
export class ParseJSONResultsPlugin implements KyselyPlugin {
  // noop
  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return args.node
  }

  async transformResult(
    args: PluginTransformResultArgs
  ): Promise<QueryResult<UnknownRow>> {
    return {
      ...args.result,
      rows: parseArray(args.result.rows),
    }
  }
}

function parseArray<T>(arr: T[]): T[] {
  for (let i = 0; i < arr.length; ++i) {
    arr[i] = parse(arr[i]) as T
  }

  return arr
}

function parse(obj: unknown): unknown {
  if (isString(obj)) {
    return parseString(obj)
  }

  if (Array.isArray(obj)) {
    return parseArray(obj)
  }

  if (isPlainObject(obj)) {
    return parseObject(obj)
  }

  return obj
}

function parseString(str: string): unknown {
  if (maybeJson(str)) {
    try {
      return parse(JSON.parse(str))
    } catch (err) {
      // this catch block is intentionally empty.
    }
  }

  return str
}

function maybeJson(value: string): boolean {
  return value.match(/^[\[\{]/) != null
}

function parseObject(obj: Record<string, unknown>): Record<string, unknown> {
  for (const key in obj) {
    obj[key] = parse(obj[key])
  }

  return obj
}
