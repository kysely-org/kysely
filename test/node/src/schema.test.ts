import { ColumnMetadata, sql } from '../../../'

import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  expect,
  initTest,
  NOT_SUPPORTED,
  TestContext,
  testSql,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: schema`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
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
                .check(sql`b < a`)
            )
            .addColumn('c', 'varchar')
            .addColumn('d', 'varchar(10)')
            .addColumn('e', 'bigint', (col) => col.unique().notNull())
            .addColumn('f', 'double precision')
            .addColumn('g', 'real')
            .addColumn('h', 'text')
            .addColumn('i', sql`varchar(123)`)
            .addColumn('j', 'numeric(6, 2)')
            .addColumn('k', 'decimal(8, 4)')
            .addColumn('l', 'boolean', (col) => col.notNull().defaultTo(false))
            .addColumn('m', 'date')
            .addColumn('n', 'timestamptz')
            .addColumn('o', 'uuid', (col) =>
              col.defaultTo(sql`gen_random_uuid()`)
            )
            .addColumn('p', 'int2')
            .addColumn('q', 'int4')
            .addColumn('r', 'int8')
            .addColumn('s', 'double precision', (col) =>
              col
                .generatedAlwaysAs(sql`f + g`)
                .stored()
                .notNull()
            )
            .addColumn('t', 'time(6)')
            .addColumn('u', 'timestamp(6)', (col) =>
              col.notNull().defaultTo(sql`current_timestamp`)
            )
            .addColumn('v', 'timestamptz(6)')

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
                '"r" int8,',
                '"s" double precision generated always as (f + g) stored not null,',
                '"t" time(6),',
                '"u" timestamp(6) default current_timestamp not null,',
                '"v" timestamptz(6))',
              ],
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()

          expect(await getColumnMeta('test.a')).to.eql({
            dataType: 'int4',
            isAutoIncrementing: true,
            isNullable: false,
            hasDefaultValue: true,
            name: 'a',
          })

          expect(await getColumnMeta('test.b')).to.eql({
            dataType: 'int4',
            isAutoIncrementing: false,
            isNullable: true,
            hasDefaultValue: false,
            name: 'b',
          })

          expect(await getColumnMeta('test.l')).to.eql({
            dataType: 'bool',
            isAutoIncrementing: false,
            isNullable: false,
            hasDefaultValue: true,
            name: 'l',
          })
        })
      } else if (dialect === 'mysql') {
        it('should create a table with all data types', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('a', 'integer', (col) =>
              col.primaryKey().autoIncrement()
            )
            .addColumn('b', 'integer', (col) =>
              col.references('test.a').onDelete('cascade').onUpdate('set null')
            )
            .addColumn('c', 'varchar(255)')
            .addColumn('d', 'bigint', (col) =>
              col.unsigned().unique().notNull()
            )
            .addColumn('e', 'double precision')
            .addColumn('f', 'real')
            .addColumn('g', 'text')
            .addColumn('h', sql`varchar(123)`)
            .addColumn('i', 'numeric(6, 2)')
            .addColumn('j', 'decimal(8, 4)')
            .addColumn('k', 'boolean', (col) => col.notNull().defaultTo(false))
            .addColumn('l', 'date')
            .addColumn('m', 'time')
            .addColumn('n', 'datetime')
            .addColumn('o', 'timestamp')
            .addColumn('p', 'double precision', (col) =>
              col
                .generatedAlwaysAs(sql`e + f`)
                .stored()
                .notNull()
            )
            .addColumn('q', 'time(6)')
            .addColumn('r', 'datetime(6)')
            .addColumn('s', 'timestamp(6)', (col) =>
              col.notNull().defaultTo(sql`current_timestamp(6)`)
            )

          testSql(builder, dialect, {
            mysql: {
              sql: [
                'create table `test`',
                '(`a` integer primary key auto_increment,',
                '`b` integer references `test` (`a`) on delete cascade on update set null,',
                '`c` varchar(255),',
                '`d` bigint unsigned not null unique,',
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
                '`o` timestamp,',
                '`p` double precision generated always as (e + f) stored not null,',
                '`q` time(6),',
                '`r` datetime(6),',
                '`s` timestamp(6) default current_timestamp(6) not null)',
              ],
              parameters: [],
            },
            postgres: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()

          expect(await getColumnMeta('test.a')).to.eql({
            dataType: 'int',
            isAutoIncrementing: true,
            isNullable: false,
            hasDefaultValue: false,
            name: 'a',
          })

          expect(await getColumnMeta('test.b')).to.eql({
            dataType: 'int',
            isAutoIncrementing: false,
            isNullable: true,
            hasDefaultValue: false,
            name: 'b',
          })

          expect(await getColumnMeta('test.k')).to.eql({
            dataType: 'tinyint',
            isAutoIncrementing: false,
            isNullable: false,
            hasDefaultValue: true,
            name: 'k',
          })
        })
      } else {
        it('should create a table with all data types', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('a', 'integer', (col) =>
              col.primaryKey().autoIncrement().notNull()
            )
            .addColumn('b', 'integer', (col) =>
              col
                .references('test.a')
                .onDelete('cascade')
                .onUpdate('restrict')
                .check(sql`b < a`)
            )
            .addColumn('c', 'varchar')
            .addColumn('d', 'varchar(10)')
            .addColumn('e', 'bigint', (col) => col.unique().notNull())
            .addColumn('f', 'double precision')
            .addColumn('g', 'real')
            .addColumn('h', 'text')
            .addColumn('i', sql`varchar(123)`)
            .addColumn('j', 'numeric(6, 2)')
            .addColumn('k', 'decimal(8, 4)')
            .addColumn('l', 'boolean', (col) => col.notNull().defaultTo(false))
            .addColumn('m', 'date')
            .addColumn('n', 'timestamptz')
            .addColumn('o', 'int2')
            .addColumn('p', 'int4')
            .addColumn('q', 'int8')
            .addColumn('r', 'double precision', (col) =>
              col
                .generatedAlwaysAs(sql`f + g`)
                .stored()
                .notNull()
            )
            .addColumn('s', 'blob')

          testSql(builder, dialect, {
            sqlite: {
              sql: [
                'create table "test"',
                '("a" integer not null primary key autoincrement,',
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
                '"o" int2,',
                '"p" int4,',
                '"q" int8,',
                '"r" double precision generated always as (f + g) stored not null,',
                '"s" blob)',
              ],
              parameters: [],
            },
            postgres: NOT_SUPPORTED,
            mysql: NOT_SUPPORTED,
          })

          await builder.execute()

          expect(await getColumnMeta('test.a')).to.eql({
            dataType: 'INTEGER',
            isAutoIncrementing: true,
            isNullable: false,
            hasDefaultValue: false,
            name: 'a',
          })

          expect(await getColumnMeta('test.b')).to.eql({
            dataType: 'INTEGER',
            isAutoIncrementing: false,
            isNullable: true,
            hasDefaultValue: false,
            name: 'b',
          })

          expect(await getColumnMeta('test.l')).to.eql({
            dataType: 'boolean',
            isAutoIncrementing: false,
            isNullable: false,
            hasDefaultValue: true,
            name: 'l',
          })
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
          sqlite: {
            sql: 'create table "test" ("a" varchar(255), "b" varchar(255), "c" varchar(255), constraint "a_b_unique" unique ("a", "b"), constraint "b_c_unique" unique ("b", "c"))',
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
          .addCheckConstraint('check_a', sql`a > 1`)
          .addCheckConstraint('check_b', sql`b < c`)

        testSql(builder, dialect, {
          postgres: {
            sql: 'create table "test" ("a" integer, "b" integer, "c" integer, constraint "check_a" check (a > 1), constraint "check_b" check (b < c))',
            parameters: [],
          },
          mysql: {
            sql: 'create table `test` (`a` integer, `b` integer, `c` integer, constraint `check_a` check (a > 1), constraint `check_b` check (b < c))',
            parameters: [],
          },
          sqlite: {
            sql: 'create table "test" ("a" integer, "b" integer, "c" integer, constraint "check_a" check (a > 1), constraint "check_b" check (b < c))',
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
          sqlite: {
            sql: 'create table "test" ("a" integer, "b" integer, constraint "primary" primary key ("a", "b"))',
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
          sqlite: {
            sql: 'create table "test" ("a" integer, "b" integer, constraint "foreign_key" foreign key ("a", "b") references "test2" ("c", "d"))',
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (dialect === 'postgres') {
        it('should support schemas in foreign key target table', async () => {
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
              'public.test2',
              ['c', 'd']
            )

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "test" ("a" integer, "b" integer, constraint "foreign_key" foreign key ("a", "b") references "public"."test2" ("c", "d"))',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

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
          sqlite: {
            sql: 'create table "test" ("a" integer, "b" integer, constraint "foreign_key" foreign key ("a", "b") references "test2" ("c", "d") on update cascade)',
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
          sqlite: {
            sql: 'create table if not exists "test" ("id" integer primary key)',
            parameters: [],
          },
        })

        await builder.execute()
      })

      it('should create a temporary table', async () => {
        const builder = ctx.db.schema
          .createTable('test')
          .temporary()
          .addColumn('id', 'integer', (col) => col.primaryKey())

        testSql(builder, dialect, {
          postgres: {
            sql: 'create temporary table "test" ("id" integer primary key)',
            parameters: [],
          },
          mysql: {
            sql: 'create temporary table `test` (`id` integer primary key)',
            parameters: [],
          },
          sqlite: {
            sql: 'create temporary table "test" ("id" integer primary key)',
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (dialect === 'postgres') {
        it('should create a temporary table witn on commit statement', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .temporary()
            .addColumn('id', 'integer', (col) => col.primaryKey())
            .onCommit('drop')

          testSql(builder, dialect, {
            postgres: {
              sql: 'create temporary table "test" ("id" integer primary key) on commit drop',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

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
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      if (dialect === 'postgres') {
        it('should create a table with generated identity', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('id', 'integer', (col) =>
              col.generatedAlwaysAsIdentity()
            )

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "test" ("id" integer generated always as identity)',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      if (dialect === 'postgres') {
        it('should create a table with generated identity (by default)', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('id', 'integer', (col) =>
              col.generatedByDefaultAsIdentity()
            )

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "test" ("id" integer generated by default as identity)',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      if (dialect === 'postgres') {
        it('should create a global temporary table', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .modifyFront(sql`global temporary`)
            .addColumn('id', 'integer', (col) => col.primaryKey())
            .addColumn('first_name', 'varchar(64)', (col) => col.notNull())
            .addColumn('last_name', 'varchar(64)', (col) => col.notNull())

          testSql(builder, dialect, {
            postgres: {
              sql: [
                'create global temporary table "test"',
                '("id" integer primary key,',
                '"first_name" varchar(64) not null,',
                '"last_name" varchar(64) not null)',
              ],
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      if (dialect === 'postgres') {
        it('should create a table partitioned by country', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('id', 'integer', (col) => col.notNull())
            .addColumn('nickname', 'varchar(64)', (col) => col.notNull())
            .addColumn('country', 'varchar(2)', (col) => col.notNull())
            .addPrimaryKeyConstraint('test_pk', ['id', 'country'])
            .modifyEnd(sql`partition by hash (${sql.ref('country')})`)

          testSql(builder, dialect, {
            postgres: {
              sql: [
                'create table "test"',
                '("id" integer not null,',
                '"nickname" varchar(64) not null,',
                '"country" varchar(2) not null,',
                'constraint "test_pk" primary key ("id", "country")) partition by hash ("country")',
              ],
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      } else if (dialect === 'mysql') {
        it('should create a table partitioned by country', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('id', 'integer', (col) => col.notNull())
            .addColumn('nickname', 'varchar(64)', (col) => col.notNull())
            .addColumn('country', 'varchar(2)', (col) => col.notNull())
            .addPrimaryKeyConstraint('test_pk', ['id', 'country'])
            .modifyEnd(sql`partition by key (${sql.ref('country')})`)

          testSql(builder, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: {
              sql: [
                'create table `test`',
                '(`id` integer not null,',
                '`nickname` varchar(64) not null,',
                '`country` varchar(2) not null,',
                'constraint `test_pk` primary key (`id`, `country`)) partition by key (`country`)',
              ],
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      } else {
        it('should create a strict table', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('id', 'integer', (col) => col.primaryKey())
            .addColumn('nickname', 'text', (col) => col.notNull())
            .addColumn('country', 'text', (col) => col.notNull())
            .modifyEnd(sql`strict`)

          testSql(builder, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: NOT_SUPPORTED,
            sqlite: {
              sql: [
                'create table "test"',
                '("id" integer primary key,',
                '"nickname" text not null,',
                '"country" text not null) strict',
              ],
              parameters: [],
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
          sqlite: {
            sql: 'drop table "test"',
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
          sqlite: {
            sql: 'drop table if exists "test"',
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
          sqlite: {
            sql: 'create index "test_first_name_index" on "test" ("first_name")',
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
          sqlite: {
            sql: 'create unique index "test_first_name_index" on "test" ("first_name")',
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
            sqlite: {
              sql: 'create index "test_first_name_index" on "test" using hash ("first_name")',
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
          sqlite: {
            sql: 'create index "test_name_index" on "test" ("first_name", "last_name")',
            parameters: [],
          },
        })

        await builder.execute()
      })

      it('should create an index for an expression', async () => {
        const builder = ctx.db.schema
          .createIndex('test_first_name_index')
          .on('test')
          .expression(sql`first_name < 'Sami'`)

        testSql(builder, dialect, {
          postgres: {
            sql: `create index "test_first_name_index" on "test" ((first_name < 'Sami'))`,
            parameters: [],
          },
          mysql: {
            sql: "create index `test_first_name_index` on `test` ((first_name < 'Sami'))",
            parameters: [],
          },
          sqlite: {
            sql: `create index "test_first_name_index" on "test" ((first_name < 'Sami'))`,
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

        if (dialect === 'mysql') {
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
          sqlite: {
            sql: 'drop index "test_first_name_index"',
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
            sqlite: {
              sql: 'drop index if exists "test_first_name_index"',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }
    })

    describe('create view', () => {
      beforeEach(cleanup)
      afterEach(cleanup)

      it('should create a view', async () => {
        const builder = ctx.db.schema
          .createView('dogs')
          .as(ctx.db.selectFrom('pet').selectAll().where('species', '=', 'dog'))

        testSql(builder, dialect, {
          postgres: {
            sql: `create view "dogs" as select * from "pet" where "species" = 'dog'`,
            parameters: [],
          },
          mysql: {
            sql: "create view `dogs` as select * from `pet` where `species` = 'dog'",
            parameters: [],
          },
          sqlite: {
            sql: `create view "dogs" as select * from "pet" where "species" = 'dog'`,
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (dialect !== 'mysql') {
        it('should create a temporary view', async () => {
          const builder = ctx.db.schema
            .createView('dogs')
            .temporary()
            .as(
              ctx.db.selectFrom('pet').selectAll().where('species', '=', 'dog')
            )

          testSql(builder, dialect, {
            postgres: {
              sql: `create temporary view "dogs" as select * from "pet" where "species" = 'dog'`,
              parameters: [],
            },
            sqlite: {
              sql: `create temporary view "dogs" as select * from "pet" where "species" = 'dog'`,
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      if (dialect !== 'sqlite') {
        it('should create or replace a view', async () => {
          const builder = ctx.db.schema
            .createView('dogs')
            .orReplace()
            .as(
              ctx.db.selectFrom('pet').selectAll().where('species', '=', 'dog')
            )

          testSql(builder, dialect, {
            postgres: {
              sql: `create or replace view "dogs" as select * from "pet" where "species" = 'dog'`,
              parameters: [],
            },
            mysql: {
              sql: "create or replace view `dogs` as select * from `pet` where `species` = 'dog'",
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      if (dialect === 'sqlite') {
        it("should create a view if it doesn't exists", async () => {
          const builder = ctx.db.schema
            .createView('dogs')
            .ifNotExists()
            .as(
              ctx.db.selectFrom('pet').selectAll().where('species', '=', 'dog')
            )

          testSql(builder, dialect, {
            sqlite: {
              sql: `create view if not exists "dogs" as select * from "pet" where "species" = 'dog'`,
              parameters: [],
            },
            postgres: NOT_SUPPORTED,
            mysql: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      if (dialect === 'postgres') {
        it('should create a materialized view', async () => {
          const builder = ctx.db.schema
            .createView('materialized_dogs')
            .materialized()
            .as(
              ctx.db.selectFrom('pet').selectAll().where('species', '=', 'dog')
            )

          testSql(builder, dialect, {
            postgres: {
              sql: `create materialized view "materialized_dogs" as select * from "pet" where "species" = 'dog'`,
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      async function cleanup() {
        await ctx.db.schema.dropView('dogs').ifExists().execute()

        if (dialect === 'postgres') {
          await ctx.db.schema
            .dropView('materialized_dogs')
            .materialized()
            .ifExists()
            .execute()
        }
      }
    })

    describe('drop view', () => {
      beforeEach(async () => {
        await ctx.db.schema
          .createView('dogs')
          .as(ctx.db.selectFrom('pet').selectAll().where('species', '=', 'dog'))
          .execute()
      })

      afterEach(async () => {
        await ctx.db.schema.dropView('dogs').ifExists().execute()
      })

      it('should drop a view', async () => {
        const builder = ctx.db.schema.dropView('dogs')

        testSql(builder, dialect, {
          postgres: {
            sql: `drop view "dogs"`,
            parameters: [],
          },
          mysql: {
            sql: 'drop view `dogs`',
            parameters: [],
          },
          sqlite: {
            sql: `drop view "dogs"`,
            parameters: [],
          },
        })

        await builder.execute()
      })

      it('should drop a view if it exists', async () => {
        const builder = ctx.db.schema.dropView('dogs').ifExists()

        testSql(builder, dialect, {
          postgres: {
            sql: `drop view if exists "dogs"`,
            parameters: [],
          },
          mysql: {
            sql: 'drop view if exists `dogs`',
            parameters: [],
          },
          sqlite: {
            sql: `drop view if exists "dogs"`,
            parameters: [],
          },
        })

        await builder.execute()
      })
    })

    describe('create schema', () => {
      if (dialect === 'postgres' || dialect === 'mysql') {
        beforeEach(cleanup)
        afterEach(cleanup)

        it('should create a schema', async () => {
          const builder = ctx.db.schema.createSchema('pets')

          testSql(builder, dialect, {
            postgres: {
              sql: `create schema "pets"`,
              parameters: [],
            },
            mysql: {
              sql: 'create schema `pets`',
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })

        it('should create a schema if not exists', async () => {
          const builder = ctx.db.schema.createSchema('pets').ifNotExists()

          testSql(builder, dialect, {
            postgres: {
              sql: `create schema if not exists "pets"`,
              parameters: [],
            },
            mysql: {
              sql: 'create schema if not exists `pets`',
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      async function cleanup() {
        await ctx.db.schema.dropSchema('pets').ifExists().execute()
      }
    })

    describe('drop schema', () => {
      if (dialect === 'postgres' || dialect === 'mysql') {
        beforeEach(cleanup)
        afterEach(cleanup)

        it('should drop a schema', async () => {
          await ctx.db.schema.createSchema('pets').execute()

          const builder = ctx.db.schema.dropSchema('pets')

          testSql(builder, dialect, {
            postgres: {
              sql: `drop schema "pets"`,
              parameters: [],
            },
            mysql: {
              sql: 'drop schema `pets`',
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })

        it('should drop a schema if exists', async () => {
          const builder = ctx.db.schema.dropSchema('pets').ifExists()

          testSql(builder, dialect, {
            postgres: {
              sql: `drop schema if exists "pets"`,
              parameters: [],
            },
            mysql: {
              sql: 'drop schema if exists `pets`',
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      async function cleanup() {
        await ctx.db.schema.dropSchema('pets').ifExists().execute()
      }
    })

    describe('create type', () => {
      if (dialect === 'postgres') {
        beforeEach(cleanup)
        afterEach(cleanup)

        it('should create an enum type', async () => {
          const builder = ctx.db.schema
            .createType('species')
            .asEnum(['cat', 'dog', 'frog'])

          testSql(builder, dialect, {
            postgres: {
              sql: `create type "species" as enum ('cat', 'dog', 'frog')`,
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      async function cleanup() {
        await ctx.db.schema.dropType('species').ifExists().execute()
      }
    })

    describe('drop type', () => {
      if (dialect === 'postgres') {
        beforeEach(cleanup)
        afterEach(cleanup)

        it('should drop a type', async () => {
          await ctx.db.schema.createType('species').execute()

          const builder = ctx.db.schema.dropType('species')

          testSql(builder, dialect, {
            postgres: {
              sql: `drop type "species"`,
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })

        it('should drop a type if exists', async () => {
          const builder = ctx.db.schema.dropType('species').ifExists()

          testSql(builder, dialect, {
            postgres: {
              sql: `drop type if exists "species"`,
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      async function cleanup() {
        await ctx.db.schema.dropType('species').ifExists().execute()
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
              sqlite: NOT_SUPPORTED,
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
              sqlite: NOT_SUPPORTED,
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
              sqlite: NOT_SUPPORTED,
            })

            await builder.execute()

            expect(
              (await getColumnMeta('test.varchar_col')).isNullable
            ).to.equal(true)
          })
        })
      }

      if (dialect !== 'sqlite') {
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
              sqlite: NOT_SUPPORTED,
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
              sqlite: NOT_SUPPORTED,
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
                sqlite: {
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
                sqlite: {
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
                sqlite: {
                  sql: 'alter table "test" alter column "varchar_col" drop not null',
                  parameters: [],
                },
                mysql: NOT_SUPPORTED,
              })

              await builder.execute()
            })
          }
        })
      }

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
            sqlite: {
              sql: 'alter table "test" drop column "varchar_col"',
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
            sqlite: {
              sql: 'alter table "test" rename to "test2"',
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
              mysql: NOT_SUPPORTED,
              sqlite: NOT_SUPPORTED,
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
            sqlite: {
              sql: 'alter table "test" rename column "varchar_col" to "text_col"',
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

          testSql(builder, dialect, {
            postgres: {
              sql: 'alter table "test" add column "bool_col" boolean not null',
              parameters: [],
            },
            mysql: {
              sql: 'alter table `test` add column `bool_col` boolean not null',
              parameters: [],
            },
            sqlite: {
              sql: 'alter table "test" add column "bool_col" boolean not null',
              parameters: [],
            },
          })

          await builder.execute()

          expect(await getColumnMeta('test.bool_col')).to.containSubset({
            name: 'bool_col',
            isNullable: false,
            dataType:
              dialect === 'postgres'
                ? 'bool'
                : dialect === 'sqlite'
                ? 'boolean'
                : 'tinyint',
          })
        })

        it('should add a column using a callback', async () => {
          const builder = ctx.db.schema
            .alterTable('test')
            .addColumn('bool_col', 'boolean', (col) => col.notNull())

          testSql(builder, dialect, {
            postgres: {
              sql: 'alter table "test" add column "bool_col" boolean not null',
              parameters: [],
            },
            mysql: {
              sql: 'alter table `test` add column `bool_col` boolean not null',
              parameters: [],
            },
            sqlite: {
              sql: 'alter table "test" add column "bool_col" boolean not null',
              parameters: [],
            },
          })

          await builder.execute()

          expect(await getColumnMeta('test.bool_col')).to.containSubset({
            name: 'bool_col',
            isNullable: false,
            dataType:
              dialect === 'postgres'
                ? 'bool'
                : dialect === 'sqlite'
                ? 'boolean'
                : 'tinyint',
          })
        })

        if (dialect !== 'sqlite') {
          it('should add a unique column', async () => {
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
              sqlite: {
                sql: 'alter table "test" add column "bool_col" boolean not null unique',
                parameters: [],
              },
            })

            await builder.execute()

            expect(await getColumnMeta('test.bool_col')).to.containSubset({
              name: 'bool_col',
              isNullable: false,
              dataType: dialect === 'postgres' ? 'bool' : 'tinyint',
            })
          })
        }
      })

      if (dialect !== 'sqlite') {
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
              sqlite: {
                sql: 'alter table "test" add constraint "some_constraint" unique ("varchar_col", "integer_col")',
                parameters: [],
              },
            })

            await builder.execute()
          })
        })
      }

      if (dialect !== 'sqlite') {
        describe('add check constraint', () => {
          it('should add a check constraint', async () => {
            const builder = ctx.db.schema
              .alterTable('test')
              .addCheckConstraint('some_constraint', sql`integer_col > 0`)

            testSql(builder, dialect, {
              postgres: {
                sql: 'alter table "test" add constraint "some_constraint" check (integer_col > 0)',
                parameters: [],
              },
              mysql: {
                sql: 'alter table `test` add constraint `some_constraint` check (integer_col > 0)',
                parameters: [],
              },
              sqlite: {
                sql: 'alter table "test" add constraint "some_constraint" check (integer_col > 0)',
                parameters: [],
              },
            })

            await builder.execute()
          })
        })
      }

      if (dialect !== 'sqlite') {
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
              sqlite: {
                sql: 'alter table "test" add constraint "some_constraint" foreign key ("integer_col", "varchar_col") references "test2" ("a", "b")',
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
              sqlite: {
                sql: 'alter table "test" add constraint "some_constraint" foreign key ("integer_col", "varchar_col") references "test2" ("a", "b") on delete set null on update cascade',
                parameters: [],
              },
            })

            await builder.execute()
          })
        })

        describe('drop constraint', () => {
          it('should drop a foreign key constraint', async () => {
            await ctx.db.schema.dropTable('test').execute()

            await ctx.db.schema
              .createTable('test2')
              .addColumn('id', 'integer', (col) => col.unique())
              .execute()

            await ctx.db.schema
              .createTable('test')
              .addColumn('foreign_key', 'integer')
              .addForeignKeyConstraint(
                'foreign_key_constraint',
                ['foreign_key'],
                'test2',
                ['id']
              )
              .execute()

            const builder = ctx.db.schema
              .alterTable('test')
              .dropConstraint('foreign_key_constraint')

            testSql(builder, dialect, {
              postgres: {
                sql: 'alter table "test" drop constraint "foreign_key_constraint"',
                parameters: [],
              },
              mysql: {
                sql: 'alter table `test` drop constraint `foreign_key_constraint`',
                parameters: [],
              },
              sqlite: NOT_SUPPORTED,
            })

            await builder.execute()
          })
        })
      }
    })

    async function dropTestTables(): Promise<void> {
      await ctx.db.schema.dropTable('test').ifExists().execute()
      await ctx.db.schema.dropTable('test2').ifExists().execute()
    }

    async function getColumnMeta(ref: string): Promise<ColumnMetadata> {
      const [table, column] = ref.split('.')
      const tables = await ctx.db.introspection.getTables()
      const tableMeta = tables.find((it) => it.name === table)
      return tableMeta!.columns.find((it) => it.name === column)!
    }
  })
}
