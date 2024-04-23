import { IdentifierNode } from '../operation-node/identifier-node.js'
import { RawNode } from '../operation-node/raw-node.js'

export function parseSavepointCommand(
  command: string,
  savepointName: string,
): RawNode {
  return RawNode.createWithChildren([
    RawNode.createWithSql(`${command} `),
    IdentifierNode.create(savepointName), // ensures savepointName gets sanitized
  ])
}
