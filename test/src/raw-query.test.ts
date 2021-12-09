import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  expect,
  TEST_INIT_TIMEOUT,
  insertDefaultDataSet,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: raw queries`, () => {
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

    it('should run a raw select query', async () => {
      const result = await ctx.db
        .raw<{ first_name: string }>(
          'select first_name from person where gender = ? order by first_name asc, last_name asc',
          ['male']
        )
        .execute()

      expect(result.insertId).to.equal(undefined)
      expect(result.numUpdatedOrDeletedRows).to.equal(undefined)
      expect(result.rows).to.eql([
        { first_name: 'Arnold' },
        { first_name: 'Sylvester' },
      ])
    })

    it('should run a raw update query', async () => {
      const result = await ctx.db
        .raw('update person set first_name = ? where gender = ?', [
          'Updated',
          'male',
        ])
        .execute()

      expect(result.numUpdatedOrDeletedRows).to.equal(2n)
      expect(result.rows).to.eql([])
    })

    it('should run a raw delete query', async () => {
      const result = await ctx.db
        .raw('delete from person where gender = ?', ['male'])
        .execute()

      expect(result.numUpdatedOrDeletedRows).to.equal(2n)
      expect(result.rows).to.eql([])
    })

    if (dialect === 'postgres') {
      it('should run a raw insert query', async () => {
        const result = await ctx.db
          .raw(
            'insert into person (first_name, last_name, gender) values (?, ?, ?) returning first_name, last_name',
            ['New', 'Personsson', 'other']
          )
          .execute()

        expect(result.insertId).to.equal(undefined)
        expect(result.rows).to.eql([
          { first_name: 'New', last_name: 'Personsson' },
        ])
      })
    } else {
      it('should run a raw insert query', async () => {
        const result = await ctx.db
          .raw(
            'insert into person (first_name, last_name, gender) values (?, ?, ?)',
            ['New', 'Personsson', 'other']
          )
          .execute()

        expect(result.insertId! > 0n).to.be.equal(true)
        expect(result.rows).to.eql([])
      })
    }
  })
}
