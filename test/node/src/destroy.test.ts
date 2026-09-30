import { Pool } from 'pg'

import { Kysely, PostgresDialect, sql } from '../../../dist/index.js'
import {
  DIALECTS,
  DIALECT_CONFIGS,
  type Database,
  expect,
} from './test-setup.js'

const VARIANT = 'postgres'

if (DIALECTS.some((d) => d.variant === VARIANT)) {
  describe(`${VARIANT}: destroy`, () => {
    it('should reject a query whose connection is still being acquired, release its client and resolve', async () => {
      const pool = new Pool({ ...DIALECT_CONFIGS[VARIANT], min: 0, max: 1 })

      // Resolves once the driver has asked the pool for a connection.
      let connectCalled!: () => void
      const connecting = new Promise<void>(
        (resolve) => (connectCalled = resolve),
      )
      const connect = pool.connect.bind(pool) as () => ReturnType<
        Pool['connect']
      >
      pool.connect = (() => {
        const client = connect()
        connectCalled()
        return client
      }) as Pool['connect']

      const db = new Kysely<Database>({
        dialect: new PostgresDialect({ pool }),
      })

      const query = sql`select 1`.execute(db)
      await connecting
      const destroyed = db.destroy()

      await expect(query).to.be.rejectedWith(
        'driver has already been destroyed',
      )
      await destroyed
      expect(pool.totalCount).to.equal(0)
    })
  })
}
