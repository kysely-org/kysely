import { sql } from '../../../'

import {
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  NOT_SUPPORTED,
  insertDefaultDataSet,
  DIALECTS_WITH_MSSQL,
} from './test-setup.js'

for (const dialect of DIALECTS_WITH_MSSQL) {
  describe(`${dialect}: order by`, () => {
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

    it('should order by one column', async () => {
      const query = ctx.db
        .selectFrom('person')
        .selectAll()
        .orderBy('first_name')

      testSql(query, dialect, {
        postgres: {
          sql: 'select * from "person" order by "first_name"',
          parameters: [],
        },
        mysql: {
          sql: 'select * from `person` order by `first_name`',
          parameters: [],
        },
        mssql: {
          sql: 'select * from "person" order by "first_name"',
          parameters: [],
        },
        sqlite: {
          sql: 'select * from "person" order by "first_name"',
          parameters: [],
        },
      })

      const persons = await query.execute()

      expect(persons).to.have.length(3)
      expect(persons.map((it) => it.first_name)).to.eql([
        'Arnold',
        'Jennifer',
        'Sylvester',
      ])
    })

    it('should order by two columns in two invocations', async () => {
      const query = ctx.db
        .selectFrom('person')
        .selectAll()
        .orderBy('first_name')
        .orderBy('last_name', 'desc')

      testSql(query, dialect, {
        postgres: {
          sql: 'select * from "person" order by "first_name", "last_name" desc',
          parameters: [],
        },
        mysql: {
          sql: 'select * from `person` order by `first_name`, `last_name` desc',
          parameters: [],
        },
        mssql: {
          sql: 'select * from "person" order by "first_name", "last_name" desc',
          parameters: [],
        },
        sqlite: {
          sql: 'select * from "person" order by "first_name", "last_name" desc',
          parameters: [],
        },
      })

      await query.execute()
    })

    it('should order by two columns in one invocations', async () => {
      const query = ctx.db
        .selectFrom('person')
        .selectAll()
        .orderBy(['first_name', 'last_name desc'])

      testSql(query, dialect, {
        postgres: {
          sql: 'select * from "person" order by "first_name", "last_name" desc',
          parameters: [],
        },
        mysql: {
          sql: 'select * from `person` order by `first_name`, `last_name` desc',
          parameters: [],
        },
        mssql: {
          sql: 'select * from "person" order by "first_name", "last_name" desc',
          parameters: [],
        },
        sqlite: {
          sql: 'select * from "person" order by "first_name", "last_name" desc',
          parameters: [],
        },
      })

      await query.execute()
    })

    it('should order by aliased columns', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select([
          'first_name as fn',
          'middle_name as mn',
          'last_name as ln',
          'gender as g',
        ])
        .orderBy('fn')
        .orderBy('mn asc')
        .orderBy(['ln desc', 'g'])

      testSql(query, dialect, {
        postgres: {
          sql: [
            'select "first_name" as "fn",',
            '"middle_name" as "mn",',
            '"last_name" as "ln",',
            '"gender" as "g"',
            'from "person" order by "fn", "mn" asc, "ln" desc, "g"',
          ],
          parameters: [],
        },
        mysql: {
          sql: [
            'select `first_name` as `fn`,',
            '`middle_name` as `mn`,',
            '`last_name` as `ln`,',
            '`gender` as `g`',
            'from `person` order by `fn`, `mn` asc, `ln` desc, `g`',
          ],
          parameters: [],
        },
        mssql: {
          sql: [
            'select "first_name" as "fn",',
            '"middle_name" as "mn",',
            '"last_name" as "ln",',
            '"gender" as "g"',
            'from "person" order by "fn", "mn" asc, "ln" desc, "g"',
          ],
          parameters: [],
        },
        sqlite: {
          sql: [
            'select "first_name" as "fn",',
            '"middle_name" as "mn",',
            '"last_name" as "ln",',
            '"gender" as "g"',
            'from "person" order by "fn", "mn" asc, "ln" desc, "g"',
          ],
          parameters: [],
        },
      })

      await query.execute()
    })

    it('should order by expressions', async () => {
      const query = ctx.db
        .selectFrom('person')
        .selectAll()
        .orderBy(sql`coalesce(${sql.ref('first_name')}, ${sql.lit('foo')}) asc`)
        .orderBy((eb) => eb.fn.coalesce('last_name', sql.lit('foo')))
        .orderBy([
          sql`coalesce(${sql.ref('gender')}, ${sql.lit('foo')})`,
          (eb) => sql`${eb.fn.coalesce('middle_name', sql.lit('foo'))} desc`,
        ])

      testSql(query, dialect, {
        postgres: {
          sql: [
            'select * from "person"',
            `order by coalesce("first_name", 'foo') asc,`,
            `coalesce("last_name", 'foo'),`,
            `coalesce("gender", 'foo'),`,
            `coalesce("middle_name", 'foo') desc`,
          ],
          parameters: [],
        },
        mysql: {
          sql: [
            'select * from `person`',
            "order by coalesce(`first_name`, 'foo') asc,",
            "coalesce(`last_name`, 'foo'),",
            "coalesce(`gender`, 'foo'),",
            "coalesce(`middle_name`, 'foo') desc",
          ],
          parameters: [],
        },
        mssql: {
          sql: [
            'select * from "person"',
            `order by coalesce("first_name", 'foo') asc,`,
            `coalesce("last_name", 'foo'),`,
            `coalesce("gender", 'foo'),`,
            `coalesce("middle_name", 'foo') desc`,
          ],
          parameters: [],
        },
        sqlite: {
          sql: [
            'select * from "person"',
            `order by coalesce("first_name", 'foo') asc,`,
            `coalesce("last_name", 'foo'),`,
            `coalesce("gender", 'foo'),`,
            `coalesce("middle_name", 'foo') desc`,
          ],
          parameters: [],
        },
      })

      await query.execute()
    })

    it('order by raw expression and a direction', async () => {
      const query = ctx.db
        .selectFrom('person')
        .selectAll()
        .orderBy((eb) => eb.fn.coalesce('first_name', sql.lit('foo')), 'asc')

      testSql(query, dialect, {
        postgres: {
          sql: `select * from "person" order by coalesce("first_name", 'foo') asc`,
          parameters: [],
        },
        mysql: {
          sql: "select * from `person` order by coalesce(`first_name`, 'foo') asc",
          parameters: [],
        },
        mssql: {
          sql: `select * from "person" order by coalesce("first_name", 'foo') asc`,
          parameters: [],
        },
        sqlite: {
          sql: `select * from "person" order by coalesce("first_name", 'foo') asc`,
          parameters: [],
        },
      })

      await query.execute()
    })

    if (dialect === 'postgres') {
      it('order by raw expression in direction', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .orderBy('person.first_name', sql`nulls last`)

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" order by "person"."first_name" nulls last',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    }
  })
}
