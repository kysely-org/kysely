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
          .integer('a', (col) => col.primary().increments())
          .integer('b', (col) =>
            col.references('test.a').onDelete('cascade').check('b < a')
          )
          .string('c')
          .string('d', 10)
          .bigInteger('e', (col) => col.unique().notNullable())
          .double('f')
          .float('g')
          .text('h')
          .specificType('i', 'varchar(123)')
          .numeric('j', 6, 2)
          .decimal('k', 8, 4)
          .boolean('l', (col) => col.notNullable().defaultTo(false))

        testSql(builder, dialect, {
          postgres: {
            sql: [
              `create table "test"`,
              `("a" serial primary key,`,
              `"b" integer references "test" ("a") on delete cascade check (b < a),`,
              `"c" varchar(255),`,
              `"d" varchar(10),`,
              `"e" bigint not null unique,`,
              `"f" double precision,`,
              `"g" real,`,
              `"h" text,`,
              `"i" varchar(123),`,
              `"j" numeric(6, 2),`,
              `"k" decimal(8, 4),`,
              `"l" boolean default false not null)`,
            ],
            bindings: [],
          },
        })

        await builder.execute()
      })

      it('should create a table with unique constraints', async () => {
        const builder = ctx.db.schema
          .createTable('test')
          .string('a')
          .string('b')
          .string('c')
          .unique(['a', 'b'])
          .unique(['b', 'c'])

        testSql(builder, dialect, {
          postgres: {
            sql: `create table "test" ("a" varchar(255), "b" varchar(255), "c" varchar(255), unique ("a", "b"), unique ("b", "c"))`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      it('should create a table with check constraints', async () => {
        const builder = ctx.db.schema
          .createTable('test')
          .integer('a')
          .integer('b')
          .integer('c')
          .check('a > 1')
          .check('b < c')

        testSql(builder, dialect, {
          postgres: {
            sql: `create table "test" ("a" integer, "b" integer, "c" integer, check (a > 1), check (b < c))`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      it("should create a table if it doesn't already exist", async () => {
        const builder = ctx.db.schema
          .createTable('test')
          .ifNotExists()
          .integer('id', (col) => col.primary().increments())

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
            .bigInteger('a', (col) => col.primary().increments())

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
            .integer('id', (col) => col.primary().increments())
            .integer('foreign_key', (col) => col.references('public.test.id'))

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
          .bigInteger('id', (col) => col.primary().increments())
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
          .bigInteger('id', (col) => col.primary().increments())
          .string('first_name')
          .string('last_name')
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
          .bigInteger('id', (col) => col.primary().increments())
          .string('first_name')
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
