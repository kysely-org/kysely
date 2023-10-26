import {
  destroyTest,
  initTest,
  TestContext,
  expect,
  DIALECTS,
} from './test-setup.js'
import { allowNoopAwait } from '../../../'

for (const dialect of DIALECTS) {
  describe(`${dialect}: prevent await`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('should throw when awaited, and not throw after allowNoopAwait()', async () => {
      let thrown = true
      try {
        await ctx.db.selectFrom('person').selectAll()
        thrown = false
      } catch (e: any) {}
      expect(thrown).true
      allowNoopAwait()
      const query = ctx.db.selectFrom('person').selectAll()
      expect(query).eq(await query)
    })
  })
}
