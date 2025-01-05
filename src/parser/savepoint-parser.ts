import { IdentifierNode } from '../operation-node/identifier-node.js'
import { RawNode } from '../operation-node/raw-node.js'

export type RollbackToSavepoint<
  S extends string[],
  SN extends S[number],
> = S extends [...infer L, infer R]
  ? R extends SN
    ? S
    : RollbackToSavepoint<L extends string[] ? L : never, SN>
  : never

export type ReleaseSavepoint<
  S extends string[],
  SN extends S[number],
> = S extends [...infer L, infer R]
  ? R extends SN
    ? L
    : ReleaseSavepoint<L extends string[] ? L : never, SN>
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
