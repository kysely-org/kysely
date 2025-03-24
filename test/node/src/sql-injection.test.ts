import { expect } from 'chai'
import { sql } from '../../../'
import { destroyTest, DIALECTS, initTest, TestContext } from './test-setup'

for (const dialect of DIALECTS) {
  describe(`${dialect}: select`, () => {
    let ctx: TestContext
    const identifierWrapper = dialect === 'mysql' ? '`' : '"'

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('should not allow SQL injection in table names', async () => {
      const query = sql`select * from ${sql.table(
        `person${identifierWrapper}; drop table person --`,
      )}`.compile(ctx.db)

      expect(query.sql).to.equal(
        `select * from ${identifierWrapper}person${identifierWrapper}${identifierWrapper}; drop table person --${identifierWrapper}`,
      )

      await expect(ctx.db.executeQuery(query)).to.eventually.be.rejected
      await assertDidNotDropTable(ctx, 'person')
    })

    it('should not allow SQL injection in column refs', async () => {
      const query =
        sql`select ${sql.ref(`first_name${identifierWrapper}; drop table person --`)} from person`.compile(
          ctx.db,
        )

      expect(query.sql).to.equal(
        `select ${identifierWrapper}first_name${identifierWrapper}${identifierWrapper}; drop table person --${identifierWrapper} from person`,
      )

      await expect(ctx.db.executeQuery(query)).to.eventually.be.rejected
      await assertDidNotDropTable(ctx, 'person')
    })

    it('should not allow SQL injection in literals', async () => {
      const query = ctx.db
        .selectFrom('person')
        .where('first_name', '=', sql.lit(`Sylvester'; drop table person --`))
        .selectAll()

      expect(query.compile().sql).to.equal(
        `select * from ${identifierWrapper}person${identifierWrapper} where ${identifierWrapper}first_name${identifierWrapper} = 'Sylvester''; drop table person --'`,
      )

      const results = await ctx.db.executeQuery(query)
      expect(results.rows).to.have.length(0)
      await assertDidNotDropTable(ctx, 'person')
    })
  })
}

async function assertDidNotDropTable(ctx: TestContext, tableName: string) {
  const tables = await ctx.db.introspection.getTables()

  expect(tables.some((table) => table.name === tableName)).to.be.true
}
