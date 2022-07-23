import { QueryResult } from '../../driver/database-connection.js'
import { RootOperationNode } from '../../query-compiler/query-compiler.js'
import { ExplainFormat } from '../../util/explainable.js'
import { AnyRawBuilder, UnknownRow } from '../../util/type-utils.js'
import {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
} from '../kysely-plugin.js'
import { ExplainTransformer } from './explain-transformer.js'

export interface ExplainPluginOptions {
  enabled?: boolean
  format?: ExplainFormat
  raw?: AnyRawBuilder
}

/**
 * Plugin that adds `explain` statement before `select`/`insert`/`update`/`replace`/`delete` keywords.
 */
export class ExplainPlugin implements KyselyPlugin {
  readonly #transformer: ExplainTransformer

  constructor(opt: ExplainPluginOptions = {}) {
    this.#transformer = new ExplainTransformer(opt)
  }

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    return this.#transformer.transformNode(args.node)
  }

  transformResult(
    args: PluginTransformResultArgs
  ): Promise<QueryResult<UnknownRow>> {
    return Promise.resolve(args.result)
  }
}
