import { RawNode } from '../operation-node/raw-node.js'

export type TimestampPrecision = 0 | 1 | 2 | 3 | 4 | 5 | 6

export function parseCurrentTimestamp(precision?: TimestampPrecision) {
  const value =
    precision === undefined
      ? 'current_timestamp'
      : `current_timestamp(${precision})`

  return RawNode.createWithSql(value)
}
