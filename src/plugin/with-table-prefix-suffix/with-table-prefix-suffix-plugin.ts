import { QueryResult } from '../../driver/database-connection.js'
import { RootOperationNode } from '../../query-compiler/query-compiler.js'
import { UnknownRow } from '../../util/type-utils.js'
import {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
} from '../kysely-plugin.js'
import { WithTablePrefixSuffixTransformer } from './with-table-prefix-suffix-transformer.js'

export interface WithTablePrefixSuffixPluginOptions {
  /** Will be added right before each table's name. */
  prefix?: string
  /** Will be added right after each table's name. */
  suffix?: string
}

/**
 * Adds prefix/suffix to table identifiers, so you don't have to.
 *
 * Why? sometimes you share a single database instance (and possibly schema) between multiple
 * development efforts within the same project/company.
 *
 * Each effort is developed in isolation but with a common set of tables mirroring production,
 * that differs by developer/environment/feature/etc. name added as a prefix/suffix.
 *
 * e.g. `person_pr-103` & `person_dev`
 *
 * Ideally, you'd pass a single common database interface to Kysely,
 * and regardless of effort/environment/etc. your kysely queries will stay the same.
 *
 * By no means, does this plugin endorse this way of design/development. It's out there in
 * the wild, and that's a good enough reason to support it.
 *
 * ```typescript
 * process.env.ENVIRONMENT = 'pr-103'
 *
 * interface Database {
 *  person: Person
 * }
 *
 * const db = new Kysely<Database>({
 *  ...,
 *  plugins: [
 *    new WithTablePrefixSuffixPlugin({
 *      suffix: `_${process.env.ENVIRONMENT}`
 *    })
 *  ]
 * })
 *
 * const person = await db
 *  .selectFrom('person')
 *  .where('id', '=', 123)
 *  .selectAll()
 *  .executeTakeFirst()
 * ```
 *
 * compiled query (mysql):
 *
 * ```sql
 * select * from `person_pr-103` where `id` = ?
 * ```
 */
export class WithTablePrefixSuffixPlugin implements KyselyPlugin {
  readonly #transformer: WithTablePrefixSuffixTransformer

  constructor(opt: WithTablePrefixSuffixPluginOptions = {}) {
    this.#transformer = new WithTablePrefixSuffixTransformer(opt)
  }

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.#transformer.transformNode(args.node)
  }

  async transformResult(
    args: PluginTransformResultArgs
  ): Promise<QueryResult<UnknownRow>> {
    return args.result
  }
}
