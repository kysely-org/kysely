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
          expect(logSpy.callCount).to.equal(4)
          expect(logSpy.args[0][0]).to.match(/^kysely:query: .* "person"$/)
          expect(logSpy.args[2][0]).to.match(/^kysely:query:stream: .* "pet"$/)
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
          expect(logSpy.callCount).to.equal(4)
          expect(logSpy.args[0][0]).to.match(/^kysely:query: .* "person"$/)
          expect(logSpy.args[2][0]).to.match(/^kysely:query:stream: .* "pet"$/)
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
    const streamQuery = async function* () {
      throw 'oops'
    }

    describe('when query logging is disabled', () => {
      describe('when error logging is disabled', () => {
        const db = getKysely([], executeQuery, streamQuery)

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
        const db = getKysely(['error'], executeQuery, streamQuery)

        it('should not log query', async () => {
          await run(db)
          expect(logSpy.called).to.be.false
        })

        it('should log error', async () => {
          await run(db)
          expect(errorSpy.callCount).to.equal(2)
          expect(errorSpy.args[0][0]).to.match(/^kysely:error: .+ \\"person\\"/)
          expect(errorSpy.args[1][0]).to.match(/^kysely:error: .+ \\"pet\\"/)
        })
      })
    })

    describe('when query logging is enabled', () => {
      describe('when error logging is disabled', () => {
        const db = getKysely(['query'], executeQuery, streamQuery)

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
        const db = getKysely(['query', 'error'], executeQuery, streamQuery)

        it('should not log query', async () => {
          await run(db)
          expect(logSpy.called).to.be.false
        })

        it('should log error', async () => {
          await run(db)
          expect(errorSpy.callCount).to.equal(2)
          expect(errorSpy.args[0][0]).to.match(/^kysely:error: .+ \\"person\\"/)
          expect(errorSpy.args[1][0]).to.match(/^kysely:error: .+ \\"pet\\"/)
        })
      })
    })
  })
})

function getKysely(
  log: LogConfig,
  executeQuery: DatabaseConnection['executeQuery'] = () =>
    Promise.resolve({ rows: [] }),
  streamQuery: DatabaseConnection['streamQuery'] = async function* () {
    return
  },
): Kysely<Database> {
  return new Kysely({
    dialect: new (class extends PostgresDialect {
      constructor() {
        super({ pool: {} as any })
      }
      createDriver(): Driver {
        return new (class extends DummyDriver {
          acquireConnection(): Promise<DatabaseConnection> {
            return Promise.resolve({ executeQuery, streamQuery })
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

  try {
    for await (const _ of db.selectFrom('pet').selectAll().stream()) {
      // noop
    }
  } catch (err) {}
}
