import { DeleteResult } from '../../../'

import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  NOT_SUPPORTED,
  TEST_INIT_TIMEOUT,
  insertDefaultDataSet,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: delete`, () => {
    let ctx: TestContext

    before(async function () {
      this.timeout(TEST_INIT_TIMEOUT)
      ctx = await initTest(dialect)
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

    it('should delete one row', async () => {
      const query = ctx.db.deleteFrom('person').where('gender', '=', 'female')

      testSql(query, dialect, {
        postgres: {
          sql: 'delete from "person" where "gender" = $1',
          parameters: ['female'],
        },
        mysql: {
          sql: 'delete from `person` where `gender` = ?',
          parameters: ['female'],
        },
        sqlite: {
          sql: 'delete from "person" where "gender" = ?',
          parameters: ['female'],
        },
      })

      const result = await query.executeTakeFirst()

      expect(result).to.be.instanceOf(DeleteResult)
      expect(result.numDeletedRows).to.equal(1n)

      expect(
        await ctx.db
          .selectFrom('person')
          .select(['first_name', 'last_name', 'gender'])
          .orderBy('first_name')
          .orderBy('last_name')
          .execute()
      ).to.eql([
        { first_name: 'Arnold', last_name: 'Schwarzenegger', gender: 'male' },
        { first_name: 'Sylvester', last_name: 'Stallone', gender: 'male' },
      ])
    })

    it('should delete two rows', async () => {
      const query = ctx.db
        .deleteFrom('person')
        .where('first_name', '=', 'Jennifer')
        .orWhere('first_name', '=', 'Arnold')

      const result = await query.executeTakeFirst()

      expect(result).to.be.instanceOf(DeleteResult)
      expect(result.numDeletedRows).to.equal(2n)
    })

    it('should delete zero rows', async () => {
      const query = ctx.db
        .deleteFrom('person')
        .where('first_name', '=', 'Nobody')

      const result = await query.executeTakeFirst()

      expect(result).to.be.instanceOf(DeleteResult)
      expect(result.numDeletedRows).to.equal(0n)
    })

    if (dialect === 'postgres') {
      it('should return deleted rows when `returning` is used', async () => {
        const query = ctx.db
          .deleteFrom('person')
          .where('gender', '=', 'male')
          .returning(['first_name', 'last_name as last'])

        testSql(query, dialect, {
          postgres: {
            sql: 'delete from "person" where "gender" = $1 returning "first_name", "last_name" as "last"',
            parameters: ['male'],
          },
          mysql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        const result = await query.execute()

        expect(result).to.have.length(2)
        expect(Object.keys(result[0]).sort()).to.eql(['first_name', 'last'])
        expect(result).to.containSubset([
          { first_name: 'Arnold', last: 'Schwarzenegger' },
          { first_name: 'Sylvester', last: 'Stallone' },
        ])
      })
    }
  })
}
