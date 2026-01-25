import type { QueryResult } from '../../driver/database-connection.js'
import type { RootOperationNode } from '../../query-compiler/query-compiler.js'
import { isPlainObject, isString } from '../../util/object-utils.js'
import type { UnknownRow } from '../../util/type-utils.js'
import type {
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
    return this.#transformResult(args)
  }

  transformResultSync(args: PluginTransformResultArgs): QueryResult<UnknownRow> {
    return this.#transformResult(args)
  }

  #transformResult(args: PluginTransformResultArgs): QueryResult<UnknownRow> {
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
