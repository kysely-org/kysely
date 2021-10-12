import { QueryResult } from '../../driver/database-connection'
import { RootOperationNode } from '../../query-compiler/query-compiler'
import {
  AnyRow,
  ExecutorPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
} from '../../query-executor/query-executor'
import { WithSchemaTransformer } from '../../transformers/with-schema-transformer'

export class WithSchemaPlugin implements ExecutorPlugin {
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
