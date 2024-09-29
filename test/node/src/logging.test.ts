import { SinonSandbox, SinonSpy, createSandbox } from 'sinon'
import { Database, expect } from './test-setup'
import {
  DatabaseConnection,
  Driver,
  DummyDriver,
  Kysely,
  LogConfig,
  PostgresDialect,
} from '../../..'

describe('logging', () => {
  let sandbox: SinonSandbox
  let errorSpy: SinonSpy
  let logSpy: SinonSpy

  beforeEach(() => {
    sandbox = createSandbox()
    errorSpy = sandbox.stub(console, 'error')
    logSpy = sandbox.stub(console, 'log')
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('when query execution succeeds', () => {
    describe('when query logging is disabled', () => {
      describe('when error logging is disabled', () => {
        const db = getKysely([])

        it('should not log query', async () => {
          await run(db)
          expect(logSpy.called).to.be.false
        })

        it('should not log error', async () => {
          await run(db)
          expect(errorSpy.called).to.be.false
        })
      })

      describe('when error logging is enabled', () => {
        const db = getKysely(['error'])

        it('should not log query', async () => {
          await run(db)
          expect(logSpy.called).to.be.false
        })

        it('should not log error', async () => {
          await run(db)
          expect(errorSpy.called).to.be.false
        })
      })
    })

    describe('when query logging is enabled', () => {
      describe('when error logging is disabled', () => {
        const db = getKysely(['query'])

        it('should log query', async () => {
          await run(db)
          expect(logSpy.called).to.be.true
        })

        it('should not log error', async () => {
          await run(db)
          expect(errorSpy.called).to.be.false
        })
      })

      describe('when error logging is enabled', () => {
        const db = getKysely(['query', 'error'])

        it('should log query', async () => {
          await run(db)
          expect(logSpy.called).to.be.true
        })

        it('should not log error', async () => {
          await run(db)
          expect(errorSpy.called).to.be.false
        })
      })
    })
  })

  describe('when query execution fails', () => {
    const executeQuery = () => Promise.reject('oops')

    describe('when query logging is disabled', () => {
      describe('when error logging is disabled', () => {
        const db = getKysely([], executeQuery)

        it('should not log query', async () => {
          await run(db)
          expect(logSpy.called).to.be.false
        })

        it('should not log error', async () => {
          await run(db)
          expect(errorSpy.called).to.be.false
        })
      })

      describe('when error logging is enabled', () => {
        const db = getKysely(['error'], executeQuery)

        it('should not log query', async () => {
          await run(db)
          expect(logSpy.called).to.be.false
        })

        it('should log error', async () => {
          await run(db)
          expect(errorSpy.called).to.be.true
        })
      })
    })

    describe('when query logging is enabled', () => {
      describe('when error logging is disabled', () => {
        const db = getKysely(['query'], executeQuery)

        it('should not log query', async () => {
          await run(db)
          expect(logSpy.called).to.be.false
        })

        it('should not log error', async () => {
          await run(db)
          expect(errorSpy.called).to.be.false
        })
      })

      describe('when error logging is enabled', () => {
        const db = getKysely(['query', 'error'], executeQuery)

        it('should not log query', async () => {
          await run(db)
          expect(logSpy.called).to.be.false
        })

        it('should log error', async () => {
          await run(db)
          expect(errorSpy.called).to.be.true
        })
      })
    })
  })
})

function getKysely(
  log: LogConfig,
  executeQuery: DatabaseConnection['executeQuery'] = () =>
    Promise.resolve({ rows: [] }),
): Kysely<Database> {
  return new Kysely({
    dialect: new (class extends PostgresDialect {
      constructor() {
        super({ pool: {} as any })
      }
      createDriver(): Driver {
        return new (class extends DummyDriver {
          acquireConnection(): Promise<DatabaseConnection> {
            return Promise.resolve({
              executeQuery,
              streamQuery: (async () => {}) as any,
            })
          }
        })()
      }
    })(),
    log,
  })
}

async function run(db: Kysely<Database>) {
  try {
    await db.selectFrom('person').selectAll().execute()
  } catch (err) {}
}
