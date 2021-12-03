import { freeze } from './object-utils.js'
import { ArrayItemType } from './type-utils.js'

export const LOG_LEVELS = ['query', 'error'] as const
export type LogLevel = ArrayItemType<typeof LOG_LEVELS>

export class Log {
  #levels: Readonly<Record<LogLevel, boolean>>

  constructor(levels: ReadonlyArray<LogLevel>) {
    this.#levels = freeze({
      query: levels.includes('query'),
      error: levels.includes('error'),
    })
  }

  query(getEvent: () => QueryLogEvent) {
    if (this.#levels.query) {
      this.#defaultQuery(getEvent())
    }
  }

  error(getEvent: () => ErrorLogEvent) {
    if (this.#levels.error) {
      this.#defaultError(getEvent())
    }
  }

  #defaultQuery(event: QueryLogEvent) {
    console.log(`kysely:query: ${event.sql}`)
    console.log(
      `kysely:query: duration: ${event.queryDurationMillis.toFixed(1)}ms`
    )
  }

  #defaultError(event: ErrorLogEvent) {
    if (event.error instanceof Error) {
      console.error(`kysely:error: ${event.error.stack ?? event.error.message}`)
    } else {
      console.error(`kysely:error: ${event}`)
    }
  }
}

export type LogEvent = QueryLogEvent | ErrorLogEvent

export interface QueryLogEvent {
  readonly level: 'query'
  readonly sql: string
  readonly queryDurationMillis: number
}

export interface ErrorLogEvent {
  readonly level: 'error'
  readonly error: unknown
}
