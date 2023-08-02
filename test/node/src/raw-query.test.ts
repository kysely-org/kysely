import { sql } from '../../../'

import {
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  expect,
  insertDefaultDataSet,
  testSql,
  DIALECTS_WITH_MSSQL,
} from './test-setup.js'

for (const dialect of DIALECTS_WITH_MSSQL) {
  describe(`${dialect}: raw queries`, () => {
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

    it('should run a raw select query', async () => {
      const gender = 'male'

      const result = await sql<{
        first_name: string
      }>`select first_name from person where gender = ${gender} order by first_name asc, last_name asc`.execute(
        ctx.db
      )

      expect(result.insertId).to.equal(undefined)
      expect(result.numAffectedRows).to.equal(
        dialect === 'mssql' ? 2n : undefined
      )
      expect(result.rows).to.eql([
        { first_name: 'Arnold' },
        { first_name: 'Sylvester' },
      ])
    })

    it('should run a raw update query', async () => {
      const newFirstName = 'Updated'
      const gender = 'male'

      const result =
        await sql`update person set first_name = ${newFirstName} where gender = ${gender}`.execute(
          ctx.db
        )

      expect(result.numAffectedRows).to.equal(2n)
      expect(result.rows).to.eql([])
    })

    it('should run a raw delete query', async () => {
      const gender = 'male'

      const result =
        await sql`delete from person where gender = ${gender}`.execute(ctx.db)

      expect(result.numAffectedRows).to.equal(2n)
      expect(result.rows).to.eql([])
    })

    if (dialect === 'postgres' || dialect === 'sqlite') {
      it('should run a raw insert query', async () => {
        const firstName = 'New'
        const lastName = 'Personsson'
        const gender = 'other'

        const result =
          await sql`insert into person (first_name, last_name, gender) values (${firstName}, ${lastName}, ${gender}) returning first_name, last_name`.execute(
            ctx.db
          )

        expect(result.insertId).to.equal(undefined)
        expect(result.rows).to.eql([
          { first_name: 'New', last_name: 'Personsson' },
        ])
      })
    }

    if (dialect === 'mysql') {
      it('should run a raw insert query', async () => {
        const firstName = 'New'
        const lastName = 'Personsson'
        const gender = 'other'

        const result =
          await sql`insert into person (first_name, last_name, gender) values (${firstName}, ${lastName}, ${gender})`.execute(
            ctx.db
          )

        expect(result.insertId! > 0n).to.be.equal(true)
        expect(result.rows).to.eql([])
      })
    }

    it('should compile a raw select query', async () => {
      const gender = 'male'

      const query = sql`select first_name from person where gender = ${gender} order by first_name asc, last_name asc`

      testSql({ compile: () => query.compile(ctx.db) }, dialect, {
        postgres: {
          sql: 'select first_name from person where gender = $1 order by first_name asc, last_name asc',
          parameters: [gender],
        },
        mysql: {
          sql: 'select first_name from person where gender = ? order by first_name asc, last_name asc',
          parameters: [gender],
        },
        mssql: {
          sql: 'select first_name from person where gender = @1 order by first_name asc, last_name asc',
          parameters: [gender],
        },
        sqlite: {
          sql: 'select first_name from person where gender = ? order by first_name asc, last_name asc',
          parameters: [gender],
        },
      })
    })
  })
}
