import { Pool } from 'pg'
import { Kysely, PostgresDialect } from '../../..'

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

describe(`postgres custom pool`, () => {
  let ctx: TestContext
  let db: Kysely<Database>

  before(async function () {
    ctx = await initTest(this, 'postgres')

    db = new Kysely<Database>({
      dialect: new PostgresDialect(new Pool(DIALECT_CONFIGS.postgres)),
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
