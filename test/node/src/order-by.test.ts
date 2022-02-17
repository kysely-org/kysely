import { sql } from '../../../'

import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  TEST_INIT_TIMEOUT,
  NOT_SUPPORTED,
  insertDefaultDataSet,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: order by`, () => {
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

    it('order by one column', async () => {
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

    it('order by two columns', async () => {
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
        sqlite: {
          sql: 'select * from "person" order by "first_name", "last_name" desc',
          parameters: [],
        },
      })

      await query.execute()
    })

    it('order by aliased column', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select('first_name as fn')
        .orderBy('fn')

      testSql(query, dialect, {
        postgres: {
          sql: 'select "first_name" as "fn" from "person" order by "fn"',
          parameters: [],
        },
        mysql: {
          sql: 'select `first_name` as `fn` from `person` order by `fn`',
          parameters: [],
        },
        sqlite: {
          sql: 'select "first_name" as "fn" from "person" order by "fn"',
          parameters: [],
        },
      })

      await query.execute()
    })

    it('order by raw expression', async () => {
      const query = ctx.db
        .selectFrom('person')
        .selectAll()
        .orderBy(sql`coalesce(${sql.ref('first_name')}, 'foo')`, 'asc')

      testSql(query, dialect, {
        postgres: {
          sql: `select * from "person" order by coalesce("first_name", 'foo') asc`,
          parameters: [],
        },
        mysql: {
          sql: "select * from `person` order by coalesce(`first_name`, 'foo') asc",
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
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    }
  })
}
