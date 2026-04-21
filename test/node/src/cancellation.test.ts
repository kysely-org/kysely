import { setTimeout } from 'node:timers/promises'
import { expect } from 'chai'
import {
  type InsertQueryBuilder,
  type RawBuilder,
  sql,
} from '../../../dist/index.js'
import {
  clearDatabase,
  destroyTest,
  DIALECTS,
  initTest,
  insertDefaultDataSet,
  PG_ERRORS,
  type Database,
  type TestContext,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  const { sqlSpec, variant } = dialect

  describe(`${variant}: query cancellation`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    beforeEach(async () => {
      await insertDefaultDataSet(ctx)
    })

    afterEach(async () => {
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    function getLongRunningWriteQuery(
      sqlSpec: Exclude<(typeof dialect)['sqlSpec'], 'sqlite'>,
    ) {
      return (
        {
          postgres: sql`with delayed as (select pg_sleep(0.1)) insert into person (gender) select 'woah' from delayed;`,
          mysql: sql`insert into person (gender) select 'woah' from (select sleep(0.1)) as t;`,
          mssql: sql`waitfor delay '00:00:00.100'; insert into person (gender) values ('woah');`,
        } as const satisfies Record<typeof sqlSpec, RawBuilder<any>>
      )[sqlSpec]
    }

    it('should execute queries normally when not aborted', async () => {
      await expect(
        ctx.db.selectFrom('person').selectAll().executeTakeFirstOrThrow({
          signal: new AbortController().signal,
        }),
      ).to.not.be.eventually.rejected
    })

    it('should throw an abort error when aborted before query execution', async () => {
      const reason = new Error("rip d'angelo")

      await expect(
        ctx.db
          .selectFrom('person')
          .selectAll()
          .executeTakeFirstOrThrow({ signal: AbortSignal.abort(reason) }),
      )
        .to.eventually.be.rejectedWith(reason)
        .and.satisfies((error: { __kysely_timing__: string }) => {
          expect(error.__kysely_timing__).to.equal('before query execution')
          return true
        })
    })

    if (variant === 'mssql' || variant === 'mysql' || variant === 'postgres') {
      it('should throw an abort error when aborted during query execution', async () => {
        await expect(
          getLongRunningWriteQuery(sqlSpec).execute(ctx.db, {
            signal: AbortSignal.timeout(10),
          }),
        )
          .to.eventually.be.rejectedWith(DOMException)
          .and.satisfies(
            (error: DOMException & { __kysely_timing__: string }) => {
              expect(error.name).to.equal('TimeoutError')
              expect(error.__kysely_timing__).to.equal('during query execution')
              return true
            },
          )

        await setTimeout(250)
        await expect(
          ctx.db
            .selectFrom('person')
            .where('gender', '=', 'woah' as never)
            .select(ctx.db.fn.countAll().as('count'))
            .executeTakeFirstOrThrow(),
        ).to.eventually.satisfy((result: { count: unknown }) =>
          expect(Number(result.count)).to.equal(1),
        )
      })
    }

    if (variant === 'postgres' || variant === 'mysql') {
      it("should cancel query on database side when inflightQueryAbortStrategy is 'cancel query'", async () => {
        await expect(
          getLongRunningWriteQuery(sqlSpec).execute(ctx.db, {
            inflightQueryAbortStrategy: 'cancel query',
            signal: AbortSignal.timeout(10),
          }),
        )
          .to.eventually.be.rejectedWith(DOMException)
          .and.satisfies(
            (error: DOMException & { __kysely_timing__: string }) => {
              expect(error.name).to.equal('TimeoutError')
              expect(error.__kysely_timing__).to.equal('during query execution')
              return true
            },
          )

        await setTimeout(250)
        await expect(
          ctx.db
            .selectFrom('person')
            .where('gender', '=', 'woah' as never)
            .select(ctx.db.fn.countAll().as('count'))
            .executeTakeFirstOrThrow(),
        ).to.eventually.satisfy((result: { count: unknown }) =>
          expect(Number(result.count)).to.equal(0),
        )
      })

      it("should kill session on database side when inflightQueryAbortStrategy is 'kill session'", async () => {
        await expect(
          getLongRunningWriteQuery(sqlSpec).execute(ctx.db, {
            inflightQueryAbortStrategy: 'kill session',
            signal: AbortSignal.timeout(10),
          }),
        )
          .to.eventually.be.rejectedWith(DOMException)
          .and.satisfies(
            (error: DOMException & { __kysely_timing__: string }) => {
              expect(error.name).to.equal('TimeoutError')
              expect(error.__kysely_timing__).to.equal('during query execution')
              return true
            },
          )

        await setTimeout(250)
        await expect(
          ctx.db
            .selectFrom('person')
            .where('gender', '=', 'woah' as never)
            .select(ctx.db.fn.countAll().as('count'))
            .executeTakeFirstOrThrow(),
        ).to.eventually.satisfy((result: { count: unknown }) =>
          expect(Number(result.count)).to.equal(0),
        )

        if (variant === 'postgres') {
          expect(PG_ERRORS.at(-1)?.message).to.equal(
            'Connection terminated unexpectedly',
          )
        }
      })
    }

    it('should throw an abort error when aborted during result transformation', async () => {
      const abortController = new AbortController()

      const reason = new Error('i like trains')

      await expect(
        ctx.db
          .selectFrom('person')
          .selectAll()
          .withPlugin({
            transformQuery: (args) => args.node,
            transformResult: async (result) => {
              abortController.abort(reason)
              return result.result
            },
          })
          .executeTakeFirstOrThrow({ signal: abortController.signal }),
      )
        .to.eventually.be.rejectedWith(reason)
        .and.satisfies((error: { __kysely_timing__: string }) => {
          expect(error.__kysely_timing__).to.equal(
            'during result transformation',
          )
          return true
        })
    })

    // mssql hangs on abort because `cancelQuery` is not yet implemented in the database connection.
    // pglite doesn't support streaming.
    if (variant !== 'mssql' && variant !== 'pglite') {
      it('should stream queries normally when not aborted', async () => {
        const abortController = new AbortController()

        await expect(
          (async () => {
            for await (const _ of ctx.db
              .selectFrom('person')
              .selectAll()
              .stream({ signal: abortController.signal, chunkSize: 1 })) {
              // noop
            }
          })(),
        ).to.not.be.eventually.rejected
      })

      it('should throw an abort error when streaming is aborted before query execution', async () => {
        const reason = new Error('top of the morning!')

        await expect(
          (async () => {
            for await (const _ of ctx.db
              .selectFrom('person')
              .selectAll()
              .stream({ signal: AbortSignal.abort(reason), chunkSize: 1 })) {
              // noop
            }
          })(),
        )
          .to.eventually.be.rejectedWith(reason)
          .and.satisfies((error: { __kysely_timing__: string }) => {
            expect(error.__kysely_timing__).to.equal(
              'before connection acquisition',
            )
            return true
          })
      })

      it('should throw an abort error when streaming is aborted during query execution', async () => {
        const abortController = new AbortController()

        const reason = new Error('ani kaki metumtam')

        await expect(
          (async () => {
            for await (const _ of ctx.db
              .selectFrom('person')
              .selectAll()
              .stream({ signal: abortController.signal, chunkSize: 1 })) {
              abortController.abort(reason)
            }
          })(),
        )
          .to.eventually.be.rejectedWith(reason)
          .and.satisfies((error: { __kysely_timing__: string }) => {
            expect(error.__kysely_timing__).to.equal('during query streaming')
            return true
          })
      })

      it('should throw an abort error when streaming is aborted during result transformation', async () => {
        const abortController = new AbortController()

        const reason = new Error('spaghetti and meat balls')

        await expect(
          (async () => {
            for await (const _ of ctx.db
              .selectFrom('person')
              .selectAll()
              .withPlugin({
                transformQuery: (args) => args.node,
                transformResult: async (result) => {
                  abortController.abort(reason)
                  return result.result
                },
              })
              .stream({
                signal: abortController.signal,
                chunkSize: 1,
              })) {
              // noop
            }
          })(),
        )
          .to.eventually.be.rejectedWith(reason)
          .and.satisfies((error: { __kysely_timing__: string }) => {
            expect(error.__kysely_timing__).to.equal(
              'during result transformation',
            )
            return true
          })
      })
    }
  })
}
