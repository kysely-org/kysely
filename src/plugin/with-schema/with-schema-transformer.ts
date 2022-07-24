import { TableNode } from '../../operation-node/table-node.js'
import { TableTransformerBase } from '../table-transformer-base.js'

export class WithSchemaTransformer extends TableTransformerBase {
  readonly #schema: string

  constructor(schema: string) {
    super()
    this.#schema = schema
  }

  protected override transformTable(node: TableNode): TableNode {
    const transformed = super.transformTable(node)

    if (transformed.schema || !this.wasTableCollected(node.table.identifier)) {
      return transformed
    }

    return {
      ...transformed,
      schema: {
        kind: 'IdentifierNode',
        identifier: this.#schema,
      },
    }
  }
}
