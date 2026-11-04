import Sqlite, { SqliteError } from 'better-sqlite3'
import { setImmediate } from 'node:timers/promises'
import * as sinon from 'sinon'
import {
  AbortedTransactionError,
  type ControlledTransaction,
  type Driver,
  Kysely,
  SqliteDialect,
  type Transaction,
  sql,
} from '../../../dist/index.js'
import { Deferred } from '../../../dist/util/deferred.js'
import { DIALECTS, expect } from './test-setup.js'

interface Database {
  item: { id: number }
}

if (DIALECTS.some(({ variant }) => variant === 'sqlite')) {
  describe('sqlite: automatic transaction rollback', () => {
    const sandbox = sinon.createSandbox()
    let sqlite: Sqlite.Database
    let db: Kysely<Database>
    let driver: Driver
    let trx: ControlledTransaction<Database> | undefined
    let statements: string[]
    let loggedError: unknown
    let pauseErrors: boolean
    let errorLogged: Deferred<void>
    let continueLogging: Deferred<void>

    beforeEach(async () => {
      statements = []
      loggedError = undefined
      pauseErrors = false
      errorLogged = new Deferred<void>()
      continueLogging = new Deferred<void>()
      trx = undefined
      sqlite = new Sqlite(':memory:', {
        verbose: (statement) => statements.push(String(statement)),
      })
      const dialect = new SqliteDialect({ database: sqlite })
      driver = dialect.createDriver()
      sandbox.stub(dialect, 'createDriver').returns(driver)
      db = new Kysely<Database>({
        dialect,
        async log(event) {
          if (event.level === 'error') {
            loggedError = event.error
            errorLogged.resolve()

            if (pauseErrors) {
              await continueLogging.promise
            }
          }
        },
      })
      await sql`create table item (id integer primary key)`.execute(db)
    })

    afterEach(async () => {
      continueLogging.resolve()
      if (trx && !trx.isCommitted && !trx.isRolledBack) {
        await trx
          .rollback()
          .execute()
          .catch(() => {})
      }
      await db.destroy()
      sandbox.restore()
    })

    async function startTransaction() {
      trx = await db.startTransaction().execute()
      await trx.insertInto('item').values({ id: 1 }).execute()
      return trx
    }

    for (const returning of [false, true]) {
      for (const abortable of [false, true]) {
        it(`should finalize an automatic rollback${returning ? ' with returning' : ''}${abortable ? ' with an abort signal' : ''}`, async () => {
          const transaction = await startTransaction()
          const derivedTrx = await transaction
            .savepoint('before_error')
            .execute()
          const savedQuery = derivedTrx.insertInto('item').values({ id: 2 })
          const savedCommands = [
            derivedTrx.commit(),
            derivedTrx.savepoint('after_error'),
            derivedTrx.rollbackToSavepoint('before_error'),
            derivedTrx.releaseSavepoint('before_error'),
          ]
          const releaseSpy = sandbox.spy(driver, 'releaseConnection')
          const query = derivedTrx
            .insertInto('item')
            .values({ id: 1 })
            .orRollback()
          const error: unknown = await (
            returning ? query.returning('id') : query
          )
            .execute(
              abortable ? { signal: new AbortController().signal } : undefined,
            )
            .catch((error: unknown) => error)

          expect(error).to.be.instanceOf(SqliteError)
          expect(error).to.equal(loggedError)
          expect(error).to.have.property('code', 'SQLITE_CONSTRAINT_PRIMARYKEY')
          expect(sqlite.inTransaction).to.be.false
          expect(transaction.isCommitted).to.be.false
          expect(transaction.isRolledBack).to.be.true
          expect(derivedTrx.isRolledBack).to.be.true

          const statementsBeforeCleanup = [...statements]
          await expect(savedQuery.execute()).to.be.rejectedWith(
            'Transaction is already rolled back',
          )
          for (const command of savedCommands) {
            await expect(command.execute()).to.be.rejectedWith(
              'Transaction is already rolled back',
            )
          }
          await derivedTrx.rollback().execute()
          await transaction.rollback().execute()
          await setImmediate()
          expect(releaseSpy.calledOnce).to.be.true
          expect(statements).to.eql(statementsBeforeCleanup)

          const nextTransaction = await db.startTransaction().execute()
          await nextTransaction.insertInto('item').values({ id: 2 }).execute()
          await nextTransaction.commit().execute()
          await expect(
            transaction.selectFrom('item').selectAll().execute(),
          ).to.be.rejectedWith('Transaction is already rolled back')
          expect(await db.selectFrom('item').selectAll().execute()).to.eql([
            { id: 2 },
          ])
        })
      }
    }

    for (const abortable of [false, true]) {
      it(`should block queued queries until the aborted state is finalized${abortable ? ' after cancellation' : ''}`, async () => {
        const transaction = await startTransaction()
        const releaseSpy = sandbox.spy(driver, 'releaseConnection')
        const controller = new AbortController()
        const abortError = new Error('request aborted')
        pauseErrors = true
        const failure = transaction
          .insertInto('item')
          .values({ id: 1 })
          .orRollback()
          .execute(abortable ? { signal: controller.signal } : undefined)
          .catch((error: unknown) => error)
        await errorLogged.promise
        expect(sqlite.inTransaction).to.be.false

        if (abortable) {
          // The caller can stop waiting while the connection is still held.
          const errorSpy = sandbox.stub(console, 'error')
          controller.abort(abortError)
          expect(await failure).to.equal(abortError)
          expect(errorSpy.notCalled).to.be.true
        }

        const statementsBeforeFinalizing = [...statements]
        const queuedQueries = [
          expect(
            transaction.insertInto('item').values({ id: 3 }).execute(),
          ).to.be.rejectedWith('Transaction is already rolled back'),
          expect(
            transaction
              .selectFrom('item')
              .selectAll()
              .execute({ signal: new AbortController().signal }),
          ).to.be.rejectedWith('Transaction is already rolled back'),
          expect(
            transaction.selectFrom('item').selectAll().stream().next(),
          ).to.be.rejectedWith('Transaction is already rolled back'),
          expect(transaction.commit().execute()).to.be.rejectedWith(
            'Transaction is already rolled back',
          ),
        ]
        const cleanup = transaction.rollback().execute()
        let connectionReused = false
        const outsideQuery = db
          .insertInto('item')
          .values({ id: 2 })
          .execute()
          .then(() => {
            connectionReused = true
            expect(transaction.isRolledBack).to.be.true
          })

        await setImmediate()
        expect(statements).to.eql(statementsBeforeFinalizing)
        expect(connectionReused).to.be.false
        expect(releaseSpy.notCalled).to.be.true

        continueLogging.resolve()
        if (!abortable) {
          expect(await failure).to.equal(loggedError)
        }
        await Promise.all([...queuedQueries, cleanup, outsideQuery])
        expect(transaction.isRolledBack).to.be.true
        expect(await db.selectFrom('item').selectAll().execute()).to.eql([
          { id: 2 },
        ])
        expect(statements).to.not.include('commit')
        expect(statements).to.not.include('rollback')
      })
    }

    for (const caught of [false, true]) {
      it(`should handle an automatic rollback in a callback transaction with a${caught ? ' caught' : 'n uncaught'} error`, async () => {
        let escapedTrx: Transaction<Database> | undefined
        let originalError: unknown
        const releaseSpy = sandbox.spy(driver, 'releaseConnection')

        const error: unknown = await db
          .transaction()
          .execute(async (transaction) => {
            escapedTrx = transaction
            await transaction.insertInto('item').values({ id: 1 }).execute()
            try {
              await transaction
                .insertInto('item')
                .values({ id: 1 })
                .orRollback()
                .execute()
            } catch (error) {
              originalError = error
              if (!caught) {
                throw error
              }
            }
            await expect(
              transaction.insertInto('item').values({ id: 2 }).execute(),
            ).to.be.rejectedWith('Transaction is already rolled back')
            return 'success'
          })
          .catch((error: unknown) => error)

        expect(originalError).to.be.instanceOf(SqliteError)
        expect(originalError).to.equal(loggedError)
        if (caught) {
          expect(error).to.be.instanceOf(AbortedTransactionError)
        } else {
          expect(error).to.equal(originalError)
        }
        await expect(
          escapedTrx!.selectFrom('item').selectAll().execute(),
        ).to.be.rejectedWith('Transaction is already rolled back')
        expect(releaseSpy.calledOnce).to.be.true
        expect(statements).to.not.include('commit')
        expect(statements).to.not.include('rollback')
        expect(await db.selectFrom('item').selectAll().execute()).to.eql([])
      })

      it(`should hold a callback transaction's connection after a${caught ? ' caught' : 'n uncaught'} cancellation until rollback detection finishes`, async () => {
        const controller = new AbortController()
        const abortError = new Error('request aborted')
        const releaseSpy = sandbox.spy(driver, 'releaseConnection')
        sandbox.stub(console, 'error')
        pauseErrors = true
        let transactionSettled = false
        const execution = db
          .transaction()
          .execute(async (transaction) => {
            await transaction.insertInto('item').values({ id: 1 }).execute()
            try {
              await transaction
                .insertInto('item')
                .values({ id: 1 })
                .orRollback()
                .execute({ signal: controller.signal })
            } catch (error) {
              expect(error).to.equal(abortError)
              if (!caught) {
                throw error
              }
            }
          })
          .catch((error: unknown) => error)
          .finally(() => {
            transactionSettled = true
          })

        await errorLogged.promise
        controller.abort(abortError)
        const statementsBeforeFinalizing = [...statements]
        const outsideQuery = db.insertInto('item').values({ id: 2 }).execute()
        await setImmediate()
        expect(transactionSettled).to.be.false
        expect(releaseSpy.notCalled).to.be.true
        expect(statements).to.eql(statementsBeforeFinalizing)

        continueLogging.resolve()
        const error = await execution
        if (caught) {
          expect(error).to.be.instanceOf(Error)
          expect((error as Error).message).to.include('rolled back')
        } else {
          expect(error).to.equal(abortError)
        }
        await outsideQuery
        expect(statements).to.not.include('commit')
        expect(statements).to.not.include('rollback')
        expect(await db.selectFrom('item').selectAll().execute()).to.eql([
          { id: 2 },
        ])
      })
    }

    it('should keep a transaction active after an ordinary constraint violation', async () => {
      const transaction = await startTransaction()
      const savedTrx = await transaction.savepoint('before_error').execute()

      await expect(
        savedTrx.insertInto('item').values({ id: 1 }).execute(),
      ).to.be.rejectedWith(SqliteError)
      expect(sqlite.inTransaction).to.be.true
      expect(transaction.isRolledBack).to.be.false
      await savedTrx.rollbackToSavepoint('before_error').execute()
      await transaction.insertInto('item').values({ id: 2 }).execute()
      await transaction.commit().execute()

      expect(transaction.isCommitted).to.be.true
      expect(
        await db.selectFrom('item').selectAll().orderBy('id').execute(),
      ).to.eql([{ id: 1 }, { id: 2 }])
    })

    it('should support SQLite database wrappers without transaction state reporting', async () => {
      await db.destroy()
      sqlite = new Sqlite(':memory:')
      db = new Kysely<Database>({
        dialect: new SqliteDialect({
          database: {
            close: () => sqlite.close(),
            prepare: (query) => sqlite.prepare(query),
          },
        }),
      })
      await sql`create table item (id integer primary key)`.execute(db)
      const transaction = await startTransaction()

      await expect(
        transaction.insertInto('item').values({ id: 1 }).execute(),
      ).to.be.rejectedWith(SqliteError)
      await transaction.commit().execute()

      expect(transaction.isCommitted).to.be.true
      expect(await db.selectFrom('item').selectAll().execute()).to.eql([
        { id: 1 },
      ])
    })
  })
}
