import {
  Generated,
  Kysely,
  RawBuilder,
  sql,
  ParseJSONResultsPlugin,
} from '../../..'
import {
  jsonArrayFrom as pg_jsonArrayFrom,
  jsonObjectFrom as pg_jsonObjectFrom,
  jsonBuildObject as pg_jsonBuildObject,
} from '../../../helpers/postgres'
import {
  jsonArrayFrom as mysql_jsonArrayFrom,
  jsonObjectFrom as mysql_jsonObjectFrom,
  jsonBuildObject as mysql_jsonBuildObject,
} from '../../../helpers/mysql'
import {
  jsonArrayFrom as sqlite_jsonArrayFrom,
  jsonObjectFrom as sqlite_jsonObjectFrom,
  jsonBuildObject as sqlite_jsonBuildObject,
} from '../../../helpers/sqlite'

import {
  destroyTest,
  initTest,
  TestContext,
  expect,
  Database,
  insertDefaultDataSet,
  clearDatabase,
  DIALECTS_WITH_MSSQL,
} from './test-setup.js'

interface JsonTable {
  id: Generated<number>
  data: {
    number_field: number
    nested: {
      string_field: string
    }
  }
}

const jsonFunctions = {
  postgres: {
    jsonArrayFrom: pg_jsonArrayFrom,
    jsonObjectFrom: pg_jsonObjectFrom,
    jsonBuildObject: pg_jsonBuildObject,
  },
  mysql: {
    jsonArrayFrom: mysql_jsonArrayFrom,
    jsonObjectFrom: mysql_jsonObjectFrom,
    jsonBuildObject: mysql_jsonBuildObject,
  },
  // TODO: this is fake, to avoid ts errors.
  mssql: {
    jsonArrayFrom: mysql_jsonArrayFrom,
    jsonObjectFrom: mysql_jsonObjectFrom,
    jsonBuildObject: mysql_jsonBuildObject,
  },
  sqlite: {
    jsonArrayFrom: sqlite_jsonArrayFrom,
    jsonObjectFrom: sqlite_jsonObjectFrom,
    jsonBuildObject: sqlite_jsonBuildObject,
  },
} as const

for (const dialect of DIALECTS_WITH_MSSQL.filter(
  (dialect) => dialect !== 'mssql'
)) {
  const { jsonArrayFrom, jsonObjectFrom, jsonBuildObject } =
    jsonFunctions[dialect]

  describe(`${dialect} json tests`, () => {
    let ctx: TestContext
    let db: Kysely<Database & { json_table: JsonTable }>

    before(async function () {
      ctx = await initTest(this, dialect)

      if (dialect === 'postgres') {
        await ctx.db.schema
          .createTable('json_table')
          .ifNotExists()
          .addColumn('id', 'serial', (col) => col.primaryKey())
          .addColumn('data', 'jsonb')
          .execute()
      } else {
        await ctx.db.schema
          .createTable('json_table')
          .ifNotExists()
          .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
          .addColumn('data', 'json')
          .execute()
      }

      db = ctx.db.withTables<{ json_table: JsonTable }>()

      if (dialect === 'sqlite') {
        db = db.withPlugin(new ParseJSONResultsPlugin())
      }
    })

    beforeEach(async () => {
      await insertDefaultDataSet(ctx)

      // Insert a couple of toys for Doggo.
      for (const name of ['Teddy', 'Rope']) {
        await ctx.db
          .insertInto('toy')
          .values((eb) => ({
            name,
            price: 10,
            pet_id: eb
              .selectFrom('pet')
              .select('id')
              .where('name', '=', 'Doggo'),
          }))
          .execute()
      }
    })

    afterEach(async () => {
      await clearDatabase(ctx)
    })

    afterEach(async () => {
      await db.deleteFrom('json_table').execute()
    })

    after(async () => {
      await ctx.db.schema.dropTable('json_table').ifExists().execute()
      await destroyTest(ctx)
    })

    it('should insert a row with a json value', async () => {
      const result = await db
        .insertInto('json_table')
        .values({
          data: toJson({
            number_field: 1,
            nested: {
              string_field: 'a',
            },
          }),
        })
        .executeTakeFirstOrThrow()

      expect(result.numInsertedOrUpdatedRows).to.equal(1n)
    })

    it('should select subqueries as nested jsonb objects', async () => {
      const query = db.selectFrom('person').select((eb) => [
        'person.first_name',

        // Nest all pets for each person
        jsonArrayFrom(
          eb
            .selectFrom('pet')
            .select((eb) => [
              'name',
              'species',

              // Nest all toys for each pet
              jsonArrayFrom(
                eb
                  .selectFrom('toy')
                  .select('toy.name')
                  .whereRef('toy.pet_id', '=', 'pet.id')
                  .orderBy('toy.name', 'asc')
              ).as('toys'),
            ])
            .whereRef('owner_id', '=', 'person.id')
            .orderBy('pet.name')
        ).as('pets'),

        // Nest the first found dog the person owns
        jsonObjectFrom(
          eb
            .selectFrom('pet')
            .select('name as doggo_name')
            .whereRef('owner_id', '=', 'person.id')
            .where('species', '=', 'dog')
            .orderBy('name')
            .limit(1)
        ).as('doggo'),

        // Nest an object that holds the person's formatted name
        jsonBuildObject({
          first: eb.ref('first_name'),
          last: eb.ref('last_name'),
          full:
            dialect === 'sqlite'
              ? sql<string>`first_name || ' ' || last_name`
              : eb.fn('concat', ['first_name', sql.lit(' '), 'last_name']),
        }).as('name'),

        // Nest an empty list
        jsonArrayFrom(
          eb.selectFrom('pet').select('id').where(sql.lit(false))
        ).as('emptyList'),
      ])

      const res = await query.execute()

      if (dialect === 'mysql') {
        // MySQL json_arrayagg produces an array with undefined order
        // https://dev.mysql.com/doc/refman/8.0/en/aggregate-functions.html#function_json-arrayagg
        res[1].pets[0].toys.sort((a, b) => a.name.localeCompare(b.name))
      }

      expect(res).to.eql([
        {
          first_name: 'Jennifer',
          pets: [{ name: 'Catto', species: 'cat', toys: [] }],
          emptyList: [],
          doggo: null,
          name: {
            last: 'Aniston',
            first: 'Jennifer',
            full: 'Jennifer Aniston',
          },
        },
        {
          first_name: 'Arnold',
          pets: [
            {
              name: 'Doggo',
              species: 'dog',
              toys: [{ name: 'Rope' }, { name: 'Teddy' }],
            },
          ],
          emptyList: [],
          doggo: { doggo_name: 'Doggo' },
          name: {
            last: 'Schwarzenegger',
            first: 'Arnold',
            full: 'Arnold Schwarzenegger',
          },
        },
        {
          first_name: 'Sylvester',
          pets: [{ name: 'Hammo', species: 'hamster', toys: [] }],
          emptyList: [],
          doggo: null,
          name: {
            last: 'Stallone',
            first: 'Sylvester',
            full: 'Sylvester Stallone',
          },
        },
      ])
    })
  })

  function toJson<T>(obj: T): RawBuilder<T> {
    return sql`${JSON.stringify(obj)}`
  }
}
