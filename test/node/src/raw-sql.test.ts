import { sql, CompiledQuery } from '../../../'

import {
  DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  insertDefaultDataSet,
  testSql,
  NOT_SUPPORTED,
  expect,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: raw sql`, () => {
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

    it('substitutions should be interpreted as parameters by default', async () => {
      const query = ctx.db
        .selectFrom('person')
        .selectAll()
        .where(sql<boolean>`first_name between ${'A'} and ${'B'}`)

      testSql(query, dialect, {
        postgres: {
          sql: 'select * from "person" where first_name between $1 and $2',
          parameters: ['A', 'B'],
        },
        mysql: {
          sql: 'select * from `person` where first_name between ? and ?',
          parameters: ['A', 'B'],
        },
        mssql: NOT_SUPPORTED,
        sqlite: {
          sql: 'select * from "person" where first_name between ? and ?',
          parameters: ['A', 'B'],
        },
      })

      await query.execute()
    })

    it('sql.unsafeLiteral should turn substitutions from parameters into literal values', async () => {
      const query = ctx.db
        .selectFrom('person')
        .selectAll()
        .where(
          sql<boolean>`first_name between ${sql.lit('A')} and ${sql.lit('B')}`
        )

      testSql(query, dialect, {
        postgres: {
          sql: `select * from "person" where first_name between 'A' and 'B'`,
          parameters: [],
        },
        mysql: {
          sql: "select * from `person` where first_name between 'A' and 'B'",
          parameters: [],
        },
        mssql: NOT_SUPPORTED,
        sqlite: {
          sql: `select * from "person" where first_name between 'A' and 'B'`,
          parameters: [],
        },
      })

      await query.execute()
    })

    it('sql.id should turn substitutions from parameters into identifiers', async () => {
      const query = ctx.db
        .selectFrom('person')
        .selectAll()
        .where(sql<boolean>`${sql.id('first_name')} between ${'A'} and ${'B'}`)

      testSql(query, dialect, {
        postgres: {
          sql: 'select * from "person" where "first_name" between $1 and $2',
          parameters: ['A', 'B'],
        },
        mysql: {
          sql: 'select * from `person` where `first_name` between ? and ?',
          parameters: ['A', 'B'],
        },
        mssql: NOT_SUPPORTED,
        sqlite: {
          sql: 'select * from "person" where "first_name" between ? and ?',
          parameters: ['A', 'B'],
        },
      })

      await query.execute()
    })

    if (dialect == 'postgres') {
      it('sql.id should separate multiple arguments by dots', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where(
            sql<boolean>`${sql.id(
              'public',
              'person',
              'first_name'
            )} between ${'A'} and ${'B'}`
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where "public"."person"."first_name" between $1 and $2',
            parameters: ['A', 'B'],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    }

    it('sql.ref should turn substitutions from parameters into column references', async () => {
      const query = ctx.db
        .selectFrom('person')
        .selectAll()
        .where(sql<boolean>`${sql.ref('first_name')} between ${'A'} and ${'B'}`)

      testSql(query, dialect, {
        postgres: {
          sql: 'select * from "person" where "first_name" between $1 and $2',
          parameters: ['A', 'B'],
        },
        mysql: {
          sql: 'select * from `person` where `first_name` between ? and ?',
          parameters: ['A', 'B'],
        },
        mssql: NOT_SUPPORTED,
        sqlite: {
          sql: 'select * from "person" where "first_name" between ? and ?',
          parameters: ['A', 'B'],
        },
      })

      await query.execute()
    })

    if (dialect === 'postgres') {
      it('sql.ref should support schemas and table names', async () => {
        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where(
            sql<boolean>`${sql.ref(
              'public.person.first_name'
            )} between ${'A'} and ${'B'}`
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where "public"."person"."first_name" between $1 and $2',
            parameters: ['A', 'B'],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    }

    it('sql.table should turn substitutions from parameters into table references', async () => {
      const query = ctx.db
        .selectFrom(sql`${sql.table('person')}`.as('person'))
        .selectAll()

      testSql(query, dialect, {
        postgres: {
          sql: 'select * from "person" as "person"',
          parameters: [],
        },
        mysql: {
          sql: 'select * from `person` as `person`',
          parameters: [],
        },
        mssql: NOT_SUPPORTED,
        sqlite: {
          sql: 'select * from "person" as "person"',
          parameters: [],
        },
      })

      await query.execute()
    })

    if (dialect === 'postgres') {
      it('sql.table should support schemas', async () => {
        const query = ctx.db
          .selectFrom(sql`${sql.table('public.person')}`.as('person'))
          .selectAll()

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "public"."person" as "person"',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    }

    it('sql.join should turn substitutions from parameters into lists of things', async () => {
      const names = ['Jennifer', 'Arnold']

      const query = ctx.db
        .selectFrom('person')
        .selectAll()
        .where(sql<boolean>`first_name in (${sql.join(names)})`)

      testSql(query, dialect, {
        postgres: {
          sql: 'select * from "person" where first_name in ($1, $2)',
          parameters: names,
        },
        mysql: {
          sql: 'select * from `person` where first_name in (?, ?)',
          parameters: names,
        },
        mssql: NOT_SUPPORTED,
        sqlite: {
          sql: 'select * from "person" where first_name in (?, ?)',
          parameters: names,
        },
      })

      await query.execute()
    })

    if (dialect === 'postgres') {
      it('second argument of sql.join should specify the separator', async () => {
        const names = ['Jennifer', 'Arnold', 'Sylvester']

        const query = ctx.db
          .selectFrom('person')
          .selectAll()
          .where(
            sql<boolean>`first_name in (${sql.join(names, sql`::varchar,`)})`
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "person" where first_name in ($1::varchar,$2::varchar,$3)',
            parameters: names,
          },
          mysql: NOT_SUPPORTED,
          mssql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    }

    if (dialect === 'postgres') {
      it('CompiledQuery should support raw query with parameters', async () => {
        const query = CompiledQuery.raw(
          'select * from "person" where "public"."person"."first_name" between $1 and $2',
          ['A', 'B']
        )
        expect(query.sql).to.equal(
          'select * from "person" where "public"."person"."first_name" between $1 and $2'
        )
        expect(query.parameters).to.deep.equal(['A', 'B'])
        await ctx.db.executeQuery(query)
      })
    }

    it('raw sql kitchen sink', async () => {
      const result = await sql`insert into ${sql.table('toy')} (${sql.join([
        sql.ref('name'),
        sql.ref('pet_id'),
        sql.ref('price'),
      ])}) select ${sql.join([
        sql.lit('Wheel').as('name'),
        sql.ref('id'),
        sql.lit(9.99).as('price'),
      ])} from ${sql.table('pet')} where ${sql.ref(
        'name'
      )} = ${'Hammo'}`.execute(ctx.db)

      const wheel = await ctx.db
        .selectFrom('toy')
        .where('name', '=', 'Wheel')
        .selectAll()
        .executeTakeFirstOrThrow()

      expect(wheel.name).to.equal('Wheel')
      expect(wheel.pet_id).to.be.a('number')
      expect(wheel.price).to.equal(9.99)
    })
  })
}
