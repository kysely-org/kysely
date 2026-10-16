import { Pool, type PoolClient } from 'pg'
import { Kysely, PostgresDialect, sql } from '../../../dist/index.js'
import { DIALECTS, DIALECT_CONFIGS, expect } from './test-setup.js'

const VARIANT = 'postgres'

if (DIALECTS.some((d) => d.variant === VARIANT)) {
  describe(`${VARIANT}: destroy`, () => {
    let db: Kysely<unknown>
    let client: PoolClient | undefined

    afterEach(async () => {
      client?.release()
      await db.destroy()
    })

    it('should not hang when destroyed while acquiring a connection', async () => {
      const pool = new Pool(DIALECT_CONFIGS[VARIANT])
      const executedQueries: string[] = []

      const connecting = new Promise<void>((resolve) => {
        const connect = pool.connect.bind(pool)
        pool.connect = async () => {
          const pendingClient = connect()
          resolve()
          client = await pendingClient
          return client
        }
      })
      pool.once('release', () => {
        client = undefined
      })

      db = new Kysely({
        dialect: new PostgresDialect({ pool }),
        log(event) {
          executedQueries.push(event.query.sql)
        },
      })

      const query = sql`select 1`.execute(db).catch(() => {})
      await connecting
      await expect(db.destroy()).to.be.fulfilled
      await query
      expect(executedQueries).to.deep.equal([])
    })
  })
}
