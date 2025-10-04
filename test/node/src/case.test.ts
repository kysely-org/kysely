import { sql } from '../../..'
import {
  DIALECTS,
  TestContext,
  clearDatabase,
  destroyTest,
  expect,
  initTest,
  insertDefaultDataSet,
  testSql,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  const { variant } = dialect

  describe(`${variant}: case`, () => {
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
          eb.case().when('gender', '=', 'male').then('Mr.').end().as('title'),
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
        mssql: {
          sql: `select case when "gender" = @1 then @2 end as "title" from "person"`,
          parameters: ['male', 'Mr.'],
        },
        sqlite: {
          sql: `select case when "gender" = ? then ? end as "title" from "person"`,
          parameters: ['male', 'Mr.'],
        },
      })

      await query.execute()
    })

    it('should execute a query with a case...when...thenRef...end operator', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select((eb) =>
          eb
            .case()
            .when('gender', '=', 'male')
            .thenRef('first_name')
            .end()
            .as('title'),
        )

      testSql(query, dialect, {
        postgres: {
          sql: `select case when "gender" = $1 then "first_name" end as "title" from "person"`,
          parameters: ['male'],
        },
        mysql: {
          sql: 'select case when `gender` = ? then `first_name` end as `title` from `person`',
          parameters: ['male'],
        },
        mssql: {
          sql: `select case when "gender" = @1 then "first_name" end as "title" from "person"`,
          parameters: ['male'],
        },
        sqlite: {
          sql: `select case when "gender" = ? then "first_name" end as "title" from "person"`,
          parameters: ['male'],
        },
      })

      await query.execute()
    })

    it('should execute a query with a case...value...when...then...end operator', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select((eb) =>
          eb.case('gender').when('male').then('Mr.').end().as('title'),
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
        mssql: {
          sql: `select case "gender" when @1 then @2 end as "title" from "person"`,
          parameters: ['male', 'Mr.'],
        },
        sqlite: {
          sql: `select case "gender" when ? then ? end as "title" from "person"`,
          parameters: ['male', 'Mr.'],
        },
      })

      await query.execute()
    })

    it('should execute a query with a case...when...then...when...then...end operator', async () => {
      const query = ctx.db.selectFrom('person').select((eb) =>
        eb
          .case()
          .when(eb('gender', '=', 'male'))
          .then(sql.lit('Mr.'))
          .when(eb('gender', '=', 'female'))
          .then(sql.lit('Mrs.'))
          .end()
          .as('title'),
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
        mssql: {
          sql: [
            `select case when "gender" = @1 then 'Mr.'`,
            `when "gender" = @2 then 'Mrs.'`,
            `end as "title" from "person"`,
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
            .as('title'),
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
        mssql: {
          sql: [
            `select case "gender" when 'male' then 'Mr.'`,
            `when 'female' then 'Mrs.'`,
            `end as "title" from "person"`,
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
            .as('title'),
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
        mssql: {
          sql: [
            `select case when "gender" = @1 then @2`,
            `when "gender" = @3 then @4`,
            `else null end as "title" from "person"`,
          ],
          parameters: ['male', 'Mr.', 'female', 'Mrs.'],
        },
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
                ]),
              )
              .then('Ms.')
              .else('Mrs.')
              .end(),
          )
          .end()
          .as('title'),
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
        mssql: {
          sql: [
            'select case "gender" when @1 then @2',
            'when @3 then',
            'case when ("marital_status" = @4 or',
            '"marital_status" is null) then @5',
            'else @6 end',
            'end as "title" from "person"',
          ],
          parameters: ['male', 'Mr.', 'female', 'single', 'Ms.', 'Mrs.'],
        },
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

    it('should execute a query with a case...whenRef...then...else...end operator', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select((eb) =>
          eb
            .case()
            .whenRef('first_name', '=', 'last_name')
            .then('match')
            .else('no')
            .end()
            .as('title'),
        )

      testSql(query, dialect, {
        postgres: {
          sql: `select case when "first_name" = "last_name" then $1 else $2 end as "title" from "person"`,
          parameters: ['match', 'no'],
        },
        mysql: {
          sql: 'select case when `first_name` = `last_name` then ? else ? end as `title` from `person`',
          parameters: ['match', 'no'],
        },
        mssql: {
          sql: `select case when "first_name" = "last_name" then @1 else @2 end as "title" from "person"`,
          parameters: ['match', 'no'],
        },
        sqlite: {
          sql: `select case when "first_name" = "last_name" then ? else ? end as "title" from "person"`,
          parameters: ['match', 'no'],
        },
      })

      await query.execute()
    })

    it('should execute a query with a case...whenRef...then...elseRef...end operator', async () => {
      const query = ctx.db
        .selectFrom('person')
        .select((eb) =>
          eb
            .case()
            .whenRef('first_name', '=', 'last_name')
            .then('match')
            .elseRef('gender')
            .end()
            .as('title'),
        )

      testSql(query, dialect, {
        postgres: {
          sql: `select case when "first_name" = "last_name" then $1 else "gender" end as "title" from "person"`,
          parameters: ['match'],
        },
        mysql: {
          sql: 'select case when `first_name` = `last_name` then ? else `gender` end as `title` from `person`',
          parameters: ['match'],
        },
        mssql: {
          sql: `select case when "first_name" = "last_name" then @1 else "gender" end as "title" from "person"`,
          parameters: ['match'],
        },
        sqlite: {
          sql: `select case when "first_name" = "last_name" then ? else "gender" end as "title" from "person"`,
          parameters: ['match'],
        },
      })

      await query.execute()
    })
  })
}
