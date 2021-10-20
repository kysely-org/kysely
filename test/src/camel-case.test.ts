import { CamelCasePlugin, Kysely } from '../../'
import {
  BUILT_IN_DIALECTS,
  destroyTest,
  initTest,
  TestContext,
  testSql,
  expect,
  TEST_INIT_TIMEOUT,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: camel case test`, () => {
    let ctx: TestContext
    let camelDb: Kysely<CamelDatabase>

    interface CamelPerson {
      id: number
      firstName: string
      lastName: string
    }

    interface CamelDatabase {
      camelPerson: CamelPerson
    }

    before(async function () {
      this.timeout(TEST_INIT_TIMEOUT)
      ctx = await initTest(dialect)

      camelDb = new Kysely<CamelDatabase>({
        ...ctx.config,
        plugins: [new CamelCasePlugin()],
      })

      await camelDb.schema.dropTable('camelPerson').ifExists().execute()
      await camelDb.schema
        .createTable('camelPerson')
        .addColumn('id', 'integer', (col) => col.increments().primaryKey())
        .addColumn('firstName', 'varchar(255)')
        .addColumn('lastName', 'varchar(255)')
        .execute()
    })

    beforeEach(async () => {
      await camelDb
        .insertInto('camelPerson')
        .values([
          {
            id: ctx.db.generated,
            firstName: 'Jennifer',
            lastName: 'Aniston',
          },
          {
            id: ctx.db.generated,
            firstName: 'Arnold',
            lastName: 'Schwarzenegger',
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

    it('should have created the table and its columns in snake_case', async () => {
      const result = await ctx.db
        .raw<any>('select * from camel_person')
        .execute()

      expect(result.rows).to.have.length(2)
      expect(result.rows![0].id).to.be.a('number')
      expect(result.rows![0].first_name).to.be.a('string')
      expect(result.rows![0].last_name).to.be.a('string')
    })

    it('should convert a select query between camelCase and snake_case', async () => {
      const query = camelDb
        .selectFrom('camelPerson')
        .select('camelPerson.firstName')
        .innerJoin(
          'camelPerson as camelPerson2',
          'camelPerson2.id',
          'camelPerson.id'
        )
        .orderBy('firstName')

      testSql(query, dialect, {
        postgres: {
          sql: [
            `select "camel_person"."first_name"`,
            `from "camel_person"`,
            `inner join "camel_person" as "camel_person2" on "camel_person2"."id" = "camel_person"."id"`,
            `order by "first_name" asc`,
          ],
          bindings: [],
        },
        mysql: {
          sql: [
            'select `camel_person`.`first_name`',
            'from `camel_person`',
            'inner join `camel_person` as `camel_person2` on `camel_person2`.`id` = `camel_person`.`id`',
            'order by `first_name` asc',
          ],
          bindings: [],
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
          .orderBy('firstName')

        testSql(query, dialect, {
          postgres: {
            sql: [
              `select "camel_person"."first_name"`,
              `from "camel_person"`,
              `inner join "camel_person" as "camel_person2" on "camel_person2"."id" = "camel_person"."id"`,
              `order by "first_name" asc`,
            ],
            bindings: [],
          },
          mysql: {
            sql: [
              'select `camel_person`.`first_name`',
              'from `camel_person`',
              'inner join `camel_person` as `camel_person2` on `camel_person2`.`id` = `camel_person`.`id`',
              'order by `first_name` asc',
            ],
            bindings: [],
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
  })
}
