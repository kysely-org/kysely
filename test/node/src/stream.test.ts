import {
  DIALECTS,
  Database,
  TestContext,
  createTableWithId,
  destroyTest,
  expect,
  initTest,
} from './test-setup'
import { GeneratedAlways, Kysely, sql } from '../../..'
import { Request } from 'tedious'
import { SinonSandbox, SinonSpy, createSandbox } from 'sinon'

const CHUNK_SIZE = 10
const DIALECT = 'mssql'
const ITEM_COUNT = 100
const TABLE = 'stream_test'

if (DIALECTS.includes(DIALECT)) {
  describe(`mssql: stream`, () => {
    let sandbox: SinonSandbox
    let pauseSpy: SinonSpy
    let resumeSpy: SinonSpy
    let ctx: Omit<TestContext, 'db'> & {
      db: Kysely<Database & { [TABLE]: { id: GeneratedAlways<number> } }>
    }

    before(async function () {
      sandbox = createSandbox()
      pauseSpy = sandbox.spy(Request.prototype, 'pause')
      resumeSpy = sandbox.spy(Request.prototype, 'resume')

      ctx = (await initTest(this, DIALECT)) as any
      try {
        await ctx.db.schema.dropTable(TABLE).execute()
      } catch (err) {}
      await createTableWithId(ctx.db.schema, DIALECT, TABLE).execute()
      await sql`
        set identity_insert ${sql.table(TABLE)} on;
        with cteNums(n) AS (
          SELECT 1
          UNION ALL
          SELECT n + 1
          FROM cteNums WHERE n < ${sql.lit(ITEM_COUNT)} -- how many times to iterate
        )
        INSERT ${sql.table(TABLE)} (id)
        SELECT * FROM cteNums
        OPTION (MAXRECURSION ${sql.lit(ITEM_COUNT)});
        set identity_insert ${sql.table(TABLE)} off
      `.execute(ctx.db)
    })

    after(async () => {
      await ctx.db.schema.dropTable(TABLE).execute()
      await destroyTest(ctx as any)
      sandbox.restore()
    })

    it('should pause/resume the request according to chunk size', async () => {
      for await (const _ of ctx.db
        .selectFrom(TABLE)
        .selectAll()
        .stream(CHUNK_SIZE));

      const chunks = Math.ceil(ITEM_COUNT / CHUNK_SIZE)

      expect(pauseSpy.callCount).to.equal(chunks)
      expect(resumeSpy.callCount).to.equal(chunks + 1)
    })
  })
}
