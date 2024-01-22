import { QueryResult } from '../driver/database-connection.js'
import { RootOperationNode } from '../query-compiler/query-compiler.js'
import { UnknownRow } from '../util/type-utils.js'
import {
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
}
