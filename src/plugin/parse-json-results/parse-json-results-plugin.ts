import type { QueryResult } from '../../driver/database-connection.js'
import type { RootOperationNode } from '../../query-compiler/query-compiler.js'
import { freeze, isPlainObject, isString } from '../../util/object-utils.js'
import type { UnknownRow } from '../../util/type-utils.js'
import type {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
} from '../kysely-plugin.js'

export interface ParseJSONResultsPluginOptions {
  /**
   * A function that returns `true` if the given string is a JSON string that should be parsed. If a detected JSON string fails to parse, an error is thrown.
   *
   * Defaults to a function that checks if the string starts and ends with `{}` or `[]` - meaning anything that might be a JSON string, is attempted to be parsed - and if fails, proceeds.
   *
   * @param value - The string value to check.
   * @param path - The JSON path leading to this value. e.g. `$[0].users[0].profile`
   * @return `true` if the string should be JSON parsed.
   */
  shouldParse?: (value: string, path: string) => boolean

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

  /**
   * The reviver function that will be passed to `JSON.parse`.
   * See {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#the_reviver_parameter | The reviver parameter}.
   */
  reviver?: (key: string, value: unknown, context?: any) => unknown
}

type ObjectStrategy = 'in-place' | 'create'

type ProcessedParseJSONResultsPluginOptions = {
  readonly [K in keyof ParseJSONResultsPluginOptions]-?: K extends 'skipKeys'
    ? Record<string, true>
    : ParseJSONResultsPluginOptions[K]
}

/**
 * Parses JSON strings in query results into JSON objects.
 *
 * This plugin can be useful with dialects that don't automatically parse
 * JSON into objects and arrays but return JSON strings instead.
 *
 * To apply this plugin globally, pass an instance of it to the `plugins` option
 * when creating a new `Kysely` instance:
 *
 * ```ts
 * import * as Sqlite from 'better-sqlite3'
 * import { Kysely, ParseJSONResultsPlugin, SqliteDialect } from 'kysely'
 * import type { Database } from 'type-editor' // imaginary module
 *
 * const db = new Kysely<Database>({
 *   dialect: new SqliteDialect({
 *     database: new Sqlite(':memory:'),
 *   }),
 *   plugins: [new ParseJSONResultsPlugin()],
 * })
 * ```
 *
 * To apply this plugin to a single query:
 *
 * ```ts
 * import { ParseJSONResultsPlugin } from 'kysely'
 * import { jsonArrayFrom } from 'kysely/helpers/sqlite'
 *
 * const result = await db
 *   .selectFrom('person')
 *   .select((eb) => [
 *     'id',
 *     'first_name',
 *     'last_name',
 *     jsonArrayFrom(
 *       eb.selectFrom('pet')
 *         .whereRef('owner_id', '=', 'person.id')
 *         .select(['name', 'species'])
 *     ).as('pets')
 *   ])
 *   .withPlugin(new ParseJSONResultsPlugin())
 *   .execute()
 * ```
 */
export class ParseJSONResultsPlugin implements KyselyPlugin {
  readonly #options: ProcessedParseJSONResultsPluginOptions

  constructor(readonly options: ParseJSONResultsPluginOptions = {}) {
    const { shouldParse } = options

    this.#options = freeze({
      objectStrategy: options.objectStrategy || 'in-place',
      reviver: options.reviver || ((_, value) => value),
      shouldParse: shouldParse
        ? (value: string, path: string) =>
            maybeJson(value) && shouldParse(value, path)
        : maybeJson,
    })
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
      rows: parseArray(args.result.rows, '$', this.#options),
    }
  }
}

function parseArray<T>(
  arr: T[],
  path: string,
  options: ProcessedParseJSONResultsPluginOptions,
): T[] {
  const target =
    options.objectStrategy === 'create' ? new Array(arr.length) : arr

  for (let i = 0; i < arr.length; ++i) {
    target[i] = parse(arr[i], `${path}[${i}]`, options) as T
  }

  return target
}

function parse(
  value: unknown,
  path: string,
  options: ProcessedParseJSONResultsPluginOptions,
): unknown {
  if (isString(value)) {
    return parseString(value, path, options)
  }

  if (Array.isArray(value)) {
    return parseArray(value, path, options)
  }

  if (isPlainObject(value)) {
    return parseObject(value, path, options)
  }

  return value
}

function parseString(
  str: string,
  path: string,
  options: ProcessedParseJSONResultsPluginOptions,
): unknown {
  const { shouldParse } = options

  if (!shouldParse(str, path)) {
    return str
  }

  try {
    return parse(
      JSON.parse(str, (key, value, ...otherArgs) => {
        // prevent prototype pollution
        if (key === '__proto__') {
          return
        }

        // prevent prototype pollution
        if (
          key === 'constructor' &&
          isPlainObject(value) &&
          Object.hasOwn(value, 'prototype')
        ) {
          delete value.prototype
        }

        return options.reviver(key, value, ...otherArgs)
      }),
      path,
      { ...options, objectStrategy: 'in-place' },
    )
  } catch (error) {
    // custom JSON detection should expose parsing errors.
    if (shouldParse !== maybeJson) {
      throw error
    }

    // built-in naive heuristic should keep going despite errors given there might be false positives in detection.
    console.error(error)

    return str
  }
}

function maybeJson(value: string): boolean {
  return (
    (value.startsWith('{') && value.endsWith('}')) ||
    (value.startsWith('[') && value.endsWith(']'))
  )
}

function parseObject(
  obj: Record<string, unknown>,
  path: string,
  options: ProcessedParseJSONResultsPluginOptions,
): Record<string, unknown> {
  const { objectStrategy } = options

  const target = objectStrategy === 'create' ? {} : obj

  for (const key of Object.keys(obj)) {
    // prevent prototype pollution
    if (key === '__proto__') {
      continue
    }

    const parsed = parse(obj[key], `${path}.${key}`, options)

    // prevent prototype pollution
    if (
      key === 'constructor' &&
      isPlainObject(parsed) &&
      Object.hasOwn(parsed, 'prototype')
    ) {
      delete parsed.prototype
    }

    target[key] = parsed
  }

  return target
}
