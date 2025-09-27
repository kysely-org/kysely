import { SchemableIdentifierNode } from '../operation-node/schemable-identifier-node.js'

export function parseSchemableIdentifier(id: string): SchemableIdentifierNode {
  const SCHEMA_SEPARATOR = '.'

  if (id.includes(SCHEMA_SEPARATOR)) {
    const parts = id.split(SCHEMA_SEPARATOR).map(trim)

    if (parts.length === 2) {
      return SchemableIdentifierNode.createWithSchema(parts[0], parts[1])
    } else {
      throw new Error(`invalid schemable identifier ${id}`)
    }
  } else {
    return SchemableIdentifierNode.create(id)
  }
}

export function parseSchemableIdentifierArray(
  id: string | string[],
): SchemableIdentifierNode[] {
  if (!Array.isArray(id)) {
    id = [id]
  }

  return id.map(parseSchemableIdentifier)
}

function trim(str: string): string {
  return str.trim()
}
