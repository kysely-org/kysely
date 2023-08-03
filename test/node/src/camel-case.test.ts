import { CamelCasePlugin, Generated, Kysely, RawBuilder, sql } from '../../../'

import {
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  createTableWithId,
  DIALECTS_WITH_MSSQL,
} from './test-setup.js'

for (const dialect of DIALECTS_WITH_MSSQL) {
  describe(`${dialect}: camel case test`, () => {
    let ctx: TestContext
    let camelDb: Kysely<CamelDatabase>

    interface CamelPerson {
      id: Generated<number>
      firstName: string
      lastName: string
      preferences: {
        disable_emails: boolean
      }
    }

    interface CamelDatabase {
      camelPerson: CamelPerson
    }

    before(async function () {
      ctx = await initTest(this, dialect)

      camelDb = new Kysely<CamelDatabase>({
        ...ctx.config,
        plugins: [new CamelCasePlugin()],
      })

      await camelDb.schema.dropTable('camelPerson').ifExists().execute()
      await createTableWithId(camelDb.schema, dialect, 'camelPerson')
        .addColumn('firstName', 'varchar(255)')
        .addColumn('lastName', 'varchar(255)')
        .addColumn(
          'preferences',
          dialect === 'mssql' ? 'varchar(8000)' : 'json'
        )
        .execute()
    })

    beforeEach(async () => {
      await camelDb
        .insertInto('camelPerson')
        .values([
          {
            firstName: 'Jennifer',
            lastName: 'Aniston',
            preferences: json({ disable_emails: true }),
          },
          {
            firstName: 'Arnold',
            lastName: 'Schwarzenegger',
            preferences: json({ disable_emails: true }),
          },
        ])
        .execute()
    })

    afterEach(async () => {
      await camelDb.deleteFrom('camelPerson').execute()
    })

    after(async () => {
      await camelDb.schema.dropTable('camelPerson').ifExists().execute()
      await camelDb.destroy()
      await destroyTest(ctx)
    })

    // Can't run this test on SQLite because we can't access the same database
    // from the other Kysely instance.
    if (dialect === 'postgres' || dialect === 'mysql' || dialect === 'mssql') {
      it('should have created the table and its columns in snake_case', async () => {
        const result = await sql<any>`select * from camel_person`.execute(
          ctx.db
        )

        expect(result.rows).to.have.length(2)
        expect(result.rows[0].id).to.be.a('number')
        expect(result.rows[0].first_name).to.be.a('string')
        expect(result.rows[0].last_name).to.be.a('string')
      })
    }

    it('should convert a select query between camelCase and snake_case', async () => {
      const query = camelDb
        .selectFrom('camelPerson')
        .select('camelPerson.firstName')
        .innerJoin(
          'camelPerson as camelPerson2',
          'camelPerson2.id',
          'camelPerson.id'
        )
        .orderBy('camelPerson.firstName')

      testSql(query, dialect, {
        postgres: {
          sql: [
            `select "camel_person"."first_name"`,
            `from "camel_person"`,
            `inner join "camel_person" as "camel_person2" on "camel_person2"."id" = "camel_person"."id"`,
            `order by "camel_person"."first_name"`,
          ],
          parameters: [],
        },
        mysql: {
          sql: [
            'select `camel_person`.`first_name`',
            'from `camel_person`',
            'inner join `camel_person` as `camel_person2` on `camel_person2`.`id` = `camel_person`.`id`',
            'order by `camel_person`.`first_name`',
          ],
          parameters: [],
        },
        mssql: {
          sql: [
            `select "camel_person"."first_name"`,
            `from "camel_person"`,
            `inner join "camel_person" as "camel_person2" on "camel_person2"."id" = "camel_person"."id"`,
            `order by "camel_person"."first_name"`,
          ],
          parameters: [],
        },
        sqlite: {
          sql: [
            `select "camel_person"."first_name"`,
            `from "camel_person"`,
            `inner join "camel_person" as "camel_person2" on "camel_person2"."id" = "camel_person"."id"`,
            `order by "camel_person"."first_name"`,
          ],
          parameters: [],
        },
      })

      const result = await query.execute()
      expect(result).to.have.length(2)
      expect(result).to.containSubset([
        { firstName: 'Jennifer' },
        { firstName: 'Arnold' },
      ])
    })

    it('should convert a select query between camelCase and snake_case in a transaction', async () => {
      await camelDb.transaction().execute(async (trx) => {
        const query = trx
          .selectFrom('camelPerson')
          .select('camelPerson.firstName')
          .innerJoin(
            'camelPerson as camelPerson2',
            'camelPerson2.id',
            'camelPerson.id'
          )
          .orderBy('camelPerson.firstName')

        testSql(query, dialect, {
          postgres: {
            sql: [
              `select "camel_person"."first_name"`,
              `from "camel_person"`,
              `inner join "camel_person" as "camel_person2" on "camel_person2"."id" = "camel_person"."id"`,
              `order by "camel_person"."first_name"`,
            ],
            parameters: [],
          },
          mysql: {
            sql: [
              'select `camel_person`.`first_name`',
              'from `camel_person`',
              'inner join `camel_person` as `camel_person2` on `camel_person2`.`id` = `camel_person`.`id`',
              'order by `camel_person`.`first_name`',
            ],
            parameters: [],
          },
          mssql: {
            sql: [
              `select "camel_person"."first_name"`,
              `from "camel_person"`,
              `inner join "camel_person" as "camel_person2" on "camel_person2"."id" = "camel_person"."id"`,
              `order by "camel_person"."first_name"`,
            ],
            parameters: [],
          },
          sqlite: {
            sql: [
              `select "camel_person"."first_name"`,
              `from "camel_person"`,
              `inner join "camel_person" as "camel_person2" on "camel_person2"."id" = "camel_person"."id"`,
              `order by "camel_person"."first_name"`,
            ],
            parameters: [],
          },
        })

        const result = await query.execute()
        expect(result).to.have.length(2)
        expect(result).to.containSubset([
          { firstName: 'Jennifer' },
          { firstName: 'Arnold' },
        ])
      })
    })

    it('should convert alter table query between camelCase and snake_case', async () => {
      const query = camelDb.schema
        .alterTable('camelPerson')
        .addColumn('middleName', 'text', (col) =>
          col.references('camelPerson.firstName')
        )

      testSql(query, dialect, {
        postgres: {
          sql: 'alter table "camel_person" add column "middle_name" text references "camel_person" ("first_name")',
          parameters: [],
        },
        mysql: {
          sql: 'alter table `camel_person` add column `middle_name` text references `camel_person` (`first_name`)',
          parameters: [],
        },
        mssql: {
          sql: 'alter table "camel_person" add "middle_name" text references "camel_person" ("first_name")',
          parameters: [],
        },
        sqlite: {
          sql: 'alter table "camel_person" add column "middle_name" text references "camel_person" ("first_name")',
          parameters: [],
        },
      })
    })

    it('should convert delete from table using query between camelCase and snake_case', async () => {
      const query = camelDb
        .deleteFrom('camelPerson as c')
        .using('camelPerson')
        .where('camelPerson.firstName', '=', 'Arnold')

      testSql(query, dialect, {
        postgres: {
          sql: `delete from "camel_person" as "c" using "camel_person" where "camel_person"."first_name" = $1`,
          parameters: ['Arnold'],
        },
        mysql: {
          sql: 'delete from `camel_person` as `c` using `camel_person` where `camel_person`.`first_name` = ?',
          parameters: ['Arnold'],
        },
        mssql: {
          sql: `delete from "camel_person" as "c" using "camel_person" where "camel_person"."first_name" = @1`,
          parameters: ['Arnold'],
        },
        sqlite: {
          sql: `delete from "camel_person" as "c" using "camel_person" where "camel_person"."first_name" = ?`,
          parameters: ['Arnold'],
        },
      })
    })

    it('should respect maintainNestedObjectKeys', async () => {
      const data = await camelDb
        .withoutPlugins()
        .withPlugin(new CamelCasePlugin({ maintainNestedObjectKeys: true }))
        .selectFrom('camelPerson')
        .selectAll()
        .executeTakeFirstOrThrow()

      if (dialect === 'mssql' || dialect === 'sqlite') {
        data.preferences = JSON.parse(data.preferences.toString())
      }

      expect(data.preferences).to.eql({
        disable_emails: true,
      })
    })
  })
}

function json<T>(obj: T): RawBuilder<T> {
  return sql`${JSON.stringify(obj)}`
}
