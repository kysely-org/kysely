import {
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from '../../../'
import { ImmediateValuePlugin } from '../../../dist/esm/plugin/immediate-value/immediate-value-plugin.js'
import { Database, NOT_SUPPORTED, testSql } from './test-setup.js'

describe('ImmediateValuePlugin', () => {
  let db: Kysely<Database>

  before(async () => {
    db = new Kysely({
      dialect: {
        createAdapter: () => new PostgresAdapter(),
        createDriver: () => new DummyDriver(),
        createIntrospector: (db) => new PostgresIntrospector(db),
        createQueryCompiler: () => new PostgresQueryCompiler(),
      },
      plugins: [new ImmediateValuePlugin()],
    })
  })

  it('should inject all values into the query string and leave the parameters array empty', () => {
    const query = db
      .selectFrom('person')
      .where('first_name', '=', 'Sylvester')
      .where('gender', 'in', ['male', 'other'])
      .selectAll()

    testSql(query, 'postgres', {
      postgres: {
        parameters: [],
        sql: `select * from "person" where "first_name" = 'Sylvester' and "gender" in ('male', 'other')`,
      },
      mysql: NOT_SUPPORTED,
      mssql: NOT_SUPPORTED,
      sqlite: NOT_SUPPORTED,
    })
  })
})
