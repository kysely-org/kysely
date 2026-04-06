import {
  expectAssignable,
  expectDeprecated,
  expectNotDeprecated,
  expectType,
} from 'tsd'
import type { Database } from '../shared.js'
import type {
  ReadonlyConnectionBuilder,
  ReadonlyKysely,
  ReadonlyQueryResult,
} from '../../../dist/cjs/readonly/index.js'
import {
  createQueryId,
  DeleteQueryNode,
  type InferResult,
  SelectQueryNode,
  type Kysely,
  type KyselyTypeError,
} from '../index.js'

async function testReadonlyKysely(
  db: Kysely<Database>,
  rdb: ReadonlyKysely<Database>,
) {
  // this one ensures that we keep `ReadonlyKysely` aligned with addition/removal of props/functions.
  expectType<keyof typeof db & string>(keyof(rdb))

  expectType<
    ReadonlyKysely<
      DatabaseOf<
        ReturnType<typeof db.$extendTables<{ moshe: { haim: boolean } }>>
      >
    >
  >(rdb.$extendTables<{ moshe: { haim: boolean } }>())
  expectNotDeprecated(rdb.$extendTables)

  expectType<
    ReadonlyKysely<
      DatabaseOf<ReturnType<typeof db.$omitTables<'person_metadata'>>>
    >
  >(rdb.$omitTables<'person_metadata'>())
  expectNotDeprecated(rdb.$omitTables)

  expectType<
    ReadonlyKysely<
      DatabaseOf<ReturnType<typeof db.$pickTables<'person_metadata'>>>
    >
  >(rdb.$pickTables<'person_metadata'>())
  expectNotDeprecated(rdb.$pickTables)

  expectType<(typeof db)['case']>(rdb.case)
  expectNotDeprecated(rdb.case)

  expectType<ReadonlyConnectionBuilder<Database>>(rdb.connection())
  expectNotDeprecated(rdb.connection)
  expectType<
    (
      callback: (db: ReadonlyKysely<Database>) => Promise<{ moshe: true }>,
    ) => Promise<{ moshe: true }>
  >(rdb.connection().execute<{ moshe: true }>)
  expectNotDeprecated(rdb.connection().execute)

  expectType<NotAllowed>(rdb.deleteFrom)
  expectDeprecated(rdb.deleteFrom)

  expectType<(typeof db)['destroy']>(rdb.destroy)
  expectNotDeprecated(rdb.destroy)

  expectType<(typeof db)['dynamic']>(rdb.dynamic)
  expectNotDeprecated(rdb.dynamic)

  const compiledSelectQuery = {
    query: SelectQueryNode.create(),
    queryId: createQueryId(),
    sql: '',
    parameters: [],
  }
  const executeCompiledSelectQueryResult = await rdb.executeQuery<{
    moshe: true
  }>(compiledSelectQuery)
  expectType<ReadonlyQueryResult<{ moshe: true }>>(
    executeCompiledSelectQueryResult,
  )
  expectNotDeprecated(rdb.executeQuery<{ moshe: true }>(compiledSelectQuery))
  const selectQuery = db.selectFrom('action').selectAll()
  const executeSelectQueryResult = await rdb.executeQuery(selectQuery)
  expectType<ReadonlyQueryResult<InferResult<typeof selectQuery>[number]>>(
    executeSelectQueryResult,
  )
  expectNotDeprecated(rdb.executeQuery(selectQuery))
  expectAssignable<NotAllowed>(rdb.executeQuery)
  expectDeprecated(
    rdb.executeQuery({
      query: DeleteQueryNode.create([]),
      queryId: createQueryId(),
      sql: '',
      parameters: [],
    }),
  )
  expectType<
    keyof Awaited<ReturnType<typeof db.executeQuery<{ moshe: true }>>>
  >(keyof(executeCompiledSelectQueryResult))
  expectType<{ moshe: true }[]>(executeCompiledSelectQueryResult.rows)
  expectNotDeprecated(executeCompiledSelectQueryResult.rows)
  expectType<
    KyselyTypeError<'read-only queries do not insert anything.'> | undefined
  >(executeCompiledSelectQueryResult.insertId)
  expectDeprecated(executeCompiledSelectQueryResult.insertId)
  expectType<
    KyselyTypeError<'read-only queries do not affect any rows.'> | undefined
  >(executeCompiledSelectQueryResult.numAffectedRows)
  expectDeprecated(executeCompiledSelectQueryResult.numAffectedRows)
  expectType<
    KyselyTypeError<'read-only queries do not change any rows.'> | undefined
  >(executeCompiledSelectQueryResult.numChangedRows)
  expectDeprecated(executeCompiledSelectQueryResult.numChangedRows)

  expectType<(typeof db)['fn']>(rdb.fn)
  expectNotDeprecated(rdb.fn)

  expectType<NotAllowed>(rdb.getExecutor)
  expectDeprecated(rdb.getExecutor)

  expectType<NotAllowed>(rdb.insertInto)
  expectDeprecated(rdb.insertInto)

  expectType<(typeof db)['introspection']>(rdb.introspection)
  expectNotDeprecated(rdb.introspection)

  expectType<(typeof db)['isTransaction']>(rdb.isTransaction)
  expectNotDeprecated(rdb.isTransaction)

  expectType<NotAllowed>(rdb.mergeInto)
  expectDeprecated(rdb.mergeInto)

  expectType<NotAllowed>(rdb.replaceInto)
  expectDeprecated(rdb.replaceInto)

  expectType<KyselyTypeError<'not allowed with a read-only Kysely instance.'>>
  expectDeprecated(rdb.schema)

  expectType<(typeof db)['selectFrom']>(rdb.selectFrom)
  expectNotDeprecated(rdb.selectFrom)

  expectType<(typeof db)['selectNoFrom']>(rdb.selectNoFrom)
  expectNotDeprecated(rdb.selectNoFrom)

  // TODO: expect type
  expectNotDeprecated(rdb.startTransaction)

  // TODO: expect type
  expectNotDeprecated(rdb.transaction)

  expectType<NotAllowed>(rdb.updateTable)
  expectDeprecated(rdb.updateTable)

  // TODO: expect type
  expectNotDeprecated(rdb.with)

  expectType<typeof rdb>(rdb.withPlugin(null as never))
  expectNotDeprecated(rdb.withPlugin)

  // TODO: expect type
  expectNotDeprecated(rdb.withRecursive)

  expectType<typeof rdb>(rdb.withSchema('moshe'))
  expectNotDeprecated(rdb.withSchema)

  expectType<typeof rdb>(rdb.withoutPlugins())
  expectNotDeprecated(rdb.withoutPlugins)

  expectType<typeof rdb.$extendTables>(rdb.withTables)
  expectDeprecated(rdb.withTables)
}

type DatabaseOf<K> = K extends Kysely<infer DB> ? DB : never

declare function keyof<T>(thing: T): keyof T & string

type NotAllowed = (
  ...args: any[]
) => KyselyTypeError<'not allowed with a read-only Kysely instance.'>
