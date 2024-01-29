import { Kysely } from '../../../'

import {
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  NOT_SUPPORTED,
  DIALECTS,
  Database,
} from './test-setup.js'

for (const dialect of DIALECTS.filter((dialect) => dialect !== 'mssql')) {
  describe(`${dialect}: join using`, () => {
    let ctx: TestContext
    let db: Kysely<Database & { t1: T1; t2: T2 }>

    interface T1 {
      num: number
      name: string
    }
    interface T2 {
      num: number
      value: string
    }

    before(async function () {
      ctx = await initTest(this, dialect)
      db = ctx.db.withTables<{ t1: T1; t2: T2 }>()

      // sample data from https://www.postgresql.org/docs/current/queries-table-expressions.html
      await db.schema
        .createTable('t1')
        .ifNotExists()
        .addColumn('num', 'integer')
        .addColumn('name', 'varchar(32)')
        .execute()

      await db.schema
        .createTable('t2')
        .ifNotExists()
        .addColumn('num', 'integer')
        .addColumn('value', 'varchar(32)')
        .execute()

      await db
        .insertInto('t1')
        .values([
          { num: 1, name: 'a' },
          { num: 2, name: 'b' },
          { num: 3, name: 'c' },
        ])
        .execute()

      await db
        .insertInto('t2')
        .values([
          { num: 1, value: 'xxx' },
          { num: 3, value: 'yyy' },
          { num: 5, value: 'zzz' },
        ])
        .execute()
    })

    after(async () => {
      await db.schema.dropTable('t1').ifExists().execute()
      await db.schema.dropTable('t2').ifExists().execute()
      await destroyTest(ctx)
    })

    it(`should inner join a table`, async () => {
      const query = db
        .selectFrom('t1')
        .innerJoin('t2', (join) => join.using(['num']))
        .selectAll()
        .orderBy('num')

      testSql(query, dialect, {
        postgres: {
          sql: `select * from "t1" inner join "t2" using ("num") order by "num"`,
          parameters: [],
        },
        mysql: {
          sql: `select * from \`t1\` inner join \`t2\` using (\`num\`) order by \`num\``,
          parameters: [],
        },
        mssql: NOT_SUPPORTED,
        sqlite: {
          sql: `select * from "t1" inner join "t2" using ("num") order by "num"`,
          parameters: [],
        },
      })

      const result = await query.execute()
      expect(result).to.have.length(2)
      expect(result).to.containSubset([
        { num: 1, name: 'a', value: 'xxx' },
        { num: 3, name: 'c', value: 'yyy' },
      ])
    })

    it(`should left join a table`, async () => {
      const query = db
        .selectFrom('t1')
        .leftJoin('t2', (join) => join.using(['num']))
        .selectAll()
        .orderBy('num')

      testSql(query, dialect, {
        postgres: {
          sql: `select * from "t1" left join "t2" using ("num") order by "num"`,
          parameters: [],
        },
        mysql: {
          sql: `select * from \`t1\` left join \`t2\` using (\`num\`) order by \`num\``,
          parameters: [],
        },
        mssql: NOT_SUPPORTED,
        sqlite: {
          sql: `select * from "t1" left join "t2" using ("num") order by "num"`,
          parameters: [],
        },
      })

      const result = await query.execute()
      expect(result).to.have.length(3)
      expect(result).to.containSubset([
        { num: 1, name: 'a', value: 'xxx' },
        { num: 2, name: 'b', value: null },
        { num: 3, name: 'c', value: 'yyy' },
      ])
    })

    it(`should right join a table`, async () => {
      const query = db
        .selectFrom('t1')
        .rightJoin('t2', (join) => join.using(['num']))
        .selectAll()
        .orderBy('num')

      testSql(query, dialect, {
        postgres: {
          sql: `select * from "t1" right join "t2" using ("num") order by "num"`,
          parameters: [],
        },
        mysql: {
          sql: `select * from \`t1\` right join \`t2\` using (\`num\`) order by \`num\``,
          parameters: [],
        },
        mssql: NOT_SUPPORTED,
        sqlite: {
          sql: `select * from "t1" right join "t2" using ("num") order by "num"`,
          parameters: [],
        },
      })

      const result = await query.execute()
      expect(result).to.have.length(3)
      expect(result).to.containSubset([
        { num: 1, name: 'a', value: 'xxx' },
        { num: 3, name: 'c', value: 'yyy' },
        { num: 5, name: null, value: 'zzz' },
      ])
    })
  })
}
