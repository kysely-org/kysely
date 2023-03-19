import { Generated, Kysely, RawBuilder, sql } from '../../../'
import {
  jsonArrayFrom,
  jsonObjectFrom,
  jsonbBuildObject,
} from '../../../helpers/postgres'

import {
  destroyTest,
  initTest,
  TestContext,
  expect,
  Database,
  insertDefaultDataSet,
  clearDatabase,
  DIALECTS,
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

if (DIALECTS.includes('postgres')) {
  const dialect = 'postgres' as const

  describe(`postgres json tests`, () => {
    let ctx: TestContext
    let db: Kysely<Database & { json_table: JsonTable }>

    before(async function () {
      ctx = await initTest(this, dialect)

      await ctx.db.schema
        .createTable('json_table')
        .ifNotExists()
        .addColumn('id', 'serial', (col) => col.primaryKey())
        .addColumn('data', 'jsonb')
        .execute()

      db = ctx.db.withTables<{ json_table: JsonTable }>()
    })

    beforeEach(async () => {
      await insertDefaultDataSet(ctx)
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
        .returning('data')
        .executeTakeFirstOrThrow()

      expect(result.data).to.eql({
        number_field: 1,
        nested: {
          string_field: 'a',
        },
      })
    })

    it('should select subqueries as nested jsonb objects', async () => {
      const query = db.selectFrom('person').select([
        'person.first_name',

        // Nest all person's pets.
        (eb) =>
          jsonArrayFrom(
            eb
              .selectFrom('pet')
              .select(['name', 'species'])
              .whereRef('owner_id', '=', 'person.id')
              .orderBy('pet.name')
          ).as('pets'),

        // Nest the first found dog the person owns. Only select specific fields
        // and store it under a `doggo` field.
        (eb) =>
          jsonObjectFrom(
            eb
              .selectFrom('pet')
              .select('name as doggo_name')
              .whereRef('owner_id', '=', 'person.id')
              .where('species', '=', 'dog')
              .orderBy('name')
              .limit(1)
          ).as('doggo'),

        // Nest an object that holds the person's formatted name.
        (eb) =>
          jsonbBuildObject({
            first: eb.ref('first_name'),
            last: eb.ref('last_name'),
            full: sql<string>`first_name || ' ' || last_name`,
          }).as('name'),
      ])

      const res = await query.execute()
      expect(res).to.eql([
        {
          first_name: 'Jennifer',
          pets: [{ name: 'Catto', species: 'cat' }],
          doggo: null,
          name: {
            last: 'Aniston',
            first: 'Jennifer',
            full: 'Jennifer Aniston',
          },
        },
        {
          first_name: 'Arnold',
          pets: [{ name: 'Doggo', species: 'dog' }],
          doggo: { doggo_name: 'Doggo' },
          name: {
            last: 'Schwarzenegger',
            first: 'Arnold',
            full: 'Arnold Schwarzenegger',
          },
        },
        {
          first_name: 'Sylvester',
          pets: [{ name: 'Hammo', species: 'hamster' }],
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
