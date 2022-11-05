import { SchemableIdentifierNode } from '../operation-node/schemable-identifier-node'

export function parseSchemableIdentifier(id: string): SchemableIdentifierNode {
  const COLUMN_SEPARATOR = '.'

  if (id.includes(COLUMN_SEPARATOR)) {
    const parts = id.split(COLUMN_SEPARATOR).map(trim)

    if (parts.length === 2) {
      return SchemableIdentifierNode.createWithSchema(parts[0], parts[1])
    } else {
      throw new Error(`invalid schemable identifier ${id}`)
    }
  } else {
    return SchemableIdentifierNode.create(id)
  }
}

function trim(str: string): string {
  return str.trim()
}
