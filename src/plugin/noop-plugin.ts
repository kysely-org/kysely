import type { QueryResult } from '../driver/database-connection.js'
import type { RootOperationNode } from '../query-compiler/query-compiler.js'
import type { UnknownRow } from '../util/type-utils.js'
import type {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
} from './kysely-plugin.js'

export class NoopPlugin implements KyselyPlugin {
  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return args.node
  }

  async transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    return args.result
  }

  transformResultSync(args: PluginTransformResultArgs): QueryResult<UnknownRow> {
    return args.result
  }
}
