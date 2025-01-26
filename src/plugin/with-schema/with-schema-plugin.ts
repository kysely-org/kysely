import { QueryResult } from '../../driver/database-connection.js'
import { RootOperationNode } from '../../query-compiler/query-compiler.js'
import { WithSchemaTransformer } from './with-schema-transformer.js'
import {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
} from '../kysely-plugin.js'
import { UnknownRow } from '../../util/type-utils.js'

export class WithSchemaPlugin implements KyselyPlugin {
  readonly #transformer: WithSchemaTransformer

  constructor(schema: string) {
    this.#transformer = new WithSchemaTransformer(schema)
  }

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.#transformer.transformNode(args.node, args.queryId)
  }

  async transformResult(
    args: PluginTransformResultArgs,
  ): Promise<QueryResult<UnknownRow>> {
    return args.result
  }
}
