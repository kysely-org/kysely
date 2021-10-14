import { freeze } from './object-utils.js'
import { randomString } from './random-string.js'

export interface QueryId {
  readonly queryId: string
}

export function createQueryId(): QueryId {
  return freeze({
    queryId: randomString(8),
  })
}
