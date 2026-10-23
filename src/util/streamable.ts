import type { AbortableOperationOptions } from './abort.js'

export interface Streamable<O> {
  /**
   * Executes the query and streams the rows.
   *
   * The optional argument `chunkSize` defines how many rows to fetch from the database
   * at a time. It only affects some dialects like PostgreSQL that support it.
   *
   * You can pass an options object to set both `chunkSize` and an abort signal.
   * Streaming doesn't accept `inflightQueryAbortStrategy`.
   *
   * ### Examples
   *
   * ```ts
   * const stream = db
   *   .selectFrom('person')
   *   .select(['first_name', 'last_name'])
   *   .where('gender', '=', 'other')
   *   .stream()
   *
   * for await (const person of stream) {
   *   console.log(person.first_name)
   *
   *   if (person.last_name === 'Something') {
   *     // Breaking or returning before the stream has ended will release
   *     // the database connection and invalidate the stream.
   *     break
   *   }
   * }
   * ```
   *
   * Stop consuming rows when a timeout expires:
   *
   * ```ts
   * for await (const person of db
   *   .selectFrom('person')
   *   .selectAll()
   *   .stream({ chunkSize: 100, signal: AbortSignal.timeout(1000) })) {
   *   console.log(person.id)
   * }
   * ```
   */
  stream(
    chunkSizeOrOptions?: StreamOptions | StreamOptions['chunkSize'],
  ): AsyncIterableIterator<O>
}

export interface StreamOptions extends AbortableOperationOptions {
  /**
   * How many rows should be pulled from the database at once.
   *
   * Supported only by some dialects like PostgreSQL.
   */
  chunkSize?: number
}
