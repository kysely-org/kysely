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
  readonly query: CompiledQuery
  readonly queryDurationMillis: number
}

export type LogEvent = QueryLogEvent | ErrorLogEvent
export type Logger = (event: LogEvent) => void
export type LogConfig = ReadonlyArray<LogLevel> | Logger

export class Log {
  readonly #levels: Readonly<Record<LogLevel, boolean>>
  readonly #logger: Logger

  constructor(config: LogConfig) {
    if (isFunction(config)) {
      this.#logger = config

      this.#levels = freeze({
        query: true,
        error: true,
      })
    } else {
      this.#logger = defaultLogger

      this.#levels = freeze({
        query: config.includes('query'),
        error: config.includes('error'),
      })
    }
  }

  isLevelEnabled(level: LogLevel): boolean {
    return this.#levels[level]
  }

  query(getEvent: () => QueryLogEvent) {
    if (this.#levels.query) {
      this.#logger(getEvent())
    }
  }

  error(getEvent: () => ErrorLogEvent) {
    if (this.#levels.error) {
      this.#logger(getEvent())
    }
  }
}

function defaultLogger(event: LogEvent): void {
  if (event.level === 'query') {
    console.log(`kysely:query: ${event.query.sql}`)
    console.log(
      `kysely:query: duration: ${event.queryDurationMillis.toFixed(1)}ms`
    )
  } else if (event.level === 'error') {
    if (event.error instanceof Error) {
      console.error(`kysely:error: ${event.error.stack ?? event.error.message}`)
    } else {
      console.error(`kysely:error: ${event}`)
    }
  }
}
