import { QueryResult } from '../../driver/database-connection.js'
import { RootOperationNode } from '../../query-compiler/query-compiler.js'
import { WithSchemaTransformer } from './with-schema-transformer.js'
import {
  AnyRow,
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
} from '../kysely-plugin.js'

export class WithSchemaPlugin implements KyselyPlugin {
  readonly #transformer: WithSchemaTransformer

  constructor(schema: string) {
    this.#transformer = new WithSchemaTransformer(schema)
  }

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.#transformer.transformNode(args.node)
  }

  async transformResult(
    args: PluginTransformResultArgs
  ): Promise<QueryResult<AnyRow>> {
    return args.result
  }
}
