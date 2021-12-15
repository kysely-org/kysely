import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { freeze, isFunction } from './object-utils.js'
import { ArrayItemType } from './type-utils.js'

export const LOG_LEVELS = freeze(['query', 'error'] as const)

export type LogLevel = ArrayItemType<typeof LOG_LEVELS>

export interface QueryLogEvent {
  readonly level: 'query'
  readonly query: CompiledQuery
  readonly queryDurationMillis: number
}

export interface ErrorLogEvent {
  readonly level: 'error'
  readonly error: unknown
}

export type LogEvent = QueryLogEvent | ErrorLogEvent
export type LogConfig = ReadonlyArray<LogLevel> | ((event: LogEvent) => void)

export class Log {
  readonly #levels: Readonly<Record<LogLevel, boolean>>
  readonly #logger?: (event: LogEvent) => void

  constructor(config: LogConfig) {
    if (isFunction(config)) {
      this.#logger = config
      this.#levels = freeze({
        query: true,
        error: true,
      })
    } else {
      this.#levels = freeze({
        query: config.includes('query'),
        error: config.includes('error'),
      })
    }
  }

  query(getEvent: () => QueryLogEvent) {
    if (this.#levels.query) {
      if (this.#logger) {
        this.#logger(getEvent())
      } else {
        this.#defaultQuery(getEvent())
      }
    }
  }

  error(getEvent: () => ErrorLogEvent) {
    if (this.#levels.error) {
      if (this.#logger) {
        this.#logger(getEvent())
      } else {
        this.#defaultError(getEvent())
      }
    }
  }

  #defaultQuery(event: QueryLogEvent) {
    console.log(`kysely:query: ${event.query.sql}`)
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
