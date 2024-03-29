import { QueryResult } from '../../driver/database-connection.js'
import { RootOperationNode } from '../../query-compiler/query-compiler.js'
import {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
} from '../kysely-plugin.js'
import { UnknownRow } from '../../util/type-utils.js'
import { WithSafeArrayWhereInTransformer } from './safe-empty-array-where-in.transformer.js'

export class WithSafeArrayWhereInPlugin implements KyselyPlugin {
  readonly #transformer = new WithSafeArrayWhereInTransformer()

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.#transformer.transformNode(args.node)
  }

  transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    return Promise.resolve(args.result)
  }
}
