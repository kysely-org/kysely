import { createPool } from 'mysql2'
import { Kysely, MysqlDialect } from '../../..'

import {
  destroyTest,
  initTest,
  TestContext,
  expect,
  Database,
  DIALECT_CONFIGS,
  insertDefaultDataSet,
  clearDatabase,
} from './test-setup.js'

describe(`mysql custom pool`, () => {
  let ctx: TestContext
  let db: Kysely<Database>

  before(async function () {
    ctx = await initTest(this, 'mysql')

    db = new Kysely<Database>({
      dialect: new MysqlDialect(createPool(DIALECT_CONFIGS.mysql)),
    })
  })

  beforeEach(async () => {
    await insertDefaultDataSet(ctx)
  })

  afterEach(async () => {
    await clearDatabase(ctx)
  })

  after(async () => {
    await destroyTest(ctx)
    await db.destroy()
  })

  it('should create a kysely instance using an existing pool', async () => {
    const result = await db
      .selectFrom('person')
      .select('first_name')
      .orderBy('first_name')
      .execute()

    expect(result.map((it) => it.first_name)).to.eql([
      'Arnold',
      'Jennifer',
      'Sylvester',
    ])
  })
})
