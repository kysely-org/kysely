import { IdentifierNode } from '../operation-node/identifier-node.js'
import { RawNode } from '../operation-node/raw-node.js'

export type RollbackToSavepoint<
  S extends string[],
  SN extends S[number],
> = S extends [...infer L, infer R]
  ? R extends SN
    ? S
    : L extends string[]
      ? RollbackToSavepoint<L, SN>
      : never
  : never

export type ReleaseSavepoint<
  S extends string[],
  SN extends S[number],
> = S extends [...infer L, infer R]
  ? R extends SN
    ? L
    : L extends string[]
      ? ReleaseSavepoint<L, SN>
      : never
  : never

export function parseSavepointCommand(
  command: string,
  savepointName: string,
): RawNode {
  return RawNode.createWithChildren([
    RawNode.createWithSql(`${command} `),
    IdentifierNode.create(savepointName), // ensures savepointName gets sanitized
  ])
}
