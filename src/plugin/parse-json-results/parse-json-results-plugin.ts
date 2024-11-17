import { QueryResult } from '../../driver/database-connection.js'
import { RootOperationNode } from '../../query-compiler/query-compiler.js'
import { isPlainObject, isString } from '../../util/object-utils.js'
import { UnknownRow } from '../../util/type-utils.js'
import {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
} from '../kysely-plugin.js'

export interface ParseJSONResultsPluginOptions {
  /**
   * When `'in-place'`, arrays' and objects' values are parsed in-place. This is
   * the most time and space efficient option.
   *
   * This can result in runtime errors if some objects/arrays are readonly.
   *
   * When `'create'`, new arrays and objects are created to avoid such errors.
   *
   * Defaults to `'in-place'`.
   */
  objectStrategy?: ObjectStrategy
}

type ObjectStrategy = 'in-place' | 'create'

/**
 * Parses JSON strings in query results into JSON objects.
 *
 * This plugin can be useful with dialects that don't automatically parse
 * JSON into objects and arrays but return JSON strings instead.
 *
 * ```ts
 * const db = new Kysely<DB>({
 *   // ...
 *   plugins: [new ParseJSONResultsPlugin()]
 *   // ...
 * })
 * ```
 */
export class ParseJSONResultsPlugin implements KyselyPlugin {
  readonly #objectStrategy: ObjectStrategy

  constructor(readonly opt: ParseJSONResultsPluginOptions = {}) {
    this.#objectStrategy = opt.objectStrategy || 'in-place'
  }

  // noop
  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return args.node
  }

  async transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    return {
      ...args.result,
      rows: parseArray(args.result.rows, this.#objectStrategy),
    }
  }
}

function parseArray<T>(arr: T[], objectStrategy: ObjectStrategy): T[] {
  const target = objectStrategy === 'create' ? new Array(arr.length) : arr

  for (let i = 0; i < arr.length; ++i) {
    target[i] = parse(arr[i], objectStrategy) as T
  }

  return target
}

function parse(obj: unknown, objectStrategy: ObjectStrategy): unknown {
  if (isString(obj)) {
    return parseString(obj)
  }

  if (Array.isArray(obj)) {
    return parseArray(obj, objectStrategy)
  }

  if (isPlainObject(obj)) {
    return parseObject(obj, objectStrategy)
  }

  return obj
}

function parseString(str: string): unknown {
  if (maybeJson(str)) {
    try {
      return parse(JSON.parse(str), 'in-place')
    } catch (err) {
      // this catch block is intentionally empty.
    }
  }

  return str
}

function maybeJson(value: string): boolean {
  return value.match(/^[\[\{]/) != null
}

function parseObject(
  obj: Record<string, unknown>,
  objectStrategy: ObjectStrategy,
): Record<string, unknown> {
  const target = objectStrategy === 'create' ? {} : obj

  for (const key in obj) {
    target[key] = parse(obj[key], objectStrategy)
  }

  return target
}
