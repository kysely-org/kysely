import { sql } from '../../..'
import {
  DIALECTS,
  NOT_SUPPORTED,
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
          eb.case().when('gender', '=', 'male').then('Mr.').end().as('title')
        )

      testSql(query, dialect, {
        postgres: {
          sql: `select case when "gender" = $1 then $2 end as "title" from "person"`,
          parameters: ['male', 'Mr.'],
        },
        mysql: {
          sql: 'select case when `gender` = ? then ? end as `title` from `person`',
          parameters: ['male', 'Mr.'],
        },
        mssql: NOT_SUPPORTED,
        sqlite: {
          sql: `select case when "gender" = ? then ? end as "title" from "person"`,
          parameters: ['male', 'Mr.'],
        },
      })

      await query.execute()
    })

    it('should execute a query with a case...value...when...then...end operator', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select((eb) =>
          eb.case('gender').when('male').then('Mr.').end().as('title')
        )

      testSql(query, dialect, {
        postgres: {
          sql: `select case "gender" when $1 then $2 end as "title" from "person"`,
          parameters: ['male', 'Mr.'],
        },
        mysql: {
          sql: 'select case `gender` when ? then ? end as `title` from `person`',
          parameters: ['male', 'Mr.'],
        },
        mssql: NOT_SUPPORTED,
        sqlite: {
          sql: `select case "gender" when ? then ? end as "title" from "person"`,
          parameters: ['male', 'Mr.'],
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
            .when(eb('gender', '=', 'male'))
            .then(sql.lit('Mr.'))
            .when(eb('gender', '=', 'female'))
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
        mssql: NOT_SUPPORTED,
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
        mssql: NOT_SUPPORTED,
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

    it('should execute a query with a case...when...then...when...then...else...end operator', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select((eb) =>
          eb
            .case()
            .when('gender', '=', 'male')
            .then('Mr.')
            .when('gender', '=', 'female')
            .then('Mrs.')
            .else(null)
            .end()
            .as('title')
        )

      testSql(query, dialect, {
        postgres: {
          sql: [
            `select case when "gender" = $1 then $2`,
            `when "gender" = $3 then $4`,
            `else null end as "title" from "person"`,
          ],
          parameters: ['male', 'Mr.', 'female', 'Mrs.'],
        },
        mysql: {
          sql: [
            'select case when `gender` = ? then ?',
            'when `gender` = ? then ?',
            'else null end as `title` from `person`',
          ],
          parameters: ['male', 'Mr.', 'female', 'Mrs.'],
        },
        mssql: NOT_SUPPORTED,
        sqlite: {
          sql: [
            `select case when "gender" = ? then ?`,
            `when "gender" = ? then ?`,
            `else null end as "title" from "person"`,
          ],
          parameters: ['male', 'Mr.', 'female', 'Mrs.'],
        },
      })

      await query.execute()
    })

    it('should execute a query with a case...value...when...then...when...then...(case...when...then...else...end)...end operator', async () => {
      const query = ctx.db.selectFrom('person').select((eb) =>
        eb
          .case('gender')
          .when('male')
          .then('Mr.')
          .when('female')
          .then(
            eb
              .case()
              .when(
                eb.or([
                  eb('marital_status', '=', 'single'),
                  eb('marital_status', 'is', null),
                ])
              )
              .then('Ms.')
              .else('Mrs.')
              .end()
          )
          .end()
          .as('title')
      )

      testSql(query, dialect, {
        postgres: {
          sql: [
            'select case "gender" when $1 then $2',
            'when $3 then',
            'case when ("marital_status" = $4 or',
            '"marital_status" is null) then $5',
            'else $6 end',
            'end as "title" from "person"',
          ],
          parameters: ['male', 'Mr.', 'female', 'single', 'Ms.', 'Mrs.'],
        },
        mysql: {
          sql: [
            'select case `gender` when ? then ?',
            'when ? then',
            'case when (`marital_status` = ? or',
            '`marital_status` is null) then ?',
            'else ? end',
            'end as `title` from `person`',
          ],
          parameters: ['male', 'Mr.', 'female', 'single', 'Ms.', 'Mrs.'],
        },
        mssql: NOT_SUPPORTED,
        sqlite: {
          sql: [
            'select case "gender" when ? then ?',
            'when ? then',
            'case when ("marital_status" = ? or',
            '"marital_status" is null) then ?',
            'else ? end',
            'end as "title" from "person"',
          ],
          parameters: ['male', 'Mr.', 'female', 'single', 'Ms.', 'Mrs.'],
        },
      })

      await query.execute()
    })
  })
}
