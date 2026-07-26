import { createConnection, createPool } from 'mysql2'
import { Kysely, MysqlDialect, sql } from '../../../dist/index.js'
import {
  destroyTest,
  DIALECTS,
  DIALECT_CONFIGS,
  expect,
  initTest,
  type Database,
  type DialectVariant,
  type TestContext,
} from './test-setup.js'

const VARIANT = 'mysql' satisfies DialectVariant

const dialect = DIALECTS.find((dialect) => dialect.variant === VARIANT)

if (dialect) {
  describe('mysql2 callback pool', () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('should execute queries when given a `mysql2` callback pool', async () => {
      await using db = new Kysely<Database>({
        dialect: new MysqlDialect({
          pool: createPool(DIALECT_CONFIGS[VARIANT]),
        }),
      })

      await db.selectFrom('person').selectAll().execute()
    })

    it('should execute queries when a function returns a `mysql2` callback pool', async () => {
      await using db = new Kysely<Database>({
        dialect: new MysqlDialect({
          pool: async () => createPool(DIALECT_CONFIGS[VARIANT]),
        }),
      })

      await db.selectFrom('person').selectAll().execute()
    })

    it('should cancel queries when given a `mysql2` callback control connection', async () => {
      await using db = new Kysely<Database>({
        dialect: new MysqlDialect({
          controlConnection: createConnection,
          pool: createPool(DIALECT_CONFIGS[VARIANT]),
        }),
      })

      await expect(
        sql`select sleep(1)`.execute(db, {
          inflightQueryAbortStrategy: 'cancel query',
          signal: AbortSignal.timeout(50),
        }),
      ).to.eventually.be.rejectedWith(DOMException)
    })
  })
}
