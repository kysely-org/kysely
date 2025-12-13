import type { QueryResult } from '../../driver/database-connection.js'
import type { RootOperationNode } from '../../query-compiler/query-compiler.js'
import type { UnknownRow } from '../../util/type-utils.js'
import type {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
} from '../kysely-plugin.js'
import { SafeNullComparisonTransformer } from './safe-null-comparison-transformer.js'

/**
 * Plugin that handles NULL comparisons to prevent common SQL mistakes.
 *
 * In SQL, comparing values with NULL using standard comparison operators (=, !=, <>)
 * always yields NULL, which is usually not what developers expect. The correct way
 * to compare with NULL is using IS NULL and IS NOT NULL.
 *
 * When working with nullable variables (e.g. string | null), you need to be careful to
 * manually handle these cases with conditional WHERE clauses. This plugins automatically
 * applies the correct operator based on the value, allowing you to simply write `query.where('name', '=', name)`.
 *
 * The plugin transforms the following operators when comparing with NULL:
 * - `=` becomes `IS`
 * - `!=` becomes `IS NOT`
 * - `<>` becomes `IS NOT`
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
