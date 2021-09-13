import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
} from './test-setup'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: schema`, () => {
    let ctx: TestContext

    before(async () => {
      ctx = await initTest(dialect)
    })

    afterEach(async () => {
      await ctx.db.schema.dropTable('test').ifExists().execute()
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    describe('create table', () => {
      it('should create a table with all data types', async () => {
        const builder = ctx.db.schema
          .createTable('test')
          .addColumn('integer', 'a', (col) => col.primaryKey().increments())
          .addColumn('integer', 'b', (col) =>
            col.references('test.a').onDelete('cascade').check('b < a')
          )
          .addColumn('varchar', 'c')
          .addColumn('varchar(10)', 'd')
          .addColumn('bigint', 'e', (col) => col.unique().notNullable())
          .addColumn('double precision', 'f')
          .addColumn('real', 'g')
          .addColumn('text', 'h')
          .addColumn(ctx.db.raw('varchar(123)'), 'i')
          .addColumn('numeric(6, 2)', 'j')
          .addColumn('decimal(8, 4)', 'k')
          .addColumn('boolean', 'l', (col) =>
            col.notNullable().defaultTo(false)
          )
          .addColumn('date', 'm')
          .addColumn('timestamp with time zone', 'n')

        testSql(builder, dialect, {
          postgres: {
            sql: [
              `create table "test"`,
              `("a" serial primary key,`,
              `"b" integer references "test" ("a") on delete cascade check (b < a),`,
              `"c" varchar,`,
              `"d" varchar(10),`,
              `"e" bigint not null unique,`,
              `"f" double precision,`,
              `"g" real,`,
              `"h" text,`,
              `"i" varchar(123),`,
              `"j" numeric(6, 2),`,
              `"k" decimal(8, 4),`,
              `"l" boolean default false not null,`,
              `"m" date,`,
              `"n" timestamp with time zone)`,
            ],
            bindings: [],
          },
        })

        await builder.execute()
      })

      it('should create a table with unique constraints', async () => {
        const builder = ctx.db.schema
          .createTable('test')
          .addColumn('varchar', 'a')
          .addColumn('varchar', 'b')
          .addColumn('varchar', 'c')
          .addUniqueConstraint(['a', 'b'])
          .addUniqueConstraint(['b', 'c'])

        testSql(builder, dialect, {
          postgres: {
            sql: `create table "test" ("a" varchar, "b" varchar, "c" varchar, unique ("a", "b"), unique ("b", "c"))`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      it('should create a table with check constraints', async () => {
        const builder = ctx.db.schema
          .createTable('test')
          .addColumn('integer', 'a')
          .addColumn('integer', 'b')
          .addColumn('integer', 'c')
          .addCheckConstraint('a > 1')
          .addCheckConstraint('b < c')

        testSql(builder, dialect, {
          postgres: {
            sql: `create table "test" ("a" integer, "b" integer, "c" integer, check (a > 1), check (b < c))`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      it('should add a composite primary key constraint', async () => {
        const builder = ctx.db.schema
          .createTable('test')
          .addColumn('integer', 'a')
          .addColumn('integer', 'b')
          .addPrimaryKeyConstraint(['a', 'b'])

        testSql(builder, dialect, {
          postgres: {
            sql: `create table "test" ("a" integer, "b" integer, primary key ("a", "b"))`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      it("should create a table if it doesn't already exist", async () => {
        const builder = ctx.db.schema
          .createTable('test')
          .ifNotExists()
          .addColumn('integer', 'id', (col) => col.primaryKey().increments())

        testSql(builder, dialect, {
          postgres: {
            sql: `create table if not exists "test" ("id" serial primary key)`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      if (dialect === 'postgres') {
        it('bigInteger increments key should create a bigserial column', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('bigint', 'a', (col) => col.primaryKey().increments())

          testSql(builder, dialect, {
            postgres: {
              sql: `create table "test" ("a" bigserial primary key)`,
              bindings: [],
            },
          })

          await builder.execute()
        })

        it('should create a table in specific schema', async () => {
          const builder = ctx.db.schema
            .createTable('public.test')
            .addColumn('integer', 'id', (col) => col.primaryKey().increments())
            .addColumn('integer', 'foreign_key', (col) =>
              col.references('public.test.id')
            )

          testSql(builder, dialect, {
            postgres: {
              sql: `create table "public"."test" ("id" serial primary key, "foreign_key" integer references "public"."test" ("id"))`,
              bindings: [],
            },
          })

          await builder.execute()
        })
      }
    })

    describe('drop table', () => {
      beforeEach(async () => {
        await ctx.db.schema
          .createTable('test')
          .addColumn('bigint', 'id', (col) => col.primaryKey().increments())
          .execute()
      })

      it('should drop a table', async () => {
        const builder = ctx.db.schema.dropTable('test')

        testSql(builder, dialect, {
          postgres: {
            sql: `drop table "test"`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      it('should drop a table if it exists', async () => {
        const builder = ctx.db.schema.dropTable('test').ifExists()

        testSql(builder, dialect, {
          postgres: {
            sql: `drop table if exists "test"`,
            bindings: [],
          },
        })

        await builder.execute()
      })
    })

    describe('create index', () => {
      beforeEach(async () => {
        await ctx.db.schema
          .createTable('test')
          .addColumn('bigint', 'id', (col) => col.primaryKey().increments())
          .addColumn('varchar', 'first_name')
          .addColumn('varchar', 'last_name')
          .execute()
      })

      it('should create an index', async () => {
        const builder = ctx.db.schema
          .createIndex(`test_first_name_index`)
          .on('test')
          .column('first_name')

        testSql(builder, dialect, {
          postgres: {
            sql: `create index "test_first_name_index" on "test" ("first_name")`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      it('should create a unique index', async () => {
        const builder = ctx.db.schema
          .createIndex(`test_first_name_index`)
          .unique()
          .on('test')
          .column('first_name')

        testSql(builder, dialect, {
          postgres: {
            sql: `create unique index "test_first_name_index" on "test" ("first_name")`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      it('should create an index with a type', async () => {
        const builder = ctx.db.schema
          .createIndex(`test_first_name_index`)
          .on('test')
          .using('hash')
          .column('first_name')

        testSql(builder, dialect, {
          postgres: {
            sql: `create index "test_first_name_index" on "test" using hash ("first_name")`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      it('should create an index for multiple columns', async () => {
        const builder = ctx.db.schema
          .createIndex(`test_name_index`)
          .on('test')
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
        const builder = ctx.db.schema
          .createIndex(`test_first_name_index`)
          .on('test')
          .expression(`first_name < 'Sami'`)

        testSql(builder, dialect, {
          postgres: {
            sql: `create index "test_first_name_index" on "test" ((first_name < 'Sami'))`,
            bindings: [],
          },
        })

        await builder.execute()
      })
    })

    describe('drop index', () => {
      beforeEach(async () => {
        await ctx.db.schema
          .createTable('test')
          .addColumn('bigint', 'id', (col) => col.primaryKey().increments())
          .addColumn('varchar', 'first_name')
          .execute()

        await ctx.db.schema
          .createIndex(`test_first_name_index`)
          .on('test')
          .column('first_name')
          .execute()
      })

      it('should drop an index', async () => {
        const builder = ctx.db.schema.dropIndex(`test_first_name_index`)

        testSql(builder, dialect, {
          postgres: {
            sql: `drop index "test_first_name_index"`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      it('should drop an index if it exists', async () => {
        const builder = ctx.db.schema
          .dropIndex(`test_first_name_index`)
          .ifExists()

        testSql(builder, dialect, {
          postgres: {
            sql: `drop index if exists "test_first_name_index"`,
            bindings: [],
          },
        })

        await builder.execute()
      })
    })
  })
}
