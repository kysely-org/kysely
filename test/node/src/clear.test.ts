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

    it('should clear where', function () {
      const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where("gender","=","other")
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

    it('should clear orderBy', function () {
      const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .orderBy("id")
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

    it('should clear limit', function (){
      const query = ctx.db.selectFrom("person").selectAll().limit(100).clearLimit();
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

    it('should clear offset', function (){
      const query = ctx.db.selectFrom("person").selectAll().limit(1).offset(100).clearOffset();
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
