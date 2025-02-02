import { QueryResult } from '../../driver/database-connection.js'
import { RootOperationNode } from '../../query-compiler/query-compiler.js'
import { UnknownRow } from '../../util/type-utils.js'
import {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
} from '../kysely-plugin.js'
import { SafeNullComparisonTransformer } from './safe-null-comparison-transformer.js'

/**
 * Plugin that removes duplicate joins from queries.
 *
 * See [this recipe](https://github.com/kysely-org/kysely/blob/master/site/docs/recipes/0008-deduplicate-joins.md)
 */
export class SafeNullComparisonPlugin implements KyselyPlugin {
  readonly #transformer = new SafeNullComparisonTransformer()

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.#transformer.transformNode(args.node)
  }

  transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    return Promise.resolve(args.result)
  }
}
