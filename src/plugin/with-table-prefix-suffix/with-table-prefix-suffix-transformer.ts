import { TableNode } from '../../operation-node/table-node.js'
import { TableTransformer } from '../table-transformer.js'
import { WithTablePrefixSuffixPluginOptions } from './with-table-prefix-suffix-plugin.js'

export class WithTablePrefixSuffixTransformer extends TableTransformer {
  readonly #opt: WithTablePrefixSuffixPluginOptions

  constructor(opt: WithTablePrefixSuffixPluginOptions) {
    super()
    this.#opt = opt
  }

  protected override transformTable(node: TableNode): TableNode {
    const transformed = super.transformTable(node)

    const identifier = node.table.identifier

    if (!this.wasTableCollected(identifier)) {
      return transformed
    }

    return {
      ...transformed,
      table: {
        kind: 'IdentifierNode',
        identifier: `${this.#opt.prefix ?? ''}${identifier}${
          this.#opt.suffix ?? ''
        }`,
      },
    }
  }
}
