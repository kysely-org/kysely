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

    afterEach(async () => {
      await ctx.db.withSchema('mammals').deleteFrom('pet').execute()
      await clearDatabase(ctx)
    })

    after(async () => {
      await dropTables()
      await destroyTest(ctx)
    })

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
        .innerJoin('pet', 'pet.id', 'p.id')
        .selectAll()

      testSql(query, dialect, {
        postgres: {
          sql: 'select * from "mammals"."pet" as "p" inner join "mammals"."pet" on "mammals"."pet"."id" = "p"."id"',
          bindings: [],
        },
      })

      await query.execute()
    })

    it('should add schema for aliased joins', async () => {
      const query = ctx.db
        .withSchema('mammals')
        .selectFrom('pet as p1')
        .innerJoin('pet as p2', 'p1.id', 'p2.id')
        .selectAll()

      testSql(query, dialect, {
        postgres: {
          sql: 'select * from "mammals"."pet" as "p1" inner join "mammals"."pet" as "p2" on "p1"."id" = "p2"."id"',
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

    async function createTables(): Promise<void> {
      await ctx.db.raw('create schema if not exists mammals').execute()
      await ctx.db.schema
        .createTable('mammals.pet')
        .integer('id', (col) => col.increments().primary())
        .string('name', (col) => col.unique())
        .integer('owner_id', (col) =>
          col.references('person.id').onDelete('cascade')
        )
        .string('species')
        .execute()
    }

    async function dropTables(): Promise<void> {
      await ctx.db.schema.dropTable('mammals.pet').ifExists().execute()
      await ctx.db.raw('drop schema if exists mammals').execute()
    }
  })
}
