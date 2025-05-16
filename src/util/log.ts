import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { freeze, isFunction } from './object-utils.js'
import { ArrayItemType } from './type-utils.js'

const logLevels = ['query', 'error'] as const
export const LOG_LEVELS: Readonly<typeof logLevels> = freeze(logLevels)

export type LogLevel = ArrayItemType<typeof LOG_LEVELS>

export interface QueryLogEvent {
  readonly level: 'query'
  readonly isStream?: boolean
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
export type Logger = (event: LogEvent) => void | Promise<void>
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

  async query(getEvent: () => QueryLogEvent) {
    if (this.#levels.query) {
      await this.#logger(getEvent())
    }
  }

  async error(getEvent: () => ErrorLogEvent) {
    if (this.#levels.error) {
      await this.#logger(getEvent())
    }
  }
}

function defaultLogger(event: LogEvent): void {
  if (event.level === 'query') {
    const prefix = `kysely:query:${event.isStream ? 'stream:' : ''}`
    console.log(`${prefix} ${event.query.sql}`)
    console.log(`${prefix} duration: ${event.queryDurationMillis.toFixed(1)}ms`)
  } else if (event.level === 'error') {
    if (event.error instanceof Error) {
      console.error(`kysely:error: ${event.error.stack ?? event.error.message}`)
    } else {
      console.error(
        `kysely:error: ${JSON.stringify({
          error: event.error,
          query: event.query.sql,
          queryDurationMillis: event.queryDurationMillis,
        })}`,
      )
    }
  }
}
