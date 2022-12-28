import { BUILT_IN_DIALECTS, initTest, TestContext, testSql } from './test-setup'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect} clear`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    it('should clear select', function () {
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
        sqlite: {
          sql: `select "id" from "person"`,
          parameters: [],
        },
      })
    })

    it('SelectQueryBuilder should clear where', function () {
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
        sqlite: {
          sql: `select * from "person"`,
          parameters: [],
        },
      })
    })

    it('OnConflictBuilder should clear where', function () {
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
        sqlite: {
          sql: `insert into "person" on conflict do nothing`,
          parameters: [],
        },
      })
    })

    it('OnConflictUpdateBuilder should clear where', function () {
      const query = ctx.db
        .insertInto('person')
        .onConflict((b) =>
          b
            .doUpdateSet({ gender: 'other' })
            .where('gender', '=', 'male')
            .clearWhere()
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
        sqlite: {
          sql: `insert into "person" on conflict do update set "gender" = ?`,
          parameters: ['other'],
        },
      })
    })

    it('UpdateQueryBuilder should clear where', function () {
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
        sqlite: {
          sql: `update "person" set "gender" = ?`,
          parameters: ['other'],
        },
      })
    })

    it('DeleteQueryBuilder should clear where', function () {
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
        sqlite: {
          sql: `delete from "person"`,
          parameters: [],
        },
      })
    })

    it('should clear orderBy', function () {
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
        sqlite: {
          sql: `select * from "person"`,
          parameters: [],
        },
      })
    })

    it('should clear limit', function () {
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
        sqlite: {
          sql: `select * from "person"`,
          parameters: [],
        },
      })
    })

    it('should clear offset', function () {
      const query = ctx.db
        .selectFrom('person')
        .selectAll()
        .limit(1)
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
        sqlite: {
          sql: `select * from "person" limit ?`,
          parameters: [1],
        },
      })
    })
  })
}
