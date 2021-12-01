import { ArrayItemType } from './type-utils.js'

export const LOG_LEVELS = ['query'] as const
export type LogLevel = ArrayItemType<typeof LOG_LEVELS>

export class Log {
  #levels: Readonly<Record<LogLevel, boolean>>

  constructor(levels: ReadonlyArray<LogLevel>) {
    this.#levels = {
      query: levels.includes('query'),
    }
  }

  query(callback: (log: (message: string) => void) => void) {
    if (this.#levels.query) {
      callback(this.#query)
    }
  }

  #query(message: string) {
    console.log(`kysely:query: ${message}`)
  }
}
