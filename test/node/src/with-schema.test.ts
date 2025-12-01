import type { Kysely } from '../../..'
import {
  clearDatabase,
  destroyTest,
  initTest,
  type TestContext,
  testSql,
  NOT_SUPPORTED,
  createTableWithId,
  DIALECTS,
  insert,
  limit,
  type Database,
  type Pet,
} from './test-setup.js'

for (const dialect of DIALECTS.filter(
  (dialect) => dialect === 'postgres' || dialect === 'mssql',
)) {
  describe(`${dialect}: with schema`, () => {
    let ctx: Omit<TestContext, 'db'> & {
      db: Kysely<
        Database & {
          pet_staging: Pet
        }
      >
    }

    before(async function () {
      ctx = (await initTest(this, dialect)) as never
      await dropTables()
      await createTables()
    })

    beforeEach(async () => {
      const personId = await insert(
        ctx as never,
        ctx.db.insertInto('person').values({
          first_name: 'Foo',
          last_name: 'Bar',
          gender: 'other',
        }),
      )

      await ctx.db
        .withSchema('mammals')
        .insertInto('pet')
        .values({
          name: 'Catto',
          owner_id: personId,
          species: 'cat',
        })
        .execute()
    })

    afterEach(async () => {
      await ctx.db.withSchema('mammals').deleteFrom('pet').execute()
      await clearDatabase(ctx as never)
    })

    after(async () => {
      await dropTables()
      await destroyTest(ctx as never)
    })

    describe('select from', () => {
      it('should add schema', async () => {
        const query = ctx.db.withSchema('mammals').selectFrom('pet').selectAll()

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "mammals"."pet"',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'select * from "mammals"."pet"',
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should add schema for joins', async () => {
        const query = ctx.db
          .withSchema('mammals')
          .selectFrom('pet as p')
          .leftJoin('pet', 'pet.id', 'p.id')
          .selectAll()

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "mammals"."pet" as "p" left join "mammals"."pet" on "mammals"."pet"."id" = "p"."id"',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'select * from "mammals"."pet" as "p" left join "mammals"."pet" on "mammals"."pet"."id" = "p"."id"',
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should add schema for aliased joins', async () => {
        const query = ctx.db
          .withSchema('mammals')
          .selectFrom('pet as p1')
          .leftJoin('pet as p2', 'p1.id', 'p2.id')
          .selectAll()

        testSql(query, dialect, {
          postgres: {
            sql: 'select * from "mammals"."pet" as "p1" left join "mammals"."pet" as "p2" on "p1"."id" = "p2"."id"',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'select * from "mammals"."pet" as "p1" left join "mammals"."pet" as "p2" on "p1"."id" = "p2"."id"',
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should not add schema for aliases', async () => {
        const query = ctx.db
          .withSchema('mammals')
          .selectFrom('pet as p')
          .select('p.name')

        testSql(query, dialect, {
          postgres: {
            sql: 'select "p"."name" from "mammals"."pet" as "p"',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'select "p"."name" from "mammals"."pet" as "p"',
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should add schema for subqueries', async () => {
        const query = ctx.db
          .withSchema('mammals')
          .selectFrom('pet')
          .select([
            'pet.name',
            (qb) =>
              qb
                .selectFrom('pet as p')
                .select('name')
                .whereRef('p.id', '=', 'pet.id')
                .as('p_name'),
          ])

        testSql(query, dialect, {
          postgres: {
            sql: [
              'select "mammals"."pet"."name",',
              '(select "name" from "mammals"."pet" as "p" where "p"."id" = "mammals"."pet"."id") as "p_name"',
              'from "mammals"."pet"',
            ],
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: [
              'select "mammals"."pet"."name",',
              '(select "name" from "mammals"."pet" as "p" where "p"."id" = "mammals"."pet"."id") as "p_name"',
              'from "mammals"."pet"',
            ],
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('subqueries should use their own schema if specified', async () => {
        const query = ctx.db
          .withSchema('mammals')
          .selectFrom('pet')
          .select([
            'pet.name',
            (qb) =>
              qb
                .withSchema(dialect === 'postgres' ? 'public' : 'dbo')
                .selectFrom('person')
                .select('first_name')
                .whereRef('pet.owner_id', '=', 'person.id')
                .as('owner_first_name'),
          ])

        testSql(query, dialect, {
          postgres: {
            sql: [
              'select "mammals"."pet"."name",',
              '(select "first_name" from "public"."person" where "mammals"."pet"."owner_id" = "public"."person"."id") as "owner_first_name"',
              'from "mammals"."pet"',
            ],
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: [
              'select "mammals"."pet"."name",',
              '(select "first_name" from "dbo"."person" where "mammals"."pet"."owner_id" = "dbo"."person"."id") as "owner_first_name"',
              'from "mammals"."pet"',
            ],
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      if (dialect === 'postgres') {
        it('should not add schema for json_agg parameters', async () => {
          const query = ctx.db
            .withSchema('mammals')
            .selectFrom('pet')
            .select((eb) => [
              eb.fn.jsonAgg('pet').as('one'),
              eb.fn.jsonAgg(eb.table('pet')).as('two'),
              eb.fn.jsonAgg('pet').orderBy('pet.name', 'desc').as('three'),
            ])

          testSql(query, dialect, {
            postgres: {
              sql: 'select json_agg("pet") as "one", json_agg("pet") as "two", json_agg("pet" order by "mammals"."pet"."name" desc) as "three" from "mammals"."pet"',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await query.execute()
        })

        it('should not add schema for to_json parameters', async () => {
          const query = ctx.db
            .withSchema('mammals')
            .selectFrom('pet')
            .select((eb) => [
              eb.fn.toJson('pet').as('one'),
              eb.fn.toJson(eb.table('pet')).as('two'),
            ])

          testSql(query, dialect, {
            postgres: {
              sql: 'select to_json("pet") as "one", to_json("pet") as "two" from "mammals"."pet"',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await query.execute()
        })
      }
    })

    describe('insert into', () => {
      it('should add schema', async () => {
        const [anyPerson] = await ctx.db
          .selectFrom('person')
          .selectAll()
          .$call(limit(1, dialect))
          .execute()

        const query = ctx.db
          .withSchema('mammals')
          .insertInto('pet')
          .values({
            name: 'Doggo',
            species: 'dog',
            owner_id: anyPerson.id,
          })
          .$call((qb) => (dialect === 'postgres' ? qb.returning('pet.id') : qb))

        testSql(query, dialect, {
          postgres: {
            sql: 'insert into "mammals"."pet" ("name", "species", "owner_id") values ($1, $2, $3) returning "mammals"."pet"."id"',
            parameters: ['Doggo', 'dog', anyPerson.id],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'insert into "mammals"."pet" ("name", "species", "owner_id") values (@1, @2, @3)',
            parameters: ['Doggo', 'dog', anyPerson.id],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    })

    describe('delete from', () => {
      it('should add schema', async () => {
        const query = ctx.db
          .withSchema('mammals')
          .deleteFrom('pet')
          .where('pet.name', '=', 'Doggo')

        testSql(query, dialect, {
          postgres: {
            sql: 'delete from "mammals"."pet" where "mammals"."pet"."name" = $1',
            parameters: ['Doggo'],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'delete from "mammals"."pet" where "mammals"."pet"."name" = @1',
            parameters: ['Doggo'],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      if (dialect === 'postgres') {
        it('should also add schema to using clause', async () => {
          const query = ctx.db
            .withSchema('mammals')
            .deleteFrom('pet')
            .using('pet_staging')
            .whereRef('pet.id', '=', 'pet_staging.id')
            .where('pet.name', '=', 'Doggo')

          testSql(query, dialect, {
            postgres: {
              sql: 'delete from "mammals"."pet" using "mammals"."pet_staging" where "mammals"."pet"."id" = "mammals"."pet_staging"."id" and "mammals"."pet"."name" = $1',
              parameters: ['Doggo'],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await query.execute()
        })
      }
    })

    describe('update', () => {
      it('should add schema', async () => {
        const query = ctx.db
          .withSchema('mammals')
          .updateTable('pet')
          .where('pet.name', '=', 'Doggo')
          .set({ species: 'cat' })

        testSql(query, dialect, {
          postgres: {
            sql: 'update "mammals"."pet" set "species" = $1 where "mammals"."pet"."name" = $2',
            parameters: ['cat', 'Doggo'],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'update "mammals"."pet" set "species" = @1 where "mammals"."pet"."name" = @2',
            parameters: ['cat', 'Doggo'],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    })

    describe('merge into', () => {
      it('should add schema', async () => {
        const query = ctx.db
          .withSchema('mammals')
          .mergeInto('pet as target')
          .using('pet_staging as source', 'source.id', 'target.id')
          .whenMatched()
          .thenDelete()

        testSql(query, dialect, {
          postgres: {
            sql: 'merge into "mammals"."pet" as "target" using "mammals"."pet_staging" as "source" on "source"."id" = "target"."id" when matched then delete',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'merge into "mammals"."pet" as "target" using "mammals"."pet_staging" as "source" on "source"."id" = "target"."id" when matched then delete;',
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    })

    describe('with', () => {
      it('should not add schema for common table expression names', async () => {
        const query = ctx.db
          .withSchema('mammals')
          .with('doggo', (db) =>
            db.selectFrom('pet').where('pet.name', '=', 'Doggo').selectAll(),
          )
          .selectFrom('doggo')
          .selectAll()

        testSql(query, dialect, {
          postgres: {
            sql: 'with "doggo" as (select * from "mammals"."pet" where "mammals"."pet"."name" = $1) select * from "doggo"',
            parameters: ['Doggo'],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'with "doggo" as (select * from "mammals"."pet" where "mammals"."pet"."name" = @1) select * from "doggo"',
            parameters: ['Doggo'],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })

      it('should not add schema for common table expression names in subqueries', async () => {
        const query = ctx.db
          .withSchema('mammals')
          .with('doggo', (qb) =>
            qb.selectFrom('pet').where('name', '=', 'Doggo').select('pet.id'),
          )
          .selectFrom('pet')
          .select((eb) => [
            'pet.id',
            eb.selectFrom('doggo').select('id').as('doggo_id'),
          ])
          .selectAll()

        testSql(query, dialect, {
          postgres: {
            sql: 'with "doggo" as (select "mammals"."pet"."id" from "mammals"."pet" where "name" = $1) select "mammals"."pet"."id", (select "id" from "doggo") as "doggo_id", * from "mammals"."pet"',
            parameters: ['Doggo'],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'with "doggo" as (select "mammals"."pet"."id" from "mammals"."pet" where "name" = @1) select "mammals"."pet"."id", (select "id" from "doggo") as "doggo_id", * from "mammals"."pet"',
            parameters: ['Doggo'],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    })

    describe('create table', () => {
      afterEach(async () => {
        await ctx.db.schema
          .withSchema('mammals')
          .dropTable('foo')
          .ifExists()
          .execute()
      })

      it('should add schema for references', async () => {
        const query = ctx.db.schema
          .withSchema('mammals')
          .createTable('foo')
          .addColumn('bar', 'integer', (col) => col.references('pet.id'))

        testSql(query, dialect, {
          postgres: {
            sql: 'create table "mammals"."foo" ("bar" integer references "mammals"."pet" ("id"))',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'create table "mammals"."foo" ("bar" integer references "mammals"."pet" ("id"))',
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    })

    describe('create index', () => {
      afterEach(async () => {
        await ctx.db.schema
          .withSchema('mammals')
          .dropIndex('pet_id_index')
          .ifExists()
          .execute()
      })

      it('should not add schema for created index', async () => {
        const query = ctx.db.schema
          .withSchema('mammals')
          .createIndex('pet_id_index')
          .column('id')
          .on('pet')

        testSql(query, dialect, {
          postgres: {
            sql: 'create index "pet_id_index" on "mammals"."pet" ("id")',
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: 'create index "pet_id_index" on "mammals"."pet" ("id")',
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    })

    if (dialect === 'postgres') {
      describe('drop index', () => {
        beforeEach(async () => {
          await ctx.db.schema
            .withSchema('mammals')
            .createIndex('pet_id_index')
            .column('id')
            .on('pet')
            .execute()
        })

        it('should add schema for dropped index', async () => {
          const query = ctx.db.schema
            .withSchema('mammals')
            .dropIndex('pet_id_index')

          testSql(query, dialect, {
            postgres: {
              sql: 'drop index "mammals"."pet_id_index"',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await query.execute()
        })
      })
    }

    describe('create view', () => {
      afterEach(async () => {
        await ctx.db.schema
          .withSchema('mammals')
          .dropView('dogs')
          .ifExists()
          .execute()
      })

      it('should add schema for created view', async () => {
        const query = ctx.db.schema
          .withSchema('mammals')
          .createView('dogs')
          .as(ctx.db.selectFrom('pet').where('species', '=', 'dog').selectAll())

        testSql(query, dialect, {
          postgres: {
            sql: `create view "mammals"."dogs" as select * from "mammals"."pet" where "species" = 'dog'`,
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: `create view "mammals"."dogs" as select * from "mammals"."pet" where "species" = 'dog'`,
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    })

    describe('drop view', () => {
      beforeEach(async () => {
        await ctx.db.schema
          .withSchema('mammals')
          .createView('dogs')
          .as(ctx.db.selectFrom('pet').where('species', '=', 'dog').selectAll())
          .execute()
      })

      it('should add schema for dropped view', async () => {
        const query = ctx.db.schema.withSchema('mammals').dropView('dogs')

        testSql(query, dialect, {
          postgres: {
            sql: `drop view "mammals"."dogs"`,
            parameters: [],
          },
          mysql: NOT_SUPPORTED,
          mssql: {
            sql: `drop view "mammals"."dogs"`,
            parameters: [],
          },
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    })

    async function createTables(): Promise<void> {
      await ctx.db.schema
        .createSchema('mammals')
        .$call((qb) => (dialect === 'postgres' ? qb.ifNotExists() : qb))
        .execute()

      await Promise.all(
        ['pet', 'pet_staging'].map(async (tableName) => {
          const table = createTableWithId(
            ctx.db.schema.withSchema('mammals'),
            dialect,
            tableName,
          )

          await table
            .addColumn('name', 'varchar(50)', (col) => col.unique())
            .addColumn('owner_id', 'integer', (col) =>
              col
                .references(
                  dialect === 'postgres' ? 'public.person.id' : 'dbo.person.id',
                )
                .onDelete('cascade'),
            )
            .addColumn('species', 'varchar(50)')
            .execute()
        }),
      )
    }

    async function dropTables(): Promise<void> {
      await Promise.all(
        ['pet', 'pet_staging'].map((tableName) =>
          ctx.db.schema
            .withSchema('mammals')
            .dropTable(tableName)
            .ifExists()
            .execute(),
        ),
      )

      await ctx.db.schema.dropSchema('mammals').ifExists().execute()
    }
  })
}
