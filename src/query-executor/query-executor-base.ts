import type { ConnectionProvider } from '../driver/connection-provider.js'
import type {
  DatabaseConnection,
  QueryResult,
} from '../driver/database-connection.js'
import type { CompiledQuery } from '../query-compiler/compiled-query.js'
import type { KyselyPlugin } from '../plugin/kysely-plugin.js'
import { freeze } from '../util/object-utils.js'
import type { QueryId } from '../util/query-id.js'
import type { DialectAdapter } from '../dialect/dialect-adapter.js'
import type { QueryExecutor } from './query-executor.js'
import { provideControlledConnection } from '../util/provide-controlled-connection.js'
import {
  type AbortableOperationOptions,
  type AbortableQueryOptions,
  ABORTED,
  assertNotAborted,
  getInflightQueryAbortHandler,
  printBackgroundFail,
  throwReasonWithTiming,
} from '../util/abort.js'
import { Deferred } from '../util/deferred.js'
import type { RootOperationNode } from '../operation-node/root-operation-node.js'

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
    consumer: (connection: DatabaseConnection) => Promise<T>,
    options?: AbortableOperationOptions,
  ): Promise<T>

  async executeQuery<R>(
    compiledQuery: CompiledQuery,
    options?: AbortableQueryOptions,
  ): Promise<QueryResult<R>> {
    const { inflightQueryAbortStrategy = 'ignore query', signal } =
      options || {}

    // intentionally isolating the simple common case from the new cancellation flow.
    if (!signal) {
      const result = await this.provideConnection(async (connection) => {
        return await connection.executeQuery(compiledQuery)
      }, options)

      return await this.#transformResult<R>(result, compiledQuery.queryId)
    }

    assertNotAborted(signal, 'before query execution')

    options = freeze({ signal })

    const { connection, release } = await provideControlledConnection(
      this,
      options,
    )

    const controlConnectionProvider = this.provideConnection.bind(this)
    const { promise: abortPromise, resolve } = new Deferred<typeof ABORTED>()

    const abortListener = () => resolve(ABORTED)
    signal.addEventListener('abort', abortListener, { once: true })

    try {
      assertNotAborted(signal, 'before query execution', release)

      const inflightQueryAbortHandler = getInflightQueryAbortHandler(
        inflightQueryAbortStrategy,
        connection,
        release,
      )

      if (inflightQueryAbortHandler && connection.collectSessionInfo) {
        assertNotAborted(signal, 'before query execution', release)

        const collectPromise = connection.collectSessionInfo()

        const result = await Promise.race([abortPromise, collectPromise]).catch(
          (error) => {
            release()
            throw error
          },
        )

        if (result === ABORTED) {
          void collectPromise
            .catch(printBackgroundFail('collectSessionInfo'))
            .finally(release)

          throwReasonWithTiming(signal.reason, 'before query execution')
        }
      }

      const queryPromise = connection.executeQuery(compiledQuery, options)

      const result = await Promise.race([abortPromise, queryPromise])
        // only the query can error. in that case, we want to release immediately.
        .catch((error) => {
          release()
          throw error
        })

      if (result === ABORTED) {
        void Promise.allSettled([
          queryPromise.catch(printBackgroundFail('query')),
          inflightQueryAbortHandler?.(controlConnectionProvider).catch(
            printBackgroundFail('inflightQueryAbortHandler'),
          ),
        ])
          // the abort handler might use the same connection that runs the query.
          .finally(release)

        throwReasonWithTiming(signal.reason, 'during query execution')
      } else {
        release()
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

      if (transformedResult === ABORTED) {
        transformPromise.catch(printBackgroundFail('plugins.transformResult'))

        throwReasonWithTiming(signal.reason, 'during result transformation')
      }

      return transformedResult
    } finally {
      resolve(ABORTED)
      signal.removeEventListener('abort', abortListener)
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

    options = freeze({ signal })

    assertNotAborted(signal, 'before connection acquisition')

    const { connection, release } = await provideControlledConnection(
      this,
      options,
    )

    const { promise: abortPromise, resolve } = new Deferred<typeof ABORTED>()

    const abortListener = () => resolve(ABORTED)
    signal.addEventListener('abort', abortListener, { once: true })

    let asyncIterator: AsyncIterableIterator<QueryResult<R>> | undefined
    let releasePrerequisite: Promise<unknown> | undefined

    assertNotAborted(signal, 'before query streaming', release)

    const { queryId } = compiledQuery

    try {
      asyncIterator = connection.streamQuery(compiledQuery, chunkSize, options)

      while (true) {
        assertNotAborted(signal, 'during query streaming')

        const nextPromise = asyncIterator.next()

        const result = await Promise.race([abortPromise, nextPromise])

        if (result === ABORTED) {
          releasePrerequisite = nextPromise.catch(
            printBackgroundFail('iterator.next'),
          )

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

        if (transformedResult === ABORTED) {
          releasePrerequisite = transformPromise.catch(
            printBackgroundFail('plugins.transformResult'),
          )

          throwReasonWithTiming(signal.reason, 'during result transformation')
        }

        yield transformedResult
      }
    } finally {
      resolve(ABORTED)
      signal.removeEventListener('abort', abortListener)

      const cleanup = (asyncIterator?.return?.() || Promise.resolve())
        .finally(() => releasePrerequisite)
        .finally(release)

      if (!releasePrerequisite) {
        await cleanup
      }
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
    options?: AbortableOperationOptions | undefined,
  ): Promise<QueryResult<T>> {
    const { signal } = options || {}

    for (const plugin of this.#plugins) {
      result = await plugin.transformResult(freeze({ queryId, result, signal }))
    }

    return result
  }
}
