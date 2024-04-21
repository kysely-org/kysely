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
  jsonArrayFrom as mssql_jsonArrayFrom,
  jsonObjectFrom as mssql_jsonObjectFrom,
  jsonBuildObject as mssql_jsonBuildObject,
} from '../../../helpers/mssql'
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
  DIALECTS,
  orderBy,
  limit,
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
  mssql: {
    jsonArrayFrom: mssql_jsonArrayFrom,
    jsonObjectFrom: mssql_jsonObjectFrom,
    jsonBuildObject: mssql_jsonBuildObject,
  },
  sqlite: {
    jsonArrayFrom: sqlite_jsonArrayFrom,
    jsonObjectFrom: sqlite_jsonObjectFrom,
    jsonBuildObject: sqlite_jsonBuildObject,
  },
} as const

for (const dialect of DIALECTS) {
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
      } else if (dialect === 'mssql') {
        await sql`if object_id(N'json_table', N'U') is null begin create table json_table (id int primary key identity, data nvarchar(1024)); end;`.execute(
          ctx.db,
        )
      } else {
        await ctx.db.schema
          .createTable('json_table')
          .ifNotExists()
          .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
          .addColumn('data', 'json')
          .execute()
      }

      db = ctx.db.withTables<{ json_table: JsonTable }>()

      if (dialect === 'mssql' || dialect === 'sqlite') {
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

    if (dialect === 'postgres') {
      it('should update json data of a row using the subscript syntax and a raw sql snippet', async () => {
        await db
          .insertInto('json_table')
          .values({
            data: toJson({
              number_field: 1,
              nested: { string_field: 'a' },
            }),
          })
          .executeTakeFirstOrThrow()

        const newValue = Math.random()
        await db
          .updateTable('json_table')
          .set(sql`data['number_field']`, newValue)
          .executeTakeFirstOrThrow()

        const result = await db
          .selectFrom('json_table')
          .select('data')
          .executeTakeFirstOrThrow()

        expect(result.data.number_field).to.equal(newValue)
      })
    }

    if (dialect === 'postgres') {
      it('should aggregate a joined table using json_agg', async () => {
        const res = await db
          .selectFrom('person')
          .innerJoin('pet', 'pet.owner_id', 'person.id')
          .select((eb) => ['first_name', eb.fn.jsonAgg('pet').as('pets')])
          .groupBy('person.first_name')
          .execute()

        expect(res).to.have.length(3)
        expect(res).to.containSubset([
          {
            first_name: 'Jennifer',
            pets: [{ name: 'Catto', species: 'cat' }],
          },
          {
            first_name: 'Arnold',
            pets: [
              {
                name: 'Doggo',
                species: 'dog',
              },
            ],
          },
          {
            first_name: 'Sylvester',
            pets: [{ name: 'Hammo', species: 'hamster' }],
          },
        ])
      })

      it('should aggregate a joined table using json_agg and distinct', async () => {
        const res = await db
          .selectFrom('person')
          .innerJoin('pet', 'pet.owner_id', 'person.id')
          .select((eb) => [
            'first_name',
            eb.fn.jsonAgg('pet').distinct().as('pets'),
          ])
          .groupBy('person.first_name')
          .execute()

        expect(res).to.have.length(3)
        expect(res).to.containSubset([
          {
            first_name: 'Jennifer',
            pets: [{ name: 'Catto', species: 'cat' }],
          },
          {
            first_name: 'Arnold',
            pets: [
              {
                name: 'Doggo',
                species: 'dog',
              },
            ],
          },
          {
            first_name: 'Sylvester',
            pets: [{ name: 'Hammo', species: 'hamster' }],
          },
        ])
      })

      it('should aggregate a subquery using json_agg', async () => {
        const res = await db
          .selectFrom('person')
          .select((eb) => [
            'first_name',
            eb
              .selectFrom('pet')
              .select((eb) => eb.fn.jsonAgg('pet').as('pet'))
              .whereRef('pet.owner_id', '=', 'person.id')
              .as('pets'),
          ])
          .execute()

        expect(res).to.have.length(3)
        expect(res).to.containSubset([
          {
            first_name: 'Jennifer',
            pets: [{ name: 'Catto', species: 'cat' }],
          },
          {
            first_name: 'Arnold',
            pets: [
              {
                name: 'Doggo',
                species: 'dog',
              },
            ],
          },
          {
            first_name: 'Sylvester',
            pets: [{ name: 'Hammo', species: 'hamster' }],
          },
        ])
      })

      it('should aggregate a subquery using json_agg and eb.table', async () => {
        const res = await db
          .selectFrom('person')
          .select((eb) => [
            'first_name',
            eb
              .selectFrom('pet')
              .select((eb) => eb.fn.jsonAgg(eb.table('pet')).as('pet'))
              .whereRef('pet.owner_id', '=', 'person.id')
              .as('pets'),
          ])
          .execute()

        expect(res).to.have.length(3)
        expect(res).to.containSubset([
          {
            first_name: 'Jennifer',
            pets: [{ name: 'Catto', species: 'cat' }],
          },
          {
            first_name: 'Arnold',
            pets: [
              {
                name: 'Doggo',
                species: 'dog',
              },
            ],
          },
          {
            first_name: 'Sylvester',
            pets: [{ name: 'Hammo', species: 'hamster' }],
          },
        ])
      })

      it('should jsonify a joined table using to_json', async () => {
        const res = await db
          .selectFrom('person')
          .innerJoin('pet', 'pet.owner_id', 'person.id')
          .select((eb) => ['first_name', eb.fn.toJson('pet').as('pet')])
          .execute()

        expect(res).to.have.length(3)
        expect(res).to.containSubset([
          {
            first_name: 'Jennifer',
            pet: { name: 'Catto', species: 'cat' },
          },
          {
            first_name: 'Arnold',
            pet: {
              name: 'Doggo',
              species: 'dog',
            },
          },
          {
            first_name: 'Sylvester',
            pet: { name: 'Hammo', species: 'hamster' },
          },
        ])
      })
    }

    it('should select subqueries as nested json objects', async () => {
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
                  .$call(orderBy('toy.name', 'asc', dialect)),
              ).as('toys'),
            ])
            .whereRef('owner_id', '=', 'person.id')
            .$call(orderBy('pet.name', 'asc', dialect)),
        ).as('pets'),

        // Nest the first found dog the person owns
        jsonObjectFrom(
          eb
            .selectFrom('pet')
            .select('name as doggo_name')
            .whereRef('owner_id', '=', 'person.id')
            .where('species', '=', 'dog')
            .orderBy('name', 'asc')
            .$call(limit(1, dialect)),
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
          eb
            .selectFrom('pet')
            .select('id')
            .where(sql<boolean>`1 = 2`),
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
