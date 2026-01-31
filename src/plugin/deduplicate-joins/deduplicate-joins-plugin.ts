import type { QueryResult } from '../../driver/database-connection.js'
import type { RootOperationNode } from '../../query-compiler/query-compiler.js'
import type { UnknownRow } from '../../util/type-utils.js'
import type {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
} from '../kysely-plugin.js'
import { DeduplicateJoinsTransformer } from './deduplicate-joins-transformer.js'

/**
 * Plugin that removes duplicate joins from queries.
 *
 * See [this recipe](https://github.com/kysely-org/kysely/blob/master/site/docs/recipes/0008-deduplicate-joins.md)
 */
export class DeduplicateJoinsPlugin implements KyselyPlugin {
  readonly #transformer = new DeduplicateJoinsTransformer()

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.#transformer.transformNode(args.node, args.queryId)
  }

  transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    return Promise.resolve(args.result)
  }

  transformResultSync(args: PluginTransformResultArgs): QueryResult<UnknownRow> {
    return args.result
  }
}
