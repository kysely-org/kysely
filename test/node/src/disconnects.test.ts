import { Kysely, MssqlDialect, sql } from '../../..'
import { DIALECTS, DIALECT_CONFIGS, Database, expect } from './test-setup'
import * as tarn from 'tarn'
import * as tedious from 'tedious'

const dialect = 'mssql'

if (DIALECTS.includes(dialect)) {
  describe(`${dialect}: disconnects`, () => {
    let connection: tedious.Connection
    let connectionFactoryTimesCalled = 0
    let db: Kysely<Database>

    before(async () => {
      db = new Kysely({
        dialect: new MssqlDialect({
          tarn: {
            ...tarn,
            options: {
              min: 0,
              max: 1,
            },
          },
          tedious: {
            ...tedious,
            connectionFactory: () => {
              connectionFactoryTimesCalled++

              return (connection = new tedious.Connection(
                DIALECT_CONFIGS[dialect],
              ))
            },
          },
        }),
      })
    })

    after(async () => {
      await db.destroy()
    })

    it('should be disconnection tolerant', async () => {
      await sql`select 1`.execute(db)
      expect(connectionFactoryTimesCalled).to.equal(1)

      connection.socketError(new Error('moshe'))

      await sql`select 1`.execute(db)
      expect(connectionFactoryTimesCalled).to.equal(2)
    })
  })
}
