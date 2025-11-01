import { ConnectionProvider } from '../driver/connection-provider.js'
import {
  DatabaseConnection,
  QueryResult,
} from '../driver/database-connection.js'
import { CompiledQuery } from '../query-compiler/compiled-query.js'
import { RootOperationNode } from '../query-compiler/query-compiler.js'
import { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { freeze } from '../util/object-utils.js'
import { QueryId } from '../util/query-id.js'
import { DialectAdapter } from '../dialect/dialect-adapter.js'
import { QueryExecutor } from './query-executor.js'
import { provideControlledConnection } from '../util/provide-controlled-connection.js'
import {
  AbortableOperationOptions,
  assertNotAborted,
  throwReasonWithTiming,
} from '../util/abort.js'
import { Deferred } from '../util/deferred.js'
import { logOnce } from '../util/log-once.js'

const NO_PLUGINS: ReadonlyArray<KyselyPlugin> = freeze([])

export abstract class QueryExecutorBase implements QueryExecutor {
  readonly #plugins: ReadonlyArray<KyselyPlugin>

  constructor(plugins: ReadonlyArray<KyselyPlugin> = NO_PLUGINS) {
    this.#plugins = plugins
  }

  abstract get adapter(): DialectAdapter

  get plugins(): ReadonlyArray<KyselyPlugin> {
    return this.#plugins
  }

  transformQuery<T extends RootOperationNode>(node: T, queryId: QueryId): T {
    for (const plugin of this.#plugins) {
      const transformedNode = plugin.transformQuery({ node, queryId })

      // We need to do a runtime check here. There is no good way
      // to write types that enforce this constraint.
      if (transformedNode.kind === node.kind) {
        node = transformedNode as T
      } else {
        throw new Error(
          [
            `KyselyPlugin.transformQuery must return a node`,
            `of the same kind that was given to it.`,
            `The plugin was given a ${node.kind}`,
            `but it returned a ${transformedNode.kind}`,
          ].join(' '),
        )
      }
    }

    return node
  }

  abstract compileQuery(
    node: RootOperationNode,
    queryId: QueryId,
  ): CompiledQuery

  abstract provideConnection<T>(
    consumer: (
      connection: DatabaseConnection,
      options?: AbortableOperationOptions,
    ) => Promise<T>,
    options?: AbortableOperationOptions,
  ): Promise<T>

  async executeQuery<R>(
    compiledQuery: CompiledQuery,
    options?: AbortableOperationOptions,
  ): Promise<QueryResult<R>> {
    const { signal } = options || {}

    if (!signal) {
      return await this.provideConnection(async (connection) => {
        const result = await connection.executeQuery(compiledQuery, options)

        return await this.#transformResult<R>(
          result,
          compiledQuery.queryId,
          options,
        )
      }, options)
    }

    assertNotAborted(signal, 'before query execution')

    const { connection, release } = await provideControlledConnection(
      this,
      options,
    )

    if (!connection.cancelQuery) {
      logOnce(
        'This kysely dialect does not implement the `cancelQuery` method. This means queries will not be cancelled on the database side when the `signal` is aborted.',
      )
    }

    const { promise: abortPromise, resolve } = new Deferred<void>()

    signal.addEventListener('abort', () => resolve(), { once: true })

    try {
      assertNotAborted(signal, 'before query execution')

      const queryPromise = connection.executeQuery(compiledQuery, options)

      const result = await Promise.race([abortPromise, queryPromise])

      // aborted.
      if (!result) {
        void Promise.allSettled([
          queryPromise,
          connection.cancelQuery?.(this.provideConnection.bind(this)),
        ])

        throwReasonWithTiming(signal.reason, 'during query execution')
      }

      const transformPromise = this.#transformResult<R>(
        result,
        compiledQuery.queryId,
        options,
      )

      const transformedResult = await Promise.race([
        abortPromise,
        transformPromise,
      ])

      // aborted.
      if (!transformedResult) {
        transformPromise.catch(() => {
          // noop
        })

        throwReasonWithTiming(signal.reason, 'during result transformation')
      }

      return transformedResult
    } finally {
      release()
      resolve()
    }
  }

  async *stream<R>(
    compiledQuery: CompiledQuery,
    chunkSize: number,
    options?: AbortableOperationOptions,
  ): AsyncIterableIterator<QueryResult<R>> {
    const { signal } = options || {}

    if (!signal) {
      const { connection, release } = await provideControlledConnection(this)

      try {
        for await (const result of connection.streamQuery(
          compiledQuery,
          chunkSize,
        )) {
          yield await this.#transformResult<R>(
            result,
            compiledQuery.queryId,
            options,
          )
        }
      } finally {
        release()
      }

      return
    }

    assertNotAborted(signal, 'before connection acquisition')

    const { connection, release } = await provideControlledConnection(this)

    const { promise: abortPromise, resolve } = new Deferred<void>()

    signal.addEventListener('abort', () => resolve(), { once: true })

    let asyncIterator: AsyncIterableIterator<QueryResult<R>> | undefined

    try {
      assertNotAborted(signal, 'before query streaming')

      asyncIterator = connection.streamQuery(compiledQuery, chunkSize, options)

      const { queryId } = compiledQuery
      const controlConnectionProvider = this.provideConnection.bind(this)

      while (true) {
        assertNotAborted(signal, 'during query streaming')

        const nextPromise = asyncIterator.next()

        const result = await Promise.race([abortPromise, nextPromise])

        // aborted.
        if (!result) {
          void Promise.allSettled([
            nextPromise,
            connection.cancelQuery?.(controlConnectionProvider),
          ])

          throwReasonWithTiming(signal.reason, 'during query streaming')
        }

        if (result.done) {
          break
        }

        const transformPromise = this.#transformResult<R>(
          result.value,
          queryId,
          options,
        )

        const transformedResult = await Promise.race([
          abortPromise,
          transformPromise,
        ])

        // aborted.
        if (!transformedResult) {
          void Promise.allSettled([
            transformPromise,
            connection.cancelQuery?.(controlConnectionProvider),
          ])

          throwReasonWithTiming(signal.reason, 'during result transformation')
        }

        yield transformedResult
      }
    } finally {
      release()
      resolve()
      await asyncIterator?.return?.()
    }
  }

  abstract withConnectionProvider(
    connectionProvider: ConnectionProvider,
  ): QueryExecutorBase

  abstract withPlugin(plugin: KyselyPlugin): QueryExecutorBase
  abstract withPlugins(plugin: ReadonlyArray<KyselyPlugin>): QueryExecutorBase
  abstract withPluginAtFront(plugin: KyselyPlugin): QueryExecutorBase
  abstract withoutPlugins(): QueryExecutorBase

  async #transformResult<T>(
    result: QueryResult<any>,
    queryId: QueryId,
    options: AbortableOperationOptions | undefined,
  ): Promise<QueryResult<T>> {
    for (const plugin of this.#plugins) {
      result = await plugin.transformResult({ ...options, result, queryId })
    }

    return result
  }
}
