import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  testSql,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: schema`, () => {
    let ctx: TestContext

    before(async () => {
      ctx = await initTest(dialect)
      await dropTestTables()
    })

    afterEach(async () => {
      await dropTestTables()
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    describe('create table', () => {
      it('should create a table with all data types', async () => {
        const builder = ctx.db.schema
          .createTable('test')
          .addColumn('a', 'integer', (col) => col.primaryKey().increments())
          .addColumn('b', 'integer', (col) =>
            col.references('test.a').onDelete('cascade').check('b < a')
          )
          .addColumn('c', 'varchar')
          .addColumn('d', 'varchar(10)')
          .addColumn('e', 'bigint', (col) => col.unique().notNull())
          .addColumn('f', 'double precision')
          .addColumn('g', 'real')
          .addColumn('h', 'text')
          .addColumn('i', ctx.db.raw('varchar(123)'))
          .addColumn('j', 'numeric(6, 2)')
          .addColumn('k', 'decimal(8, 4)')
          .addColumn('l', 'boolean', (col) => col.notNull().defaultTo(false))
          .addColumn('m', 'date')
          .addColumn('n', 'timestamp with time zone')
          .addColumn('o', 'uuid', (col) =>
            col.defaultTo(ctx.db.raw('gen_random_uuid()'))
          )

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
              `"n" timestamp with time zone,`,
              `"o" uuid default gen_random_uuid())`
            ],
            bindings: [],
          },
        })

        await builder.execute()
      })

      it('should create a table with unique constraints', async () => {
        const builder = ctx.db.schema
          .createTable('test')
          .addColumn('a', 'varchar')
          .addColumn('b', 'varchar')
          .addColumn('c', 'varchar')
          .addUniqueConstraint('a_b_unique', ['a', 'b'])
          .addUniqueConstraint('b_c_unique', ['b', 'c'])

        testSql(builder, dialect, {
          postgres: {
            sql: `create table "test" ("a" varchar, "b" varchar, "c" varchar, constraint "a_b_unique" unique ("a", "b"), constraint "b_c_unique" unique ("b", "c"))`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      it('should create a table with check constraints', async () => {
        const builder = ctx.db.schema
          .createTable('test')
          .addColumn('a', 'integer')
          .addColumn('b', 'integer')
          .addColumn('c', 'integer')
          .addCheckConstraint('check_a', 'a > 1')
          .addCheckConstraint('check_b', 'b < c')

        testSql(builder, dialect, {
          postgres: {
            sql: `create table "test" ("a" integer, "b" integer, "c" integer, constraint "check_a" check (a > 1), constraint "check_b" check (b < c))`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      it('should add a composite primary key constraint', async () => {
        const builder = ctx.db.schema
          .createTable('test')
          .addColumn('a', 'integer')
          .addColumn('b', 'integer')
          .addPrimaryKeyConstraint('primary', ['a', 'b'])

        testSql(builder, dialect, {
          postgres: {
            sql: `create table "test" ("a" integer, "b" integer, constraint "primary" primary key ("a", "b"))`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      it('should add a foreignt key constraint', async () => {
        await ctx.db.schema
          .createTable('test2')
          .addColumn('c', 'integer')
          .addColumn('d', 'integer')
          .addPrimaryKeyConstraint('primary_key', ['c', 'd'])
          .execute()

        const builder = ctx.db.schema
          .createTable('test')
          .addColumn('a', 'integer')
          .addColumn('b', 'integer')
          .addForeignKeyConstraint('foreign_key', ['a', 'b'], 'test2', [
            'c',
            'd',
          ])

        testSql(builder, dialect, {
          postgres: {
            sql: `create table "test" ("a" integer, "b" integer, constraint "foreign_key" foreign key ("a", "b") references "test2" ("c", "d"))`,
            bindings: [],
          },
        })

        await builder.execute()
      })

      it("should create a table if it doesn't already exist", async () => {
        const builder = ctx.db.schema
          .createTable('test')
          .ifNotExists()
          .addColumn('id', 'integer', (col) => col.primaryKey().increments())

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
            .addColumn('a', 'bigint', (col) => col.primaryKey().increments())

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
            .addColumn('id', 'integer', (col) => col.primaryKey().increments())
            .addColumn('foreign_key', 'integer', (col) =>
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
          .addColumn('id', 'bigint', (col) => col.primaryKey().increments())
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
          .addColumn('id', 'bigint', (col) => col.primaryKey().increments())
          .addColumn('first_name', 'varchar')
          .addColumn('last_name', 'varchar')
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
          .addColumn('id', 'bigint', (col) => col.primaryKey().increments())
          .addColumn('first_name', 'varchar')
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

    describe('alter table', () => {
      beforeEach(async () => {
        await ctx.db.schema
          .createTable('test')
          .addColumn('varchar_col', 'varchar')
          .addColumn('integer_col', 'integer')
          .execute()
      })

      describe('alter column', () => {
        it('should set column data type', async () => {
          const builder = ctx.db.schema
            .alterTable('test')
            .alterColumn('varchar_col')
            .setDataType('text')

          testSql(builder, dialect, {
            postgres: {
              sql: `alter table "test" alter column "varchar_col" type text`,
              bindings: [],
            },
          })

          await builder.execute()
        })

        it('should set default value', async () => {
          const builder = ctx.db.schema
            .alterTable('test')
            .alterColumn('varchar_col')
            .setDefault('foo')

          testSql(builder, dialect, {
            postgres: {
              sql: `alter table "test" alter column "varchar_col" set default 'foo'`,
              bindings: [],
            },
          })

          await builder.execute()
        })

        it('should drop default value', async () => {
          await ctx.db.schema
            .alterTable('test')
            .alterColumn('varchar_col')
            .setDefault('foo')
            .execute()

          const builder = ctx.db.schema
            .alterTable('test')
            .alterColumn('varchar_col')
            .dropDefault()

          testSql(builder, dialect, {
            postgres: {
              sql: `alter table "test" alter column "varchar_col" drop default`,
              bindings: [],
            },
          })

          await builder.execute()
        })

        it('should add not null constraint for column', async () => {
          const builder = ctx.db.schema
            .alterTable('test')
            .alterColumn('varchar_col')
            .setNotNull()

          testSql(builder, dialect, {
            postgres: {
              sql: `alter table "test" alter column "varchar_col" set not null`,
              bindings: [],
            },
          })

          await builder.execute()
        })

        it('should drop not null constraint for column', async () => {
          await ctx.db.schema
            .alterTable('test')
            .alterColumn('varchar_col')
            .setNotNull()
            .execute()

          const builder = ctx.db.schema
            .alterTable('test')
            .alterColumn('varchar_col')
            .dropNotNull()

          testSql(builder, dialect, {
            postgres: {
              sql: `alter table "test" alter column "varchar_col" drop not null`,
              bindings: [],
            },
          })

          await builder.execute()
        })
      })

      describe('drop column', () => {
        it('should drop a column', async () => {
          const builder = ctx.db.schema
            .alterTable('test')
            .dropColumn('varchar_col')

          testSql(builder, dialect, {
            postgres: {
              sql: `alter table "test" drop column "varchar_col"`,
              bindings: [],
            },
          })

          await builder.execute()
        })
      })

      describe('rename', () => {
        it('should rename a table', async () => {
          const builder = ctx.db.schema.alterTable('test').renameTo('test2')

          testSql(builder, dialect, {
            postgres: {
              sql: `alter table "test" rename to "test2"`,
              bindings: [],
            },
          })

          await builder.execute()
        })
      })

      describe('set schema', () => {
        it('should rename a table', async () => {
          const builder = ctx.db.schema.alterTable('test').setSchema('public')

          testSql(builder, dialect, {
            postgres: {
              sql: `alter table "test" set schema "public"`,
              bindings: [],
            },
          })

          await builder.execute()
        })
      })

      describe('rename column', () => {
        it('should rename a column', async () => {
          const builder = ctx.db.schema
            .alterTable('test')
            .renameColumn('varchar_col', 'text_col')

          testSql(builder, dialect, {
            postgres: {
              sql: `alter table "test" rename column "varchar_col" to "text_col"`,
              bindings: [],
            },
          })

          await builder.execute()
        })
      })

      describe('add column', () => {
        it('should add a column', async () => {
          const builder = ctx.db.schema
            .alterTable('test')
            .addColumn('bool_col', 'boolean')
            .notNull()
            .unique()

          testSql(builder, dialect, {
            postgres: {
              sql: `alter table "test" add column "bool_col" boolean not null unique`,
              bindings: [],
            },
          })

          await builder.execute()
        })
      })
    })

    async function dropTestTables(): Promise<void> {
      await ctx.db.schema.dropTable('test').ifExists().execute()
      await ctx.db.schema.dropTable('test2').ifExists().execute()
    }
  })
}
