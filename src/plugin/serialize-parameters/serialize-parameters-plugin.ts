import { QueryResult } from '../../driver/database-connection.js'
import { RootOperationNode } from '../../query-compiler/query-compiler.js'
import { UnknownRow } from '../../util/type-utils.js'
import {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
} from '../kysely-plugin.js'
import { SerializeParametersTransformer } from './serialize-parameters-transformer.js'
import { Caster, Serializer } from './serialize-parameters.js'

export interface SerializeParametersPluginOptions {
  /**
   * TODO: ...
   */
  caster?: Caster
  /**
   * Defaults to `JSON.stringify` of objects and arrays.
   */
  serializer?: Serializer
}

/**
 * A plugin that serializes query parameters so you don't have to.
 *
 * The following example will return an error when using Postgres or Mysql dialects, unless using this plugin:
 *
 * ```ts
 * interface Person {
 *   firstName: string
 *   lastName: string
 *   tags: string[] // json or jsonb data type in database
 * }
 *
 * interface Database {
 *   person: Person
 * }
 *
 * const db = new Kysely<Database>({
 *   dialect: new PostgresDialect({
 *     database: 'kysel_test',
 *     host: 'localhost',
 *   }),
 *   plugins: [
 *     new SerializeParametersPlugin(),
 *   ],
 * })
 *
 * await db.insertInto('person')
 *   .values([{
 *     firstName: 'Jennifer',
 *     lastName: 'Aniston',
 *     tags: ['celebrity', 'actress'],
 *   }])
 *   .execute()
 * ```
 */
export class SerializeParametersPlugin implements KyselyPlugin {
  readonly #serializeParametersTransformer: SerializeParametersTransformer

  constructor(opt: SerializeParametersPluginOptions = {}) {
    this.#serializeParametersTransformer = new SerializeParametersTransformer(
      opt.serializer,
      opt.caster
    )
  }

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.#serializeParametersTransformer.transformNode(args.node)
  }

  async transformResult(
    args: PluginTransformResultArgs
  ): Promise<QueryResult<UnknownRow>> {
    return args.result
  }
}
