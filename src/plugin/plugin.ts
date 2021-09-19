import { OperationNodeTransformer } from '../operation-node/operation-node-transformer.js'

export interface KyselyPlugin {
  /**
   * Returns a list of transformers each query's operation node tree is
   * passed through before it's compiled to SQL and executed.
   */
  createTransformers(): OperationNodeTransformer[]

  /**
   * Each result row is passed through this method.
   */
  mapRow(row: Record<string, any>): Record<string, any>
}
