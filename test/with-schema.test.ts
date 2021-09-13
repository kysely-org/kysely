import {
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
} from './test-setup'

for (const dialect of ['postgres'] as const) {
  describe(`${dialect}: with schema`, () => {
    let ctx: TestContext

    before(async () => {
      ctx = await initTest(dialect)

      await dropTables()
      await createTables()
    })

    beforeEach(async () => {
      await ctx.db
        .withSchema('mammals')
        .insertInto('pet')
        .values({
          name: 'Catto',
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
            bindings: [],
          },
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
            bindings: [],
          },
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
            bindings: [],
          },
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
            bindings: [],
          },
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
                .subQuery('pet as p')
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
            bindings: [],
          },
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
                .subQuery('person')
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
            bindings: [],
          },
        })

        await query.execute()
      })
    })

    describe('insert into', () => {
      it('should add schema', async () => {
        const query = ctx.db
          .withSchema('mammals')
          .insertInto('pet')
          .values({
            name: 'Doggo',
            species: 'dog',
          })
          .returning('pet.id')

        testSql(query, dialect, {
          postgres: {
            sql: 'insert into "mammals"."pet" ("name", "species") values ($1, $2) returning "mammals"."pet"."id"',
            bindings: ['Doggo', 'dog'],
          },
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
            bindings: ['Doggo'],
          },
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
            bindings: ['cat', 'Doggo'],
          },
        })

        await query.execute()
      })
    })

    async function createTables(): Promise<void> {
      await ctx.db.schema.createSchema('mammals').ifNotExists().execute()

      await ctx.db.schema
        .withSchema('mammals')
        .createTable('pet')
        .addColumn('id', 'integer', (col) => col.increments().primaryKey())
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
