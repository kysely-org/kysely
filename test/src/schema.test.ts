import { ColumnMetadata } from '../../'
import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  expect,
  initTest,
  NOT_SUPPORTED,
  TestContext,
  testSql,
  TEST_INIT_TIMEOUT,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: schema`, () => {
    let ctx: TestContext

    before(async function () {
      this.timeout(TEST_INIT_TIMEOUT)
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
      if (dialect === 'postgres') {
        it('should create a table with all data types', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('a', 'serial', (col) => col.primaryKey())
            .addColumn('b', 'integer', (col) =>
              col
                .references('test.a')
                .onDelete('cascade')
                .onUpdate('restrict')
                .check('b < a')
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
            .addColumn('n', 'timestamptz')
            .addColumn('o', 'uuid', (col) =>
              col.defaultTo(ctx.db.raw('gen_random_uuid()'))
            )
            .addColumn('p', 'int2')
            .addColumn('q', 'int4')
            .addColumn('r', 'int8')

          testSql(builder, dialect, {
            postgres: {
              sql: [
                'create table "test"',
                '("a" serial primary key,',
                '"b" integer references "test" ("a") on delete cascade on update restrict check (b < a),',
                '"c" varchar,',
                '"d" varchar(10),',
                '"e" bigint not null unique,',
                '"f" double precision,',
                '"g" real,',
                '"h" text,',
                '"i" varchar(123),',
                '"j" numeric(6, 2),',
                '"k" decimal(8, 4),',
                '"l" boolean default false not null,',
                '"m" date,',
                '"n" timestamptz,',
                '"o" uuid default gen_random_uuid(),',
                '"p" int2,',
                '"q" int4,',
                '"r" int8)',
              ],
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      } else {
        it('should create a table with all data types', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('a', 'integer', (col) => col.primaryKey().increments())
            .addColumn('b', 'integer', (col) =>
              col.references('test.a').onDelete('cascade').onUpdate('set null')
            )
            .addColumn('c', 'varchar(255)')
            .addColumn('d', 'bigint', (col) => col.unique().notNull())
            .addColumn('e', 'double precision')
            .addColumn('f', 'real')
            .addColumn('g', 'text')
            .addColumn('h', ctx.db.raw('varchar(123)'))
            .addColumn('i', 'numeric(6, 2)')
            .addColumn('j', 'decimal(8, 4)')
            .addColumn('k', 'boolean', (col) => col.notNull().defaultTo(false))
            .addColumn('l', 'date')
            .addColumn('m', 'time')
            .addColumn('n', 'datetime')
            .addColumn('o', 'timestamp')

          testSql(builder, dialect, {
            mysql: {
              sql: [
                'create table `test`',
                '(`a` integer auto_increment primary key,',
                '`b` integer references `test` (`a`) on delete cascade on update set null,',
                '`c` varchar(255),',
                '`d` bigint not null unique,',
                '`e` double precision,',
                '`f` real,',
                '`g` text,',
                '`h` varchar(123),',
                '`i` numeric(6, 2),',
                '`j` decimal(8, 4),',
                '`k` boolean default false not null,',
                '`l` date,',
                '`m` time,',
                '`n` datetime,',
                '`o` timestamp)',
              ],
              parameters: [],
            },
            postgres: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      it('should create a table with a unique constraints', async () => {
        const builder = ctx.db.schema
          .createTable('test')
          .addColumn('a', 'varchar(255)')
          .addColumn('b', 'varchar(255)')
          .addColumn('c', 'varchar(255)')
          .addUniqueConstraint('a_b_unique', ['a', 'b'])
          .addUniqueConstraint('b_c_unique', ['b', 'c'])

        testSql(builder, dialect, {
          postgres: {
            sql: 'create table "test" ("a" varchar(255), "b" varchar(255), "c" varchar(255), constraint "a_b_unique" unique ("a", "b"), constraint "b_c_unique" unique ("b", "c"))',
            parameters: [],
          },
          mysql: {
            sql: 'create table `test` (`a` varchar(255), `b` varchar(255), `c` varchar(255), constraint `a_b_unique` unique (`a`, `b`), constraint `b_c_unique` unique (`b`, `c`))',
            parameters: [],
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
            sql: 'create table "test" ("a" integer, "b" integer, "c" integer, constraint "check_a" check (a > 1), constraint "check_b" check (b < c))',
            parameters: [],
          },
          mysql: {
            sql: 'create table `test` (`a` integer, `b` integer, `c` integer, constraint `check_a` check (a > 1), constraint `check_b` check (b < c))',
            parameters: [],
          },
        })

        await builder.execute()
      })

      it('should create a table with a composite primary key constraint', async () => {
        const builder = ctx.db.schema
          .createTable('test')
          .addColumn('a', 'integer')
          .addColumn('b', 'integer')
          .addPrimaryKeyConstraint('primary', ['a', 'b'])

        testSql(builder, dialect, {
          postgres: {
            sql: 'create table "test" ("a" integer, "b" integer, constraint "primary" primary key ("a", "b"))',
            parameters: [],
          },
          mysql: {
            sql: 'create table `test` (`a` integer, `b` integer, constraint `primary` primary key (`a`, `b`))',
            parameters: [],
          },
        })

        await builder.execute()
      })

      it('should create a table with a foreign key constraint', async () => {
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
            sql: 'create table "test" ("a" integer, "b" integer, constraint "foreign_key" foreign key ("a", "b") references "test2" ("c", "d"))',
            parameters: [],
          },
          mysql: {
            sql: 'create table `test` (`a` integer, `b` integer, constraint `foreign_key` foreign key (`a`, `b`) references `test2` (`c`, `d`))',
            parameters: [],
          },
        })

        await builder.execute()
      })

      it('should create a table with a foreign key constraint that has an `on update` statement', async () => {
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
          .addForeignKeyConstraint(
            'foreign_key',
            ['a', 'b'],
            'test2',
            ['c', 'd'],
            (cb) => cb.onUpdate('cascade')
          )

        testSql(builder, dialect, {
          postgres: {
            sql: 'create table "test" ("a" integer, "b" integer, constraint "foreign_key" foreign key ("a", "b") references "test2" ("c", "d") on update cascade)',
            parameters: [],
          },
          mysql: {
            sql: 'create table `test` (`a` integer, `b` integer, constraint `foreign_key` foreign key (`a`, `b`) references `test2` (`c`, `d`) on update cascade)',
            parameters: [],
          },
        })

        await builder.execute()
      })

      it("should create a table if it doesn't already exist", async () => {
        const builder = ctx.db.schema
          .createTable('test')
          .ifNotExists()
          .addColumn('id', 'integer', (col) => col.primaryKey())

        testSql(builder, dialect, {
          postgres: {
            sql: 'create table if not exists "test" ("id" integer primary key)',
            parameters: [],
          },
          mysql: {
            sql: 'create table if not exists `test` (`id` integer primary key)',
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (dialect === 'postgres') {
        it('should create a table in specific schema', async () => {
          const builder = ctx.db.schema
            .createTable('public.test')
            .addColumn('id', 'serial', (col) => col.primaryKey())
            .addColumn('foreign_key', 'integer', (col) =>
              col.references('public.test.id')
            )

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "public"."test" ("id" serial primary key, "foreign_key" integer references "public"."test" ("id"))',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }
    })

    describe('drop table', () => {
      beforeEach(async () => {
        await ctx.db.schema
          .createTable('test')
          .addColumn('id', 'bigint', (col) => col.primaryKey())
          .execute()
      })

      it('should drop a table', async () => {
        const builder = ctx.db.schema.dropTable('test')

        testSql(builder, dialect, {
          postgres: {
            sql: 'drop table "test"',
            parameters: [],
          },
          mysql: {
            sql: 'drop table `test`',
            parameters: [],
          },
        })

        await builder.execute()
      })

      it('should drop a table if it exists', async () => {
        const builder = ctx.db.schema.dropTable('test').ifExists()

        testSql(builder, dialect, {
          postgres: {
            sql: 'drop table if exists "test"',
            parameters: [],
          },
          mysql: {
            sql: 'drop table if exists `test`',
            parameters: [],
          },
        })

        await builder.execute()
      })
    })

    describe('create index', () => {
      beforeEach(async () => {
        await ctx.db.schema
          .createTable('test')
          .addColumn('id', 'bigint', (col) => col.primaryKey())
          .addColumn('first_name', 'varchar(255)')
          .addColumn('last_name', 'varchar(255)')
          .execute()
      })

      it('should create an index', async () => {
        const builder = ctx.db.schema
          .createIndex('test_first_name_index')
          .on('test')
          .column('first_name')

        testSql(builder, dialect, {
          postgres: {
            sql: 'create index "test_first_name_index" on "test" ("first_name")',
            parameters: [],
          },
          mysql: {
            sql: 'create index `test_first_name_index` on `test` (`first_name`)',
            parameters: [],
          },
        })

        await builder.execute()
      })

      it('should create a unique index', async () => {
        const builder = ctx.db.schema
          .createIndex('test_first_name_index')
          .unique()
          .on('test')
          .column('first_name')

        testSql(builder, dialect, {
          postgres: {
            sql: 'create unique index "test_first_name_index" on "test" ("first_name")',
            parameters: [],
          },
          mysql: {
            sql: 'create unique index `test_first_name_index` on `test` (`first_name`)',
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (dialect === 'postgres') {
        it('should create an index with a type', async () => {
          const builder = ctx.db.schema
            .createIndex('test_first_name_index')
            .on('test')
            .using('hash')
            .column('first_name')

          testSql(builder, dialect, {
            postgres: {
              sql: 'create index "test_first_name_index" on "test" using hash ("first_name")',
              parameters: [],
            },
            mysql: {
              sql: 'create index `test_first_name_index` on `test` using hash (`first_name`)',
              parameters: [],
            },
          })

          await builder.execute()
        })
      }

      it('should create an index for multiple columns', async () => {
        const builder = ctx.db.schema
          .createIndex('test_name_index')
          .on('test')
          .columns(['first_name', 'last_name'])

        testSql(builder, dialect, {
          postgres: {
            sql: 'create index "test_name_index" on "test" ("first_name", "last_name")',
            parameters: [],
          },
          mysql: {
            sql: 'create index `test_name_index` on `test` (`first_name`, `last_name`)',
            parameters: [],
          },
        })

        await builder.execute()
      })

      it('should create an index for an expression', async () => {
        const builder = ctx.db.schema
          .createIndex('test_first_name_index')
          .on('test')
          .expression(`first_name < 'Sami'`)

        testSql(builder, dialect, {
          postgres: {
            sql: `create index "test_first_name_index" on "test" ((first_name < 'Sami'))`,
            parameters: [],
          },
          mysql: {
            sql: "create index `test_first_name_index` on `test` ((first_name < 'Sami'))",
            parameters: [],
          },
        })

        await builder.execute()
      })
    })

    describe('drop index', () => {
      beforeEach(async () => {
        await ctx.db.schema
          .createTable('test')
          .addColumn('id', 'bigint', (col) => col.primaryKey())
          .addColumn('first_name', 'varchar(255)')
          .execute()

        await ctx.db.schema
          .createIndex('test_first_name_index')
          .on('test')
          .column('first_name')
          .execute()
      })

      it('should drop an index', async () => {
        let builder = ctx.db.schema.dropIndex('test_first_name_index')

        if (dialect !== 'postgres') {
          builder = builder.on('test')
        }

        testSql(builder, dialect, {
          postgres: {
            sql: 'drop index "test_first_name_index"',
            parameters: [],
          },
          mysql: {
            sql: 'drop index `test_first_name_index` on `test`',
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (dialect !== 'mysql') {
        it('should drop an index if it exists', async () => {
          let builder = ctx.db.schema
            .dropIndex('test_first_name_index')
            .ifExists()

          testSql(builder, dialect, {
            postgres: {
              sql: 'drop index if exists "test_first_name_index"',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }
    })

    describe('alter table', () => {
      beforeEach(async () => {
        await ctx.db.schema
          .createTable('test')
          .addColumn('varchar_col', 'varchar(255)')
          .addColumn('integer_col', 'integer')
          .execute()
      })

      if (dialect === 'mysql') {
        describe('modify column', () => {
          it('should set column data type', async () => {
            const builder = ctx.db.schema
              .alterTable('test')
              .modifyColumn('varchar_col', 'text')

            testSql(builder, dialect, {
              mysql: {
                sql: 'alter table `test` modify column `varchar_col` text',
                parameters: [],
              },
              postgres: NOT_SUPPORTED,
            })

            await builder.execute()
          })

          it('should add not null constraint for column', async () => {
            const builder = ctx.db.schema
              .alterTable('test')
              .modifyColumn('varchar_col', 'varchar(255)')
              .notNull()

            testSql(builder, dialect, {
              mysql: {
                sql: 'alter table `test` modify column `varchar_col` varchar(255) not null',
                parameters: [],
              },
              postgres: NOT_SUPPORTED,
            })

            await builder.execute()
          })

          it('should drop not null constraint for column', async () => {
            expect(
              (await getColumnMeta('test.varchar_col')).isNullable
            ).to.equal(true)

            await ctx.db.schema
              .alterTable('test')
              .modifyColumn('varchar_col', 'varchar(255)')
              .notNull()
              .execute()

            expect(
              (await getColumnMeta('test.varchar_col')).isNullable
            ).to.equal(false)

            const builder = ctx.db.schema
              .alterTable('test')
              .modifyColumn('varchar_col', 'varchar(255)')

            testSql(builder, dialect, {
              mysql: {
                sql: 'alter table `test` modify column `varchar_col` varchar(255)',
                parameters: [],
              },
              postgres: NOT_SUPPORTED,
            })

            await builder.execute()

            expect(
              (await getColumnMeta('test.varchar_col')).isNullable
            ).to.equal(true)
          })
        })
      }

      describe('alter column', () => {
        it('should set default value', async () => {
          const builder = ctx.db.schema
            .alterTable('test')
            .alterColumn('varchar_col')
            .setDefault('foo')

          testSql(builder, dialect, {
            postgres: {
              sql: `alter table "test" alter column "varchar_col" set default 'foo'`,
              parameters: [],
            },
            mysql: {
              sql: "alter table `test` alter column `varchar_col` set default 'foo'",
              parameters: [],
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
              sql: 'alter table "test" alter column "varchar_col" drop default',
              parameters: [],
            },
            mysql: {
              sql: 'alter table `test` alter column `varchar_col` drop default',
              parameters: [],
            },
          })

          await builder.execute()
        })

        if (dialect !== 'mysql') {
          it('should set column data type', async () => {
            const builder = ctx.db.schema
              .alterTable('test')
              .alterColumn('varchar_col')
              .setDataType('text')

            testSql(builder, dialect, {
              postgres: {
                sql: 'alter table "test" alter column "varchar_col" type text',
                parameters: [],
              },
              mysql: NOT_SUPPORTED,
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
                sql: 'alter table "test" alter column "varchar_col" set not null',
                parameters: [],
              },
              mysql: NOT_SUPPORTED,
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
                sql: 'alter table "test" alter column "varchar_col" drop not null',
                parameters: [],
              },
              mysql: NOT_SUPPORTED,
            })

            await builder.execute()
          })
        }
      })

      describe('drop column', () => {
        it('should drop a column', async () => {
          const builder = ctx.db.schema
            .alterTable('test')
            .dropColumn('varchar_col')

          testSql(builder, dialect, {
            postgres: {
              sql: 'alter table "test" drop column "varchar_col"',
              parameters: [],
            },
            mysql: {
              sql: 'alter table `test` drop column `varchar_col`',
              parameters: [],
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
              sql: 'alter table "test" rename to "test2"',
              parameters: [],
            },
            mysql: {
              sql: 'alter table `test` rename to `test2`',
              parameters: [],
            },
          })

          await builder.execute()
        })
      })

      if (dialect === 'postgres') {
        describe('set schema', () => {
          it('should rename a table', async () => {
            const builder = ctx.db.schema.alterTable('test').setSchema('public')

            testSql(builder, dialect, {
              postgres: {
                sql: 'alter table "test" set schema "public"',
                parameters: [],
              },
              mysql: {
                sql: 'alter table `test` set schema `public`',
                parameters: [],
              },
            })

            await builder.execute()
          })
        })
      }

      describe('rename column', () => {
        it('should rename a column', async () => {
          const builder = ctx.db.schema
            .alterTable('test')
            .renameColumn('varchar_col', 'text_col')

          testSql(builder, dialect, {
            postgres: {
              sql: 'alter table "test" rename column "varchar_col" to "text_col"',
              parameters: [],
            },
            mysql: {
              sql: 'alter table `test` rename column `varchar_col` to `text_col`',
              parameters: [],
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
              sql: 'alter table "test" add column "bool_col" boolean not null unique',
              parameters: [],
            },
            mysql: {
              sql: 'alter table `test` add column `bool_col` boolean not null unique',
              parameters: [],
            },
          })

          await builder.execute()

          expect(await getColumnMeta('test.bool_col')).to.eql({
            name: 'bool_col',
            isNullable: false,
            dataType: dialect === 'postgres' ? 'bool' : 'tinyint',
          })
        })
      })

      describe('add unique constraint', () => {
        it('should add a unique constraint', async () => {
          const builder = ctx.db.schema
            .alterTable('test')
            .addUniqueConstraint('some_constraint', [
              'varchar_col',
              'integer_col',
            ])

          testSql(builder, dialect, {
            postgres: {
              sql: 'alter table "test" add constraint "some_constraint" unique ("varchar_col", "integer_col")',
              parameters: [],
            },
            mysql: {
              sql: 'alter table `test` add constraint `some_constraint` unique (`varchar_col`, `integer_col`)',
              parameters: [],
            },
          })

          await builder.execute()
        })
      })

      describe('add check constraint', () => {
        it('should add a check constraint', async () => {
          const builder = ctx.db.schema
            .alterTable('test')
            .addCheckConstraint('some_constraint', 'integer_col > 0')

          testSql(builder, dialect, {
            postgres: {
              sql: 'alter table "test" add constraint "some_constraint" check (integer_col > 0)',
              parameters: [],
            },
            mysql: {
              sql: 'alter table `test` add constraint `some_constraint` check (integer_col > 0)',
              parameters: [],
            },
          })

          await builder.execute()
        })
      })

      describe('add foreign key constraint', () => {
        it('should add a foreign key constraint', async () => {
          await ctx.db.schema
            .createTable('test2')
            .addColumn('a', 'integer')
            .addColumn('b', 'varchar(255)')
            .addUniqueConstraint('unique_a_b', ['a', 'b'])
            .execute()

          const builder = ctx.db.schema
            .alterTable('test')
            .addForeignKeyConstraint(
              'some_constraint',
              ['integer_col', 'varchar_col'],
              'test2',
              ['a', 'b']
            )

          testSql(builder, dialect, {
            postgres: {
              sql: 'alter table "test" add constraint "some_constraint" foreign key ("integer_col", "varchar_col") references "test2" ("a", "b")',
              parameters: [],
            },
            mysql: {
              sql: 'alter table `test` add constraint `some_constraint` foreign key (`integer_col`, `varchar_col`) references `test2` (`a`, `b`)',
              parameters: [],
            },
          })

          await builder.execute()
        })

        it('should add a foreign key constraint with on delete and on update', async () => {
          await ctx.db.schema
            .createTable('test2')
            .addColumn('a', 'integer')
            .addColumn('b', 'varchar(255)')
            .addUniqueConstraint('unique_a_b', ['a', 'b'])
            .execute()

          const builder = ctx.db.schema
            .alterTable('test')
            .addForeignKeyConstraint(
              'some_constraint',
              ['integer_col', 'varchar_col'],
              'test2',
              ['a', 'b']
            )
            .onDelete('set null')
            .onUpdate('cascade')

          testSql(builder, dialect, {
            postgres: {
              sql: 'alter table "test" add constraint "some_constraint" foreign key ("integer_col", "varchar_col") references "test2" ("a", "b") on delete set null on update cascade',
              parameters: [],
            },
            mysql: {
              sql: 'alter table `test` add constraint `some_constraint` foreign key (`integer_col`, `varchar_col`) references `test2` (`a`, `b`) on delete set null on update cascade',
              parameters: [],
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

    async function getColumnMeta(ref: string): Promise<ColumnMetadata> {
      const [table, column] = ref.split('.')
      const meta = await ctx.db.introspection.getMetadata()
      const tableMeta = meta.tables.find((it) => it.name === table)
      return tableMeta!.columns.find((it) => it.name === column)!
    }
  })
}
