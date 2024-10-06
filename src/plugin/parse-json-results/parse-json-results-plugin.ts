import { QueryResult } from '../../driver/database-connection.js'
import { RootOperationNode } from '../../query-compiler/query-compiler.js'
import { freeze, isPlainObject, isString } from '../../util/object-utils.js'
import { UnknownRow } from '../../util/type-utils.js'
import {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
} from '../kysely-plugin.js'

export interface ParseJSONResultsPluginOptions {
  /**
   * A function that returns `true` if the given string is a JSON string.
   *
   * Defaults to a function that checks if the string starts and ends with `{}` or `[]`.
   */
  isJSON?: (value: string) => boolean

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

  /**
   * An array of keys that should not be parsed inside an object, even if they contain JSON strings.
   */
  skipKeys?: string[]
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

  constructor(readonly opt: ParseJSONResultsPluginOptions = {}) {
    this.#options = freeze({
      isJSON: opt.isJSON || maybeJson,
      objectStrategy: opt.objectStrategy || 'in-place',
      reviver: opt.reviver || ((_, value) => value),
      skipKeys: (opt.skipKeys || []).reduce(
        (acc, key) => {
          acc[key] = true
          return acc
        },
        {} as Record<string, true>,
      ),
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
      rows: parseArray(args.result.rows, this.#options),
    }
  }
}

function parseArray<T>(
  arr: T[],
  options: ProcessedParseJSONResultsPluginOptions,
): T[] {
  const target =
    options.objectStrategy === 'create' ? new Array(arr.length) : arr

  for (let i = 0; i < arr.length; ++i) {
    target[i] = parse(arr[i], options) as T
  }

  return target
}

function parse(
  value: unknown,
  options: ProcessedParseJSONResultsPluginOptions,
): unknown {
  if (isString(value)) {
    return parseString(value, options)
  }

  if (Array.isArray(value)) {
    return parseArray(value, options)
  }

  if (isPlainObject(value)) {
    return parseObject(value, options)
  }

  return value
}

function parseString(
  str: string,
  options: ProcessedParseJSONResultsPluginOptions,
): unknown {
  if (options.isJSON(str)) {
    try {
      return parse(
        JSON.parse(str, (...args) => {
          // prevent prototype pollution
          if (args[0] === '__proto__') return
          return options.reviver(...args)
        }),
        { ...options, objectStrategy: 'in-place' },
      )
    } catch (err) {
      // this catch block is intentionally empty.
    }
  }

  return str
}

function maybeJson(value: string): boolean {
  return (
    (value.startsWith('{') && value.endsWith('}')) ||
    (value.startsWith('[') && value.endsWith(']'))
  )
}

function parseObject(
  obj: Record<string, unknown>,
  options: ProcessedParseJSONResultsPluginOptions,
): Record<string, unknown> {
  const { objectStrategy, skipKeys } = options

  const target = objectStrategy === 'create' ? {} : obj

  for (const key in obj) {
    target[key] = skipKeys[key] ? obj[key] : parse(obj[key], options)
  }

  return target
}
