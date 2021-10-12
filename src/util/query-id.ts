import { freeze } from './object-utils'
import { randomString } from './random-string'

export interface QueryId {
  readonly queryId: string
}

export function createQueryId(): QueryId {
  return freeze({
    queryId: randomString(8),
  })
}
