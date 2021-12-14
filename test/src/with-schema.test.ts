import {
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
  NOT_SUPPORTED,
  TEST_INIT_TIMEOUT,
  createTableWithId,
} from './test-setup.js'

for (const dialect of ['postgres'] as const) {
  describe(`${dialect}: with schema`, () => {
    let ctx: TestContext

    before(async function () {
      this.timeout(TEST_INIT_TIMEOUT)
      ctx = await initTest(dialect)

      await dropTables()
      await createTables()
    })

    beforeEach(async () => {
      const person = await ctx.db
        .insertInto('person')
        .values({
          id: ctx.db.generated,
          first_name: 'Foo',
          last_name: 'Bar',
          gender: 'other',
        })
        .returning('id')
        .executeTakeFirst()

      await ctx.db
        .withSchema('mammals')
        .insertInto('pet')
        .values({
          id: ctx.db.generated,
          name: 'Catto',
          owner_id: person!.id,
          species: 'cat',
        })
        .execute()
    })

    afterEach(async () => {
      await ctx.db.withSchema('mammals').deleteFrom('pet').execute()
      await clearDatabase(ctx)
    })

    after(async () => {
      await dropTables()
      await destroyTest(ctx)
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
                .withSchema('public')
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
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    })

    describe('insert into', () => {
      it('should add schema', async () => {
        const [anyPerson] = await ctx.db
          .selectFrom('person')
          .selectAll()
          .limit(1)
          .execute()

        const query = ctx.db
          .withSchema('mammals')
          .insertInto('pet')
          .values({
            id: ctx.db.generated,
            name: 'Doggo',
            species: 'dog',
            owner_id: anyPerson.id,
          })
          .returning('pet.id')

        testSql(query, dialect, {
          postgres: {
            sql: 'insert into "mammals"."pet" ("name", "species", "owner_id") values ($1, $2, $3) returning "mammals"."pet"."id"',
            parameters: ['Doggo', 'dog', anyPerson.id],
          },
          mysql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })
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
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
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
          sqlite: NOT_SUPPORTED,
        })

        await query.execute()
      })
    })

    async function createTables(): Promise<void> {
      await ctx.db.schema.createSchema('mammals').ifNotExists().execute()

      const table = createTableWithId(
        ctx.db.schema.withSchema('mammals'),
        dialect,
        'pet'
      )

      await table
        .addColumn('name', 'varchar', (col) => col.unique())
        .addColumn('owner_id', 'integer', (col) =>
          col.references('public.person.id').onDelete('cascade')
        )
        .addColumn('species', 'varchar')
        .execute()
    }

    async function dropTables(): Promise<void> {
      await ctx.db.schema
        .withSchema('mammals')
        .dropTable('pet')
        .ifExists()
        .execute()

      await ctx.db.schema.dropSchema('mammals').ifExists().execute()
    }
  })
}
