import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
} from './test-setup'

const TEST_TABLE = 'test'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: schema`, () => {
    let ctx: TestContext

    before(async () => {
      ctx = await initTest(dialect)
    })

    afterEach(async () => {
      await ctx.db.schema.dropTableIfExists(TEST_TABLE).execute()
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    describe('create table', () => {
      it('should create a table with all data types', async () => {
        const builder = ctx.db.schema
          .createTable(TEST_TABLE)
          .integer('a', (col) => col.primary().increments())
          .integer('b', (col) => col.references('test.a').onDelete('cascade'))
          .string('c')
          .string('d', 10)
          .bigInteger('e', (col) => col.unique().notNullable())
          .double('f')
          .float('g')
          .text('h')
          .specificType('i', 'varchar(123)')
          .numeric('j', 6, 2)
          .decimal('k', 8, 4)
          .boolean('l')

        testSql(builder, dialect, {
          postgres: {
            sql: [
              `create table "test"`,
              `("a" serial primary key,`,
              `"b" integer references "test"("a") on delete cascade,`,
              `"c" varchar(255),`,
              `"d" varchar(10),`,
              `"e" bigint not null unique,`,
              `"f" double precision,`,
              `"g" real,`,
              `"h" text,`,
              `"i" varchar(123),`,
              `"j" numeric(6, 2),`,
              `"k" decimal(8, 4),`,
              `"l" boolean)`,
            ],
            bindings: [],
          },
        })

        await builder.execute()
      })

      if (dialect === 'postgres') {
        it('bigInteger increments key should create a bigserial column', async () => {
          const builder = ctx.db.schema
            .createTable(TEST_TABLE)
            .bigInteger('a', (col) => col.primary().increments())

          testSql(builder, dialect, {
            postgres: {
              sql: `create table "test" ("a" bigserial primary key)`,
              bindings: [],
            },
          })

          await builder.execute()
        })
      }
    })

    describe('create index', () => {
      it('should create an index', async () => {
        await ctx.db.schema
          .createTable(TEST_TABLE)
          .bigInteger('id', (col) => col.primary().increments())
          .string('name')
          .execute()

        const builder = ctx.db.schema
          .createIndex(`${TEST_TABLE}_name_index`)
          .on(TEST_TABLE)
          .column('name')

        testSql(builder, dialect, {
          postgres: {
            sql: `create index "test_name_index" on "test" ("name")`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      it('should create a unique index', async () => {
        await ctx.db.schema
          .createTable(TEST_TABLE)
          .bigInteger('id', (col) => col.primary().increments())
          .string('name')
          .execute()

        const builder = ctx.db.schema
          .createIndex(`${TEST_TABLE}_name_index`)
          .unique()
          .on(TEST_TABLE)
          .column('name')

        testSql(builder, dialect, {
          postgres: {
            sql: `create unique index "test_name_index" on "test" ("name")`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      it('should create an index with a type', async () => {
        await ctx.db.schema
          .createTable(TEST_TABLE)
          .bigInteger('id', (col) => col.primary().increments())
          .string('name')
          .execute()

        const builder = ctx.db.schema
          .createIndex(`${TEST_TABLE}_name_index`)
          .on(TEST_TABLE)
          .using('hash')
          .column('name')

        testSql(builder, dialect, {
          postgres: {
            sql: `create index "test_name_index" on "test" using hash ("name")`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      it('should create an index for multiple columns', async () => {
        await ctx.db.schema
          .createTable(TEST_TABLE)
          .bigInteger('id', (col) => col.primary().increments())
          .string('first_name')
          .string('last_name')
          .execute()

        const builder = ctx.db.schema
          .createIndex(`${TEST_TABLE}_name_index`)
          .on(TEST_TABLE)
          .columns(['first_name', 'last_name'])

        testSql(builder, dialect, {
          postgres: {
            sql: `create index "test_name_index" on "test" ("first_name", "last_name")`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      it('should create an index for an expression', async () => {
        await ctx.db.schema
          .createTable(TEST_TABLE)
          .bigInteger('id', (col) => col.primary().increments())
          .string('name')
          .execute()

        const builder = ctx.db.schema
          .createIndex(`${TEST_TABLE}_name_index`)
          .on(TEST_TABLE)
          .expression(`name < 'Sami'`)

        testSql(builder, dialect, {
          postgres: {
            sql: `create index "test_name_index" on "test" ((name < 'Sami'))`,
            bindings: [],
          },
        })

        await builder.execute()
      })
    })
  })
}
