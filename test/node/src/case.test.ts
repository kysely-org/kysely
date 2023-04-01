import { sql } from '../../..'
import {
  DIALECTS,
  TestContext,
  clearDatabase,
  destroyTest,
  initTest,
  insertDefaultDataSet,
  testSql,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: case`, () => {
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

    it('should execute a query with a case...when...then...end operator', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select((eb) =>
          eb
            .case()
            .when(eb.cmpr('gender', '=', 'male'))
            .then(sql.lit('Mr.'))
            .end()
            .as('title')
        )

      testSql(query, dialect, {
        postgres: {
          sql: `select case when "gender" = $1 then 'Mr.' end as "title" from "person"`,
          parameters: ['male'],
        },
        mysql: {
          sql: "select case when `gender` = ? then 'Mr.' end as `title` from `person`",
          parameters: ['male'],
        },
        sqlite: {
          sql: `select case when "gender" = ? then 'Mr.' end as "title" from "person"`,
          parameters: ['male'],
        },
      })

      await query.execute()
    })

    it('should execute a query with a case...value...when...then...end operator', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select((eb) =>
          eb
            .case('gender')
            .when(sql.lit('male'))
            .then(sql.lit('Mr.'))
            .end()
            .as('title')
        )

      testSql(query, dialect, {
        postgres: {
          sql: `select case "gender" when 'male' then 'Mr.' end as "title" from "person"`,
          parameters: [],
        },
        mysql: {
          sql: "select case `gender` when 'male' then 'Mr.' end as `title` from `person`",
          parameters: [],
        },
        sqlite: {
          sql: `select case "gender" when 'male' then 'Mr.' end as "title" from "person"`,
          parameters: [],
        },
      })

      await query.execute()
    })

    it('should execute a query with a case...when...then...when...then...end operator', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select((eb) =>
          eb
            .case()
            .when(eb.cmpr('gender', '=', 'male'))
            .then(sql.lit('Mr.'))
            .when(eb.cmpr('gender', '=', 'female'))
            .then(sql.lit('Mrs.'))
            .end()
            .as('title')
        )

      testSql(query, dialect, {
        postgres: {
          sql: [
            `select case when "gender" = $1 then 'Mr.'`,
            `when "gender" = $2 then 'Mrs.'`,
            `end as "title" from "person"`,
          ],
          parameters: ['male', 'female'],
        },
        mysql: {
          sql: [
            "select case when `gender` = ? then 'Mr.'",
            "when `gender` = ? then 'Mrs.'",
            'end as `title` from `person`',
          ],
          parameters: ['male', 'female'],
        },
        sqlite: {
          sql: [
            `select case when "gender" = ? then 'Mr.'`,
            `when "gender" = ? then 'Mrs.'`,
            `end as "title" from "person"`,
          ],
          parameters: ['male', 'female'],
        },
      })

      await query.execute()
    })

    it('should execute a query with a case...value...when...then...when...then...end operator', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select((eb) =>
          eb
            .case('gender')
            .when(sql.lit('male'))
            .then(sql.lit('Mr.'))
            .when(sql.lit('female'))
            .then(sql.lit('Mrs.'))
            .end()
            .as('title')
        )

      testSql(query, dialect, {
        postgres: {
          sql: [
            `select case "gender" when 'male' then 'Mr.'`,
            `when 'female' then 'Mrs.'`,
            `end as "title" from "person"`,
          ],
          parameters: [],
        },
        mysql: {
          sql: [
            "select case `gender` when 'male' then 'Mr.'",
            "when 'female' then 'Mrs.'",
            'end as `title` from `person`',
          ],
          parameters: [],
        },
        sqlite: {
          sql: [
            `select case "gender" when 'male' then 'Mr.'`,
            `when 'female' then 'Mrs.'`,
            `end as "title" from "person"`,
          ],
          parameters: [],
        },
      })

      await query.execute()
    })
  })
}
