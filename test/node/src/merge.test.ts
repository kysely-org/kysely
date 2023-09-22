import {
  DIALECTS,
  TestContext,
  clearDatabase,
  destroyTest,
  initTest,
  insertDefaultDataSet,
} from './test-setup.js'

for (const dialect of DIALECTS.filter(
  (dialect) => dialect === 'postgres' || dialect === 'mssql'
)) {
  describe(`merge (${dialect})`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    beforeEach(async () => {
      await insertDefaultDataSet(ctx)
    })

    afterEach(async () => {
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })
  })
}
