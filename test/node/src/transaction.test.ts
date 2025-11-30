import * as sinon from 'sinon'
import { Connection, ISOLATION_LEVEL } from 'tedious'
import {
  CompiledQuery,
  MssqlDriver,
  MysqlDriver,
  PGliteDriver,
  PostgresDriver,
  SqliteDriver,
  Transaction,
  TRANSACTION_ACCESS_MODES,
} from '../../../'

import {
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  expect,
  Database,
  insertDefaultDataSet,
  DIALECTS,
} from './test-setup.js'
import { DatabaseError as PostgresError } from 'pg'
import { SqliteError } from 'better-sqlite3'

for (const dialect of DIALECTS) {
  const { sqlSpec, variant } = dialect

  describe(`${variant}: transaction`, () => {
    let ctx: TestContext
    const executedQueries: CompiledQuery[] = []
    const sandbox = sinon.createSandbox()
    let tediousBeginTransactionSpy: sinon.SinonSpy<
      Parameters<Connection['beginTransaction']>,
      ReturnType<Connection['beginTransaction']>
    >
    let tediousCommitTransactionSpy: sinon.SinonSpy<
      Parameters<Connection['commitTransaction']>,
      ReturnType<Connection['commitTransaction']>
    >

    before(async function () {
      ctx = await initTest(this, dialect, {
        log(event) {
          if (event.level === 'query') {
            executedQueries.push(event.query)
          }
        },
      })
    })

    beforeEach(async () => {
      await insertDefaultDataSet(ctx)
      executedQueries.length = 0
      tediousBeginTransactionSpy = sandbox.spy(
        Connection.prototype,
        'beginTransaction',
      )
      tediousCommitTransactionSpy = sandbox.spy(
        Connection.prototype,
        'commitTransaction',
      )
    })

    afterEach(async () => {
      await clearDatabase(ctx)
      sandbox.restore()
    })

    after(async () => {
      await destroyTest(ctx)
    })

    if (
      (sqlSpec === 'postgres' && variant !== 'pglite') ||
      sqlSpec === 'mysql' ||
      sqlSpec === 'mssql'
    ) {
      for (const isolationLevel of [
        'read uncommitted',
        'read committed',
        'repeatable read',
        'serializable',
        ...(sqlSpec === 'mssql' ? (['snapshot'] as const) : []),
      ] as const) {
        it(`should set the transaction isolation level as "${isolationLevel}"`, async () => {
          await ctx.db
            .transaction()
            .setIsolationLevel(isolationLevel)
            .execute(async (trx) => {
              await trx
                .insertInto('person')
                .values({
                  first_name: 'Foo',
                  last_name: 'Barson',
                  gender: 'male',
                })
                .execute()
            })

          if (sqlSpec === 'mssql') {
            expect(tediousBeginTransactionSpy.calledOnce).to.be.true
            expect(tediousBeginTransactionSpy.getCall(0).args[1]).to.not.be
              .undefined
            expect(tediousBeginTransactionSpy.getCall(0).args[2]).to.equal(
              ISOLATION_LEVEL[
                isolationLevel.replace(' ', '_').toUpperCase() as any
              ],
            )
            expect(tediousCommitTransactionSpy.calledOnce).to.be.true
          }

          expect(
            executedQueries.map((it) => ({
              sql: it.sql,
              parameters: it.parameters,
            })),
          ).to.eql(
            {
              postgres: [
                {
                  sql: `start transaction isolation level ${isolationLevel}`,
                  parameters: [],
                },
                {
                  sql: 'insert into "person" ("first_name", "last_name", "gender") values ($1, $2, $3)',
                  parameters: ['Foo', 'Barson', 'male'],
                },
                { sql: 'commit', parameters: [] },
              ],
              mysql: [
                {
                  sql: `set transaction isolation level ${isolationLevel}`,
                  parameters: [],
                },
                { sql: 'begin', parameters: [] },
                {
                  sql: 'insert into `person` (`first_name`, `last_name`, `gender`) values (?, ?, ?)',
                  parameters: ['Foo', 'Barson', 'male'],
                },
                { sql: 'commit', parameters: [] },
              ],
              mssql: [
                {
                  sql: 'insert into "person" ("first_name", "last_name", "gender") values (@1, @2, @3)',
                  parameters: ['Foo', 'Barson', 'male'],
                },
              ],
            }[sqlSpec],
          )
        })
      }
    }

    if (
      (sqlSpec === 'postgres' && variant !== 'pglite') ||
      sqlSpec === 'mysql'
    ) {
      for (const accessMode of TRANSACTION_ACCESS_MODES) {
        it(`should set the transaction access mode as "${accessMode}"`, async () => {
          await ctx.db
            .transaction()
            .setAccessMode(accessMode)
            .execute(async (trx) => {
              await trx.selectFrom('person').selectAll().execute()
            })

          expect(
            executedQueries.map((it) => ({
              sql: it.sql,
              parameters: it.parameters,
            })),
          ).to.eql(
            {
              postgres: [
                { sql: `start transaction ${accessMode}`, parameters: [] },
                { sql: 'select * from "person"', parameters: [] },
                { sql: 'commit', parameters: [] },
              ],
              mysql: [
                { sql: `set transaction ${accessMode}`, parameters: [] },
                { sql: 'begin', parameters: [] },
                { sql: 'select * from `person`', parameters: [] },
                { sql: 'commit', parameters: [] },
              ],
            }[sqlSpec],
          )
        })
      }
    }

    if (sqlSpec === 'postgres') {
      it('should be able to start a transaction with a single connection', async () => {
        const result = await ctx.db.connection().execute((db) => {
          return db.transaction().execute((trx) => {
            return trx
              .insertInto('person')
              .values({
                first_name: 'Foo',
                last_name: 'Barson',
                gender: 'male',
              })
              .returning('first_name')
              .executeTakeFirstOrThrow()
          })
        })

        expect(result.first_name).to.equal('Foo')
      })
    }

    it('should run multiple transactions in parallel', async () => {
      const threads = Array.from({ length: 100 }).map((_, index) => ({
        id: 1000000 + index + 1,
        fails: Math.random() < 0.5,
      }))

      const results = await Promise.allSettled(
        threads.map((thread) => executeThread(thread.id, thread.fails)),
      )

      for (let i = 0; i < threads.length; ++i) {
        const [personExists, petExists] = await Promise.all([
          doesPersonExists(threads[i].id),
          doesPetExists(threads[i].id),
        ])

        if (threads[i].fails) {
          expect(personExists).to.equal(false)
          expect(petExists).to.equal(false)
          expect(results[i].status === 'rejected')
        } else {
          expect(personExists).to.equal(true)
          expect(petExists).to.equal(true)
          expect(results[i].status === 'fulfilled')
        }
      }

      async function executeThread(id: number, fails: boolean): Promise<void> {
        await ctx.db.transaction().execute(async (trx) => {
          await insertPerson(trx, id)
          await insertPet(trx, id)

          if (fails) {
            throw new Error()
          }
        })
      }
    })

    it('should retain the full stack trace', async () => {
      try {
        await ctx.db.transaction().execute(async (trx) => {
          await trx.selectFrom('person').where('id', 'in', -1).execute()
        })

        expect.fail('Expected transaction to fail')
      } catch (error) {
        if (sqlSpec === 'sqlite') {
          expect(error).to.be.instanceOf(SqliteError)
        } else if (sqlSpec === 'postgres' && variant !== 'pglite') {
          expect(error).to.be.instanceOf(PostgresError)
        }

        expect((error as Error).stack).to.include('transaction.test.js')
      }
    })

    it('should not attempt to rollback if transaction failed to begin', async () => {
      const driverProto = {
        postgres: PostgresDriver,
        mysql: MysqlDriver,
        mssql: MssqlDriver,
        sqlite: SqliteDriver,
        pglite: PGliteDriver,
      }[variant].prototype
      const beginStub = sandbox.stub(driverProto, 'beginTransaction').throws()
      const callbackSpy = sandbox.spy()
      const rollbackSpy = sandbox.spy(driverProto, 'rollbackTransaction')

      await ctx.db
        .transaction()
        .execute(async (trx) => {
          callbackSpy()
          await trx.selectFrom('person').where('id', 'in', -1).execute()
        })
        .catch(() => {})

      expect(beginStub.called, 'begin called').to.be.true
      beginStub.restore()
      expect(callbackSpy.notCalled, 'callback not called').to.be.true
      expect(rollbackSpy.notCalled, 'rollback not called').to.be.true
    })

    async function insertPet(
      trx: Transaction<Database>,
      ownerId: number,
    ): Promise<void> {
      await trx
        .insertInto('pet')
        .values({
          name: `Pet of ${ownerId}`,
          owner_id: ownerId,
          species: 'cat',
        })
        .execute()
    }

    async function insertPerson(
      trx: Transaction<Database>,
      id: number,
    ): Promise<void> {
      const query = trx.insertInto('person').values({
        id: id,
        first_name: `Person ${id}`,
        last_name: null,
        gender: 'other',
      })

      if (sqlSpec === 'mssql') {
        const compiledQuery = query.compile()

        await trx.executeQuery(
          CompiledQuery.raw(
            `set identity_insert "person" on; ${compiledQuery.sql}; set identity_insert "person" off;`,
            [...compiledQuery.parameters],
          ),
        )
      } else {
        await query.execute()
      }
    }

    async function doesPersonExists(id: number): Promise<boolean> {
      return !!(await ctx.db
        .selectFrom('person')
        .select('id')
        .where('id', '=', id)
        .where('first_name', '=', `Person ${id}`)
        .executeTakeFirst())
    }

    async function doesPetExists(ownerId: number): Promise<boolean> {
      return !!(await ctx.db
        .selectFrom('pet')
        .select('id')
        .where('owner_id', '=', ownerId)
        .where('name', '=', `Pet of ${ownerId}`)
        .executeTakeFirst())
    }
  })
}
