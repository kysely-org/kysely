import {
  destroyTest,
  initTest,
  TestContext,
  testSql,
  NOT_SUPPORTED,
  DIALECTS,
  limit,
} from './test-setup'

for (const dialect of DIALECTS) {
  describe(`${dialect} clear`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('should clear select', () => {
      const query = ctx.db
        .selectFrom('person')
        .select(['id', 'first_name', 'last_name'])
        .clearSelect()
        .select(['id'])

      testSql(query, dialect, {
        postgres: {
          sql: `select "id" from "person"`,
          parameters: [],
        },
        mysql: {
          sql: 'select `id` from `person`',
          parameters: [],
        },
        mssql: {
          sql: `select "id" from "person"`,
          parameters: [],
        },
        sqlite: {
          sql: `select "id" from "person"`,
          parameters: [],
        },
      })
    })

    it('SelectQueryBuilder should clear where', () => {
      const query = ctx.db
        .selectFrom('person')
        .selectAll()
        .where('gender', '=', 'other')
        .clearWhere()

      testSql(query, dialect, {
        postgres: {
          sql: `select * from "person"`,
          parameters: [],
        },
        mysql: {
          sql: 'select * from `person`',
          parameters: [],
        },
        mssql: {
          sql: `select * from "person"`,
          parameters: [],
        },
        sqlite: {
          sql: `select * from "person"`,
          parameters: [],
        },
      })
    })

    it('OnConflictBuilder should clear where', () => {
      const query = ctx.db
        .insertInto('person')
        .onConflict((b) => b.where('id', '=', 3).clearWhere().doNothing())

      testSql(query, dialect, {
        postgres: {
          sql: `insert into "person" on conflict do nothing`,
          parameters: [],
        },
        mysql: {
          sql: 'insert into `person` on conflict do nothing',
          parameters: [],
        },
        mssql: {
          sql: `insert into "person" on conflict do nothing`,
          parameters: [],
        },
        sqlite: {
          sql: `insert into "person" on conflict do nothing`,
          parameters: [],
        },
      })
    })

    it('OnConflictUpdateBuilder should clear where', () => {
      const query = ctx.db
        .insertInto('person')
        .onConflict((b) =>
          b
            .doUpdateSet({ gender: 'other' })
            .where('gender', '=', 'male')
            .clearWhere(),
        )

      testSql(query, dialect, {
        postgres: {
          sql: `insert into "person" on conflict do update set "gender" = $1`,
          parameters: ['other'],
        },
        mysql: {
          sql: 'insert into `person` on conflict do update set `gender` = ?',
          parameters: ['other'],
        },
        mssql: {
          sql: `insert into "person" on conflict do update set "gender" = @1`,
          parameters: ['other'],
        },
        sqlite: {
          sql: `insert into "person" on conflict do update set "gender" = ?`,
          parameters: ['other'],
        },
      })
    })

    it('UpdateQueryBuilder should clear where', () => {
      const query = ctx.db
        .updateTable('person')
        .set({ gender: 'other' })
        .where('gender', '=', 'other')
        .clearWhere()

      testSql(query, dialect, {
        postgres: {
          sql: `update "person" set "gender" = $1`,
          parameters: ['other'],
        },
        mysql: {
          sql: 'update `person` set `gender` = ?',
          parameters: ['other'],
        },
        mssql: {
          sql: `update "person" set "gender" = @1`,
          parameters: ['other'],
        },
        sqlite: {
          sql: `update "person" set "gender" = ?`,
          parameters: ['other'],
        },
      })
    })

    it('DeleteQueryBuilder should clear where', () => {
      const query = ctx.db
        .deleteFrom('person')
        .where('gender', '=', 'other')
        .clearWhere()

      testSql(query, dialect, {
        postgres: {
          sql: `delete from "person"`,
          parameters: [],
        },
        mysql: {
          sql: 'delete from `person`',
          parameters: [],
        },
        mssql: {
          sql: `delete from "person"`,
          parameters: [],
        },
        sqlite: {
          sql: `delete from "person"`,
          parameters: [],
        },
      })
    })

    it('InsertQueryBuilder should clear returning', () => {
      const query = ctx.db
        .insertInto('person')
        .values({ first_name: 'Bruce', last_name: 'Willis', gender: 'male' })
        .returning(['first_name'])
        .clearReturning()

      testSql(query, dialect, {
        postgres: {
          sql: `insert into "person" ("first_name", "last_name", "gender") values ($1, $2, $3)`,
          parameters: ['Bruce', 'Willis', 'male'],
        },
        mysql: {
          sql: 'insert into `person` (`first_name`, `last_name`, `gender`) values (?, ?, ?)',
          parameters: ['Bruce', 'Willis', 'male'],
        },
        mssql: {
          sql: `insert into "person" ("first_name", "last_name", "gender") values (@1, @2, @3)`,
          parameters: ['Bruce', 'Willis', 'male'],
        },
        sqlite: {
          sql: `insert into "person" ("first_name", "last_name", "gender") values (?, ?, ?)`,
          parameters: ['Bruce', 'Willis', 'male'],
        },
      })
    })

    it('UpdateQueryBuilder should clear returning', () => {
      const query = ctx.db
        .updateTable('person')
        .set({ marital_status: 'married' })
        .where('first_name', '=', 'Bruce')
        .returning(['first_name'])
        .clearReturning()

      testSql(query, dialect, {
        postgres: {
          sql: `update "person" set "marital_status" = $1 where "first_name" = $2`,
          parameters: ['married', 'Bruce'],
        },
        mysql: {
          sql: 'update `person` set `marital_status` = ? where `first_name` = ?',
          parameters: ['married', 'Bruce'],
        },
        mssql: {
          sql: `update "person" set "marital_status" = @1 where "first_name" = @2`,
          parameters: ['married', 'Bruce'],
        },
        sqlite: {
          sql: `update "person" set "marital_status" = ? where "first_name" = ?`,
          parameters: ['married', 'Bruce'],
        },
      })
    })

    it('DeleteQueryBuilder should clear returning', () => {
      const query = ctx.db
        .deleteFrom('person')
        .where('first_name', '=', 'James')
        .returning(['first_name'])
        .clearReturning()

      testSql(query, dialect, {
        postgres: {
          sql: `delete from "person" where "first_name" = $1`,
          parameters: ['James'],
        },
        mysql: {
          sql: 'delete from `person` where `first_name` = ?',
          parameters: ['James'],
        },
        mssql: {
          sql: `delete from "person" where "first_name" = @1`,
          parameters: ['James'],
        },
        sqlite: {
          sql: `delete from "person" where "first_name" = ?`,
          parameters: ['James'],
        },
      })
    })

    it('should clear orderBy', () => {
      const query = ctx.db
        .selectFrom('person')
        .selectAll()
        .orderBy('id')
        .clearOrderBy()

      testSql(query, dialect, {
        postgres: {
          sql: `select * from "person"`,
          parameters: [],
        },
        mysql: {
          sql: 'select * from `person`',
          parameters: [],
        },
        mssql: {
          sql: `select * from "person"`,
          parameters: [],
        },
        sqlite: {
          sql: `select * from "person"`,
          parameters: [],
        },
      })
    })

    it('DeleteQueryBuilder clear orderBy', () => {
      const query = ctx.db
        .deleteFrom('person')
        .where('gender', '=', 'male')
        .orderBy('id')
        .clearOrderBy()

      testSql(query, dialect, {
        postgres: {
          sql: `delete from "person" where "gender" = $1`,
          parameters: ['male'],
        },
        mysql: {
          sql: 'delete from `person` where `gender` = ?',
          parameters: ['male'],
        },
        mssql: {
          sql: `delete from "person" where "gender" = @1`,
          parameters: ['male'],
        },
        sqlite: {
          sql: `delete from "person" where "gender" = ?`,
          parameters: ['male'],
        },
      })
    })

    if (dialect === 'postgres' || dialect === 'mysql' || dialect === 'sqlite') {
      it('should clear limit', () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .limit(100)
          .clearLimit()

        testSql(query, dialect, {
          postgres: {
            sql: `select * from "person"`,
            parameters: [],
          },
          mysql: {
            sql: 'select * from `person`',
            parameters: [],
          },
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: `select * from "person"`,
            parameters: [],
          },
        })
      })

      it('DeleteQueryBuilder should clear limit', () => {
        const query = ctx.db
          .deleteFrom('person')
          .where('gender', '=', 'male')
          .limit(1)
          .clearLimit()

        testSql(query, dialect, {
          postgres: {
            sql: `delete from "person" where "gender" = $1`,
            parameters: ['male'],
          },
          mysql: {
            sql: 'delete from `person` where `gender` = ?',
            parameters: ['male'],
          },
          mssql: NOT_SUPPORTED,
          sqlite: {
            sql: `delete from "person" where "gender" = ?`,
            parameters: ['male'],
          },
        })
      })
    }

    it('should clear offset', () => {
      const query = ctx.db
        .selectFrom('person')
        .selectAll()
        .$call(limit(1, dialect))
        .offset(100)
        .clearOffset()

      testSql(query, dialect, {
        postgres: {
          sql: `select * from "person" limit $1`,
          parameters: [1],
        },
        mysql: {
          sql: 'select * from `person` limit ?',
          parameters: [1],
        },
        mssql: {
          sql: `select top(1) * from "person"`,
          parameters: [],
        },
        sqlite: {
          sql: `select * from "person" limit ?`,
          parameters: [1],
        },
      })
    })
  })
}
