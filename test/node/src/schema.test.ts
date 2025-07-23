import { fail } from 'assert'
import { ColumnMetadata, sql } from '../../../'

import {
  clearDatabase,
  destroyTest,
  expect,
  initTest,
  NOT_SUPPORTED,
  TestContext,
  testSql,
  DIALECTS,
} from './test-setup.js'

for (const dialect of DIALECTS) {
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
                .check(sql`b < a`),
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
              col.defaultTo(sql`gen_random_uuid()`),
            )
            .addColumn('p', 'int2')
            .addColumn('q', 'int4')
            .addColumn('r', 'int8')
            .addColumn('s', 'double precision', (col) =>
              col
                .generatedAlwaysAs(sql`f + g`)
                .stored()
                .notNull(),
            )
            .addColumn('t', 'time(6)')
            .addColumn('tz', 'timetz(6)')
            .addColumn('u', 'timestamp(6)', (col) =>
              col.notNull().defaultTo(sql`current_timestamp`),
            )
            .addColumn('v', 'timestamptz(6)')
            .addColumn('w', 'char(4)')
            .addColumn('x', 'char')
            .addColumn('y', 'bytea')

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
                '"tz" timetz(6),',
                '"u" timestamp(6) default current_timestamp not null,',
                '"v" timestamptz(6),',
                '"w" char(4),',
                '"x" char,',
                '"y" bytea)',
              ],
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()

          expect(await getColumnMeta('test.a')).to.eql({
            comment: undefined,
            dataType: 'int4',
            dataTypeSchema: 'pg_catalog',
            isAutoIncrementing: true,
            isNullable: false,
            hasDefaultValue: true,
            name: 'a',
          })

          expect(await getColumnMeta('test.b')).to.eql({
            comment: undefined,
            dataType: 'int4',
            dataTypeSchema: 'pg_catalog',
            isAutoIncrementing: false,
            isNullable: true,
            hasDefaultValue: false,
            name: 'b',
          })

          expect(await getColumnMeta('test.l')).to.eql({
            comment: undefined,
            dataType: 'bool',
            dataTypeSchema: 'pg_catalog',
            isAutoIncrementing: false,
            isNullable: false,
            hasDefaultValue: true,
            name: 'l',
          })
        })

        it('should create a table with "unique nulls not distinct" modifier for a column', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('a', 'varchar(10)', (builder) =>
              builder.unique().nullsNotDistinct(),
            )
            .addColumn('b', 'varchar(20)')

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "test" ("a" varchar(10) unique nulls not distinct, "b" varchar(20))',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })

        it('should create a table with "unique nulls not distinct" and other modifiers', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('a', 'integer', (builder) =>
              builder
                .check(sql`a < 100`)
                .nullsNotDistinct()
                .unique()
                .defaultTo(10),
            )
            .addColumn('b', 'varchar(20)')

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "test" ("a" integer default 10 unique nulls not distinct check (a < 100), "b" varchar(20))',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      } else if (dialect === 'mysql') {
        it('should create a table with all data types', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('a', 'integer', (col) =>
              col.primaryKey().autoIncrement(),
            )
            .addColumn('b', 'integer', (col) =>
              col.references('test.a').onDelete('cascade').onUpdate('set null'),
            )
            .addColumn('c', 'varchar(255)')
            .addColumn('d', 'bigint', (col) =>
              col.unsigned().unique().notNull(),
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
                .notNull(),
            )
            .addColumn('q', 'time(6)')
            .addColumn('r', 'datetime(6)')
            .addColumn('s', 'timestamp(6)', (col) =>
              col.notNull().defaultTo(sql`current_timestamp(6)`),
            )
            .addColumn('t', 'char(4)')
            .addColumn('u', 'char')
            .addColumn('v', 'binary(16)')
            .addColumn('w', 'varbinary(16)')

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
                '`s` timestamp(6) default current_timestamp(6) not null,',
                '`t` char(4),',
                '`u` char,',
                '`v` binary(16),',
                '`w` varbinary(16))',
              ],
              parameters: [],
            },
            postgres: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()

          expect(await getColumnMeta('test.a')).to.eql({
            comment: undefined,
            dataType: 'int',
            isAutoIncrementing: true,
            isNullable: false,
            hasDefaultValue: false,
            name: 'a',
          })

          expect(await getColumnMeta('test.b')).to.eql({
            comment: undefined,
            dataType: 'int',
            isAutoIncrementing: false,
            isNullable: true,
            hasDefaultValue: false,
            name: 'b',
          })

          expect(await getColumnMeta('test.k')).to.eql({
            comment: undefined,
            dataType: 'tinyint',
            isAutoIncrementing: false,
            isNullable: false,
            hasDefaultValue: true,
            name: 'k',
          })
        })
      } else if (dialect === 'mssql') {
        it('should create a table with all data types', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('a', 'integer', (col) =>
              col.identity().notNull().primaryKey(),
            )
            .addColumn('b', 'integer', (col) =>
              col
                .references('test.a')
                .onDelete('no action')
                .onUpdate('no action')
                .check(sql`b < 10`),
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
            .addColumn('l', sql`bit`, (col) => col.notNull().defaultTo(0))
            .addColumn('m', 'date')
            .addColumn('n', 'datetime', (col) =>
              col.defaultTo(sql`current_timestamp`),
            )
            .addColumn('o', sql`uniqueidentifier`, (col) =>
              col.notNull().defaultTo(sql`newid()`),
            )
            .addColumn('p', sql`smallint`)
            .addColumn('q', sql`int`)
            .addColumn('r', 'double precision', (col) => col.notNull())
            .addColumn('s', 'time(6)')
            .addColumn('t', 'timestamp', (col) => col.notNull())
            .addColumn('u', sql`datetime2`)
            .addColumn('v', 'char(4)')
            .addColumn('w', 'char')
            .addColumn('x', 'binary')
            .addColumn('y', sql``, (col) => col.modifyEnd(sql`as (a + f)`))
            .addColumn('z', 'varbinary')
            .addColumn('aa', 'varbinary(16)')

          testSql(builder, dialect, {
            mssql: {
              sql: [
                'create table "test"',
                '("a" integer identity not null primary key,',
                '"b" integer references "test" ("a") on delete no action on update no action check (b < 10),',
                '"c" varchar,',
                '"d" varchar(10),',
                '"e" bigint not null unique,',
                '"f" double precision,',
                '"g" real,',
                '"h" text,',
                '"i" varchar(123),',
                '"j" numeric(6, 2),',
                '"k" decimal(8, 4),',
                '"l" bit default 0 not null,',
                '"m" date,',
                '"n" datetime default current_timestamp,',
                '"o" uniqueidentifier default newid() not null,',
                '"p" smallint,',
                '"q" int,',
                '"r" double precision not null,',
                '"s" time(6),',
                '"t" timestamp not null,',
                '"u" datetime2,',
                '"v" char(4),',
                '"w" char,',
                '"x" binary,',
                '"y"  as (a + f),',
                '"z" varbinary,',
                '"aa" varbinary(16))',
              ],
              parameters: [],
            },
            postgres: NOT_SUPPORTED,
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      } else if (dialect === 'sqlite') {
        it('should create a table with all data types', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('a', 'integer', (col) =>
              col.primaryKey().autoIncrement().notNull(),
            )
            .addColumn('b', 'integer', (col) =>
              col
                .references('test.a')
                .onDelete('cascade')
                .onUpdate('restrict')
                .check(sql`b < a`),
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
                .notNull(),
            )
            .addColumn('s', 'blob')

          testSql(builder, dialect, {
            mssql: NOT_SUPPORTED,
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
            comment: undefined,
            dataType: 'INTEGER',
            isAutoIncrementing: true,
            isNullable: false,
            hasDefaultValue: false,
            name: 'a',
          })

          expect(await getColumnMeta('test.b')).to.eql({
            comment: undefined,
            dataType: 'INTEGER',
            isAutoIncrementing: false,
            isNullable: true,
            hasDefaultValue: false,
            name: 'b',
          })

          expect(await getColumnMeta('test.l')).to.eql({
            comment: undefined,
            dataType: 'boolean',
            isAutoIncrementing: false,
            isNullable: false,
            hasDefaultValue: true,
            name: 'l',
          })
        })
      } else {
        throw new Error(`Unknown dialect: ${dialect}`)
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
          mssql: {
            sql: 'create table "test" ("a" varchar(255), "b" varchar(255), "c" varchar(255), constraint "a_b_unique" unique ("a", "b"), constraint "b_c_unique" unique ("b", "c"))',
            parameters: [],
          },
          sqlite: {
            sql: 'create table "test" ("a" varchar(255), "b" varchar(255), "c" varchar(255), constraint "a_b_unique" unique ("a", "b"), constraint "b_c_unique" unique ("b", "c"))',
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (dialect == 'mysql') {
        it('should create a table with a unique constraints using expressions', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('a', 'varchar(255)')
            .addColumn('b', 'varchar(255)')
            .addColumn('c', 'varchar(255)')
            .addUniqueConstraint('a_b_unique', [
              sql`(lower(a))`,
              sql`(lower(b))`,
            ])
            .addUniqueConstraint('a_c_unique', [sql`(lower(a))`, 'c'])
          console.log('foo', builder.compile())

          testSql(builder, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: {
              sql: 'create table `test` (`a` varchar(255), `b` varchar(255), `c` varchar(255), constraint `a_b_unique` unique ((lower(a)), (lower(b))), constraint `a_c_unique` unique ((lower(a)), `c`))',
              parameters: [],
            },
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      if (dialect === 'postgres') {
        it('should create a table with a unique constraint and "nulls not distinct" option', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('a', 'varchar(255)')
            .addColumn('b', 'varchar(255)')
            .addUniqueConstraint('a_b_unique', ['a', 'b'], (uc) =>
              uc.nullsNotDistinct(),
            )

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "test" ("a" varchar(255), "b" varchar(255), constraint "a_b_unique" unique nulls not distinct ("a", "b"))',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })

        it('should create a table with deferrable unique constraints', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('a', 'varchar(255)')
            .addColumn('b', 'varchar(255)')
            .addUniqueConstraint('unique_1', ['a', 'b'], (uc) =>
              uc.deferrable(),
            )
            .addUniqueConstraint('unique_2', ['a', 'b'], (uc) =>
              uc.notDeferrable(),
            )
            .addUniqueConstraint('unique_3', ['a', 'b'], (uc) =>
              uc.deferrable().initiallyDeferred(),
            )
            .addUniqueConstraint('unique_4', ['a', 'b'], (uc) =>
              uc.deferrable().initiallyImmediate(),
            )

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "test" ("a" varchar(255), "b" varchar(255), constraint "unique_1" unique ("a", "b") deferrable, constraint "unique_2" unique ("a", "b") not deferrable, constraint "unique_3" unique ("a", "b") deferrable initially deferred, constraint "unique_4" unique ("a", "b") deferrable initially immediate)',
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

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
          mssql: {
            sql: 'create table "test" ("a" integer, "b" integer, "c" integer, constraint "check_a" check (a > 1), constraint "check_b" check (b < c))',
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
          mssql: {
            sql: 'create table "test" ("a" integer, "b" integer, constraint "primary" primary key ("a", "b"))',
            parameters: [],
          },
          sqlite: {
            sql: 'create table "test" ("a" integer, "b" integer, constraint "primary" primary key ("a", "b"))',
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (dialect === 'postgres') {
        it('should create a table with a deferrable primary key constraint', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('a', 'integer')
            .addPrimaryKeyConstraint('primary', ['a'], (pk) => pk.deferrable())

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "test" ("a" integer, constraint "primary" primary key ("a") deferrable)',
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
          })

          await builder.execute()
        })

        it('should create a table with not deferrable primary key constraint', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('a', 'integer')
            .addPrimaryKeyConstraint('primary', ['a'], (pk) =>
              pk.notDeferrable(),
            )

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "test" ("a" integer, constraint "primary" primary key ("a") not deferrable)',
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
          })

          await builder.execute()
        })

        it('should create a table with a deferrable initially deferred primary key constraint', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('a', 'integer')
            .addPrimaryKeyConstraint('primary', ['a'], (pk) =>
              pk.deferrable().initiallyDeferred(),
            )

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "test" ("a" integer, constraint "primary" primary key ("a") deferrable initially deferred)',
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
          })

          await builder.execute()
        })

        it('should create a table with a deferrable initially immediate primary key constraint', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('a', 'integer')
            .addPrimaryKeyConstraint('primary', ['a'], (pk) =>
              pk.deferrable().initiallyImmediate(),
            )

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "test" ("a" integer, constraint "primary" primary key ("a") deferrable initially immediate)',
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

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
          mssql: {
            sql: 'create table "test" ("a" integer, "b" integer, constraint "foreign_key" foreign key ("a", "b") references "test2" ("c", "d"))',
            parameters: [],
          },
          sqlite: {
            sql: 'create table "test" ("a" integer, "b" integer, constraint "foreign_key" foreign key ("a", "b") references "test2" ("c", "d"))',
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (dialect !== 'mysql' && dialect !== 'mssql') {
        it('should create a table with deferrable foreign key constraints', async () => {
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
              (fk) => fk.deferrable(),
            )
            .addForeignKeyConstraint(
              'foreign_key_2',
              ['a', 'b'],
              'test2',
              ['c', 'd'],
              (fk) => fk.notDeferrable(),
            )
            .addForeignKeyConstraint(
              'foreign_key_3',
              ['a', 'b'],
              'test2',
              ['c', 'd'],
              (fk) => fk.deferrable().initiallyDeferred(),
            )
            .addForeignKeyConstraint(
              'foreign_key_4',
              ['a', 'b'],
              'test2',
              ['c', 'd'],
              (fk) => fk.deferrable().initiallyImmediate(),
            )

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "test" ("a" integer, "b" integer, constraint "foreign_key" foreign key ("a", "b") references "test2" ("c", "d") deferrable, constraint "foreign_key_2" foreign key ("a", "b") references "test2" ("c", "d") not deferrable, constraint "foreign_key_3" foreign key ("a", "b") references "test2" ("c", "d") deferrable initially deferred, constraint "foreign_key_4" foreign key ("a", "b") references "test2" ("c", "d") deferrable initially immediate)',
              parameters: [],
            },
            sqlite: {
              sql: 'create table "test" ("a" integer, "b" integer, constraint "foreign_key" foreign key ("a", "b") references "test2" ("c", "d") deferrable, constraint "foreign_key_2" foreign key ("a", "b") references "test2" ("c", "d") not deferrable, constraint "foreign_key_3" foreign key ("a", "b") references "test2" ("c", "d") deferrable initially deferred, constraint "foreign_key_4" foreign key ("a", "b") references "test2" ("c", "d") deferrable initially immediate)',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      if (dialect === 'postgres' || dialect === 'mssql') {
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
              dialect === 'postgres' ? 'public.test2' : 'dbo.test2',
              ['c', 'd'],
            )

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "test" ("a" integer, "b" integer, constraint "foreign_key" foreign key ("a", "b") references "public"."test2" ("c", "d"))',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: {
              sql: 'create table "test" ("a" integer, "b" integer, constraint "foreign_key" foreign key ("a", "b") references "dbo"."test2" ("c", "d"))',
              parameters: [],
            },
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
            (cb) => cb.onUpdate('cascade'),
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
          mssql: {
            sql: 'create table "test" ("a" integer, "b" integer, constraint "foreign_key" foreign key ("a", "b") references "test2" ("c", "d") on update cascade)',
            parameters: [],
          },
          sqlite: {
            sql: 'create table "test" ("a" integer, "b" integer, constraint "foreign_key" foreign key ("a", "b") references "test2" ("c", "d") on update cascade)',
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (
        dialect === 'postgres' ||
        dialect === 'mysql' ||
        dialect === 'sqlite'
      ) {
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
            mssql: NOT_SUPPORTED,
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
            mssql: NOT_SUPPORTED,
            sqlite: {
              sql: 'create temporary table "test" ("id" integer primary key)',
              parameters: [],
            },
          })

          await builder.execute()
        })

        it('should create a table with as expression', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .as(ctx.db.selectFrom('person').select(['first_name', 'last_name']))

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "test" as select "first_name", "last_name" from "person"',
              parameters: [],
            },
            mysql: {
              sql: 'create table `test` as select `first_name`, `last_name` from `person`',
              parameters: [],
            },
            mssql: NOT_SUPPORTED,
            sqlite: {
              sql: 'create table "test" as select "first_name", "last_name" from "person"',
              parameters: [],
            },
          })

          await builder.execute()
        })

        it('should create a temporary table if not exists with as expression', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .temporary()
            .ifNotExists()
            .as(
              ctx.db
                .selectFrom('person')
                .select(['first_name', 'last_name'])
                .where('first_name', '=', 'Jennifer'),
            )

          testSql(builder, dialect, {
            postgres: {
              sql: 'create temporary table if not exists "test" as select "first_name", "last_name" from "person" where "first_name" = $1',
              parameters: ['Jennifer'],
            },
            mysql: {
              sql: 'create temporary table if not exists `test` as select `first_name`, `last_name` from `person` where `first_name` = ?',
              parameters: ['Jennifer'],
            },
            mssql: NOT_SUPPORTED,
            sqlite: {
              sql: 'create temporary table if not exists "test" as select "first_name", "last_name" from "person" where "first_name" = ?',
              parameters: ['Jennifer'],
            },
          })

          await builder.execute()
        })

        it('should create a table with as expression and raw sql', async () => {
          let rawSql = sql`select "first_name", "last_name" from "person"`
          if (dialect === 'mysql') {
            rawSql = sql`select \`first_name\`, \`last_name\` from \`person\``
          }

          const builder = ctx.db.schema.createTable('test').as(rawSql)

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "test" as select "first_name", "last_name" from "person"',
              parameters: [],
            },
            mysql: {
              sql: 'create table `test` as select `first_name`, `last_name` from `person`',
              parameters: [],
            },
            mssql: NOT_SUPPORTED,
            sqlite: {
              sql: 'create table "test" as select "first_name", "last_name" from "person"',
              parameters: [],
            },
          })

          await builder.execute()
        })

        it('should create a table with as expression and ignore addColumn', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .as(ctx.db.selectFrom('person').select(['first_name', 'last_name']))
            .addColumn('first_name', 'varchar(20)')

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "test" as select "first_name", "last_name" from "person"',
              parameters: [],
            },
            mysql: {
              sql: 'create table `test` as select `first_name`, `last_name` from `person`',
              parameters: [],
            },
            mssql: NOT_SUPPORTED,
            sqlite: {
              sql: 'create table "test" as select "first_name", "last_name" from "person"',
              parameters: [],
            },
          })

          await builder.execute()
        })
      }

      if (dialect === 'mssql') {
        it('should create a temporary table', async () => {
          await ctx.db.connection().execute(async (conn) => {
            const builder = conn.schema
              .createTable('##test')
              .addColumn('id', 'integer', (col) => col.primaryKey())

            testSql(builder, dialect, {
              postgres: NOT_SUPPORTED,
              mysql: NOT_SUPPORTED,
              mssql: {
                sql: 'create table "##test" ("id" integer primary key)',
                parameters: [],
              },
              sqlite: NOT_SUPPORTED,
            })

            await builder.execute()

            await sql`select * from "##test"`.execute(conn)
          })

          try {
            await sql`select * from "##test"`.execute(ctx.db)

            fail() // table is not gone!
          } catch (err) {
            // it works!
          }
        })
      }

      if (dialect === 'postgres') {
        it('should create a temporary table with on commit statement', async () => {
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
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      if (dialect === 'postgres' || dialect === 'mssql') {
        const schema = dialect === 'postgres' ? 'public' : 'dbo'

        it('should create a table in specific schema', async () => {
          const builder = ctx.db.schema
            .createTable(`${schema}.test`)
            .addColumn('id', 'varchar(32)', (col) => col.primaryKey())
            .addColumn('foreign_key', 'varchar(32)', (col) =>
              col.references(`${schema}.test.id`),
            )

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "public"."test" ("id" varchar(32) primary key, "foreign_key" varchar(32) references "public"."test" ("id"))',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: {
              sql: 'create table "dbo"."test" ("id" varchar(32) primary key, "foreign_key" varchar(32) references "dbo"."test" ("id"))',
              parameters: [],
            },
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
              col.generatedAlwaysAsIdentity(),
            )

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "test" ("id" integer generated always as identity)',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
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
              col.generatedByDefaultAsIdentity(),
            )

          testSql(builder, dialect, {
            postgres: {
              sql: 'create table "test" ("id" integer generated by default as identity)',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
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
            mssql: NOT_SUPPORTED,
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
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      if (dialect === 'mysql') {
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
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      if (dialect === 'sqlite') {
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
            mssql: NOT_SUPPORTED,
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

      if (dialect === 'mysql') {
        it('should create a table while using modifiers to define columns', async () => {
          const builder = ctx.db.schema
            .createTable('test')
            .addColumn('id', 'integer', (col) => col.primaryKey())
            .addColumn('first_name', 'varchar(36)', (col) =>
              col.modifyFront(sql`collate utf8mb4_general_ci`).notNull(),
            )
            .addColumn('age', 'integer', (col) =>
              col
                .unsigned()
                .notNull()
                .modifyEnd(
                  sql`comment ${sql.lit(
                    'it is not polite to ask a woman her age',
                  )}`,
                ),
            )

          testSql(builder, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: {
              sql: [
                'create table `test`',
                '(`id` integer primary key,',
                '`first_name` varchar(36) collate utf8mb4_general_ci not null,',
                "`age` integer unsigned not null comment 'it is not polite to ask a woman her age')",
              ],
              parameters: [],
            },
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      it('should create a table calling query builder functions', async () => {
        const builder = ctx.db.schema
          .createTable('test')
          .addColumn('id', 'integer', (col) => col.notNull())
          .$call((builder) =>
            builder.addColumn('call_me', 'varchar(10)', (col) =>
              col.defaultTo('maybe'),
            ),
          )

        testSql(builder, dialect, {
          postgres: {
            sql: [
              'create table "test"',
              '("id" integer not null,',
              `"call_me" varchar(10) default 'maybe')`,
            ],
            parameters: [],
          },
          mysql: {
            sql: [
              'create table `test`',
              '(`id` integer not null,',
              "`call_me` varchar(10) default 'maybe')",
            ],
            parameters: [],
          },
          mssql: {
            sql: [
              'create table "test"',
              '("id" integer not null,',
              `"call_me" varchar(10) default 'maybe')`,
            ],
            parameters: [],
          },
          sqlite: {
            sql: [
              'create table "test"',
              '("id" integer not null,',
              `"call_me" varchar(10) default 'maybe')`,
            ],
            parameters: [],
          },
        })

        await builder.execute()
      })
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
          mssql: {
            sql: 'drop table "test"',
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
          mssql: {
            sql: 'drop table if exists "test"',
            parameters: [],
          },
          sqlite: {
            sql: 'drop table if exists "test"',
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (dialect == 'postgres' || dialect === 'mysql' || dialect === 'mssql') {
        it('should drop a table cascade', async () => {
          const builder = ctx.db.schema.dropTable('test').cascade()
          testSql(builder, dialect, {
            postgres: {
              sql: 'drop table "test" cascade',
              parameters: [],
            },
            mysql: {
              sql: 'drop table `test` cascade',
              parameters: [],
            },
            mssql: {
              sql: 'drop table "test" cascade',
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
          })
        })

        it('should drop a table cascade if it exists', async () => {
          const builder = ctx.db.schema.dropTable('test').cascade().ifExists()
          testSql(builder, dialect, {
            postgres: {
              sql: 'drop table if exists "test" cascade',
              parameters: [],
            },
            mysql: {
              sql: 'drop table if exists `test` cascade',
              parameters: [],
            },
            mssql: {
              sql: 'drop table if exists "test" cascade',
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
          })
        })
      }
    })

    describe('create index', () => {
      beforeEach(async () => {
        await ctx.db.schema
          .createTable('test')
          .addColumn('id', 'bigint', (col) => col.primaryKey())
          .addColumn('first_name', 'varchar(255)')
          .addColumn('last_name', 'varchar(255)')
          .addColumn('age', 'integer')
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
          mssql: {
            sql: 'create index "test_first_name_index" on "test" ("first_name")',
            parameters: [],
          },
          sqlite: {
            sql: 'create index "test_first_name_index" on "test" ("first_name")',
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (dialect === 'postgres' || dialect === 'sqlite') {
        it('should create an index if not exists', async () => {
          await ctx.db.schema
            .createIndex('test_first_name_index')
            .on('test')
            .column('first_name')
            .execute()

          const builder = ctx.db.schema
            .createIndex('test_first_name_index')
            .ifNotExists()
            .on('test')
            .column('first_name')

          testSql(builder, dialect, {
            postgres: {
              sql: 'create index if not exists "test_first_name_index" on "test" ("first_name")',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: {
              sql: 'create index if not exists "test_first_name_index" on "test" ("first_name")',
              parameters: [],
            },
          })

          await builder.execute()
        })
      }

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
          mssql: {
            sql: 'create unique index "test_first_name_index" on "test" ("first_name")',
            parameters: [],
          },
          sqlite: {
            sql: 'create unique index "test_first_name_index" on "test" ("first_name")',
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (dialect === 'postgres' || dialect === 'mysql') {
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
              sql: 'create index `test_first_name_index` using hash on `test` (`first_name`)',
              parameters: [],
            },
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      if (dialect === 'postgres') {
        it('should create an index with "nulls not distinct" modifier', async () => {
          const builder = ctx.db.schema
            .createIndex('test_first_name_index')
            .on('test')
            .nullsNotDistinct()
            .column('first_name')

          testSql(builder, dialect, {
            postgres: {
              sql: 'create index "test_first_name_index" on "test" ("first_name") nulls not distinct',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })

        it('should create an index with "nulls not distinct" and other modifiers', async () => {
          const builder = ctx.db.schema
            .createIndex('test_first_last_name_index')
            .nullsNotDistinct()
            .ifNotExists()
            .columns(['first_name', 'last_name'])
            .using('btree')
            .unique()
            .where('first_name', 'like', 'test%')
            .on('test')

          testSql(builder, dialect, {
            postgres: {
              sql:
                'create unique index if not exists "test_first_last_name_index" on "test" ' +
                'using btree ("first_name", "last_name") nulls not distinct where "first_name" like \'test%\'',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
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
          mssql: {
            sql: 'create index "test_name_index" on "test" ("first_name", "last_name")',
            parameters: [],
          },
          sqlite: {
            sql: 'create index "test_name_index" on "test" ("first_name", "last_name")',
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (
        dialect === 'postgres' ||
        dialect === 'mysql' ||
        dialect === 'sqlite'
      ) {
        it('should create an index for an expression', async () => {
          const builder = ctx.db.schema
            .createIndex('test_first_name_index')
            .on('test')
            .expression(sql`(first_name < 'Sami')`)

          testSql(builder, dialect, {
            postgres: {
              sql: `create index "test_first_name_index" on "test" ((first_name < 'Sami'))`,
              parameters: [],
            },
            mysql: {
              sql: "create index `test_first_name_index` on `test` ((first_name < 'Sami'))",
              parameters: [],
            },
            mssql: NOT_SUPPORTED,
            sqlite: {
              sql: `create index "test_first_name_index" on "test" ((first_name < 'Sami'))`,
              parameters: [],
            },
          })

          await builder.execute()
        })
      }

      it('should create a sorted index, single column', async () => {
        const builder = ctx.db.schema
          .createIndex('test_descending_first_name_index')
          .on('test')
          .column('first_name desc')

        testSql(builder, dialect, {
          postgres: {
            sql: 'create index "test_descending_first_name_index" on "test" ("first_name" desc)',
            parameters: [],
          },
          mysql: {
            sql: 'create index `test_descending_first_name_index` on `test` (`first_name` desc)',
            parameters: [],
          },
          mssql: {
            sql: 'create index "test_descending_first_name_index" on "test" ("first_name" desc)',
            parameters: [],
          },
          sqlite: {
            sql: 'create index "test_descending_first_name_index" on "test" ("first_name" desc)',
            parameters: [],
          },
        })

        await builder.execute()
      })

      it('should create a sorted index, multi-column', async () => {
        const builder = ctx.db.schema
          .createIndex('test_first_name_descending_last_name_index')
          .on('test')
          .columns(['first_name', 'last_name desc'])

        testSql(builder, dialect, {
          postgres: {
            sql: 'create index "test_first_name_descending_last_name_index" on "test" ("first_name", "last_name" desc)',
            parameters: [],
          },
          mysql: {
            sql: 'create index `test_first_name_descending_last_name_index` on `test` (`first_name`, `last_name` desc)',
            parameters: [],
          },
          mssql: {
            sql: 'create index "test_first_name_descending_last_name_index" on "test" ("first_name", "last_name" desc)',
            parameters: [],
          },
          sqlite: {
            sql: 'create index "test_first_name_descending_last_name_index" on "test" ("first_name", "last_name" desc)',
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (
        dialect === 'postgres' ||
        dialect === 'mssql' ||
        dialect === 'sqlite'
      ) {
        it('should create a partial index, single column', async () => {
          const builder = ctx.db.schema
            .createIndex('test_partial_index')
            .on('test')
            .column('first_name')
            .where('first_name', '=', 'Sami')

          testSql(builder, dialect, {
            postgres: {
              sql: `create index "test_partial_index" on "test" ("first_name") where "first_name" = 'Sami'`,
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: {
              sql: `create index "test_partial_index" on "test" ("first_name") where "first_name" = 'Sami'`,
              parameters: [],
            },
            sqlite: {
              sql: `create index "test_partial_index" on "test" ("first_name") where "first_name" = 'Sami'`,
              parameters: [],
            },
          })

          await builder.execute()
        })

        it('should create a partial index, multi-column, and', async () => {
          const builder = ctx.db.schema
            .createIndex('test_partial_index')
            .on('test')
            .columns(['first_name', 'last_name'])
            .where((eb) =>
              eb.and([
                eb('first_name', '=', 'Igal'),
                eb(sql.ref('age'), '>=', 18),
              ]),
            )

          testSql(builder, dialect, {
            postgres: {
              sql: `create index "test_partial_index" on "test" ("first_name", "last_name") where ("first_name" = 'Igal' and "age" >= 18)`,
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: {
              sql: `create index "test_partial_index" on "test" ("first_name", "last_name") where ("first_name" = 'Igal' and "age" >= 18)`,
              parameters: [],
            },
            sqlite: {
              sql: `create index "test_partial_index" on "test" ("first_name", "last_name") where ("first_name" = 'Igal' and "age" >= 18)`,
              parameters: [],
            },
          })

          await builder.execute()
        })
      }

      if (dialect === 'postgres' || dialect === 'sqlite') {
        it('should create a partial index, multi-column, or', async () => {
          const builder = ctx.db.schema
            .createIndex('test_partial_index')
            .on('test')
            .columns(['first_name', 'last_name'])
            .where((eb) =>
              eb.or([
                eb('first_name', '=', 'Igal'),
                eb(sql.ref('age'), '>=', 18),
              ]),
            )

          testSql(builder, dialect, {
            postgres: {
              sql: `create index "test_partial_index" on "test" ("first_name", "last_name") where ("first_name" = 'Igal' or "age" >= 18)`,
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: {
              sql: `create index "test_partial_index" on "test" ("first_name", "last_name") where ("first_name" = 'Igal' or "age" >= 18)`,
              parameters: [],
            },
          })

          await builder.execute()
        })
      }
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

        if (dialect === 'mysql' || dialect === 'mssql') {
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
          mssql: {
            sql: 'drop index "test_first_name_index" on "test"',
            parameters: [],
          },
          sqlite: {
            sql: 'drop index "test_first_name_index"',
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (
        dialect === 'postgres' ||
        dialect === 'mssql' ||
        dialect === 'sqlite'
      ) {
        it('should drop an index if it exists', async () => {
          let builder = ctx.db.schema
            .dropIndex('test_first_name_index')
            .ifExists()

          if (dialect === 'mssql') {
            builder = builder.on('test')
          }

          testSql(builder, dialect, {
            postgres: {
              sql: 'drop index if exists "test_first_name_index"',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: {
              sql: 'drop index if exists "test_first_name_index" on "test"',
              parameters: [],
            },
            sqlite: {
              sql: 'drop index if exists "test_first_name_index"',
              parameters: [],
            },
          })

          await builder.execute()
        })
      }

      if (dialect === 'postgres') {
        it('should drop an index cascade', async () => {
          let builder = ctx.db.schema
            .dropIndex('test_first_name_index')
            .cascade()

          testSql(builder, dialect, {
            postgres: {
              sql: 'drop index "test_first_name_index" cascade',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })

        it('should drop an index cascade if it exists', async () => {
          let builder = ctx.db.schema
            .dropIndex('test_first_name_index')
            .cascade()
            .ifExists()

          testSql(builder, dialect, {
            postgres: {
              sql: 'drop index if exists "test_first_name_index" cascade',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
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
          mssql: {
            sql: `create view "dogs" as select * from "pet" where "species" = 'dog'`,
            parameters: [],
          },
          sqlite: {
            sql: `create view "dogs" as select * from "pet" where "species" = 'dog'`,
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (dialect === 'postgres' || dialect === 'sqlite') {
        it('should create a temporary view', async () => {
          const builder = ctx.db.schema
            .createView('dogs')
            .temporary()
            .as(
              ctx.db.selectFrom('pet').selectAll().where('species', '=', 'dog'),
            )

          testSql(builder, dialect, {
            postgres: {
              sql: `create temporary view "dogs" as select * from "pet" where "species" = 'dog'`,
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: {
              sql: `create temporary view "dogs" as select * from "pet" where "species" = 'dog'`,
              parameters: [],
            },
          })

          await builder.execute()
        })
      }

      if (dialect === 'postgres' || dialect === 'mysql') {
        it('should create or replace a view', async () => {
          const builder = ctx.db.schema
            .createView('dogs')
            .orReplace()
            .as(
              ctx.db.selectFrom('pet').selectAll().where('species', '=', 'dog'),
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
            mssql: NOT_SUPPORTED,
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
              ctx.db.selectFrom('pet').selectAll().where('species', '=', 'dog'),
            )

          testSql(builder, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: {
              sql: `create view if not exists "dogs" as select * from "pet" where "species" = 'dog'`,
              parameters: [],
            },
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
              ctx.db.selectFrom('pet').selectAll().where('species', '=', 'dog'),
            )

          testSql(builder, dialect, {
            postgres: {
              sql: `create materialized view "materialized_dogs" as select * from "pet" where "species" = 'dog'`,
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
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

    describe('refresh materialized view', () => {
      beforeEach(async () => {
        await ctx.db.schema
          .createView('materialized_dogs')
          .materialized()
          .as(ctx.db.selectFrom('pet').selectAll().where('species', '=', 'dog'))
          .execute()
      })

      afterEach(async () => {
        await ctx.db.schema
          .dropView('materialized_dogs')
          .materialized()
          .ifExists()
          .execute()
      })

      if (dialect === 'postgres') {
        it('should refresh a materialized view', async () => {
          const builder =
            ctx.db.schema.refreshMaterializedView('materialized_dogs')

          testSql(builder, dialect, {
            postgres: {
              sql: `refresh materialized view "materialized_dogs" with data`,
              parameters: [],
            },
            mssql: NOT_SUPPORTED,
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })

        it('should refresh a materialized view concurrently', async () => {
          // concurrent refreshes require a unique index
          await ctx.db.schema
            .createIndex('materialized_dogs_index')
            .unique()
            .on('materialized_dogs')
            .columns(['id'])
            .execute()

          const builder = ctx.db.schema
            .refreshMaterializedView('materialized_dogs')
            .concurrently()

          testSql(builder, dialect, {
            postgres: {
              sql: `refresh materialized view concurrently "materialized_dogs" with data`,
              parameters: [],
            },
            mssql: NOT_SUPPORTED,
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })

        it('should refresh a materialized view with no data', async () => {
          const builder = ctx.db.schema
            .refreshMaterializedView('materialized_dogs')
            .withNoData()

          testSql(builder, dialect, {
            postgres: {
              sql: `refresh materialized view "materialized_dogs" with no data`,
              parameters: [],
            },
            mssql: NOT_SUPPORTED,
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
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
          mssql: {
            sql: `drop view "dogs"`,
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
          mssql: {
            sql: `drop view if exists "dogs"`,
            parameters: [],
          },
          sqlite: {
            sql: `drop view if exists "dogs"`,
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (dialect === 'postgres' || dialect === 'mysql') {
        it('should drop a view cascade', async () => {
          const builder = ctx.db.schema.dropView('dogs').cascade()

          testSql(builder, dialect, {
            postgres: {
              sql: `drop view "dogs" cascade`,
              parameters: [],
            },
            mysql: {
              sql: 'drop view `dogs` cascade',
              parameters: [],
            },
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })

        it('should drop a view cascade if it exists', async () => {
          const builder = ctx.db.schema.dropView('dogs').ifExists().cascade()

          testSql(builder, dialect, {
            postgres: {
              sql: `drop view if exists "dogs" cascade`,
              parameters: [],
            },
            mysql: {
              sql: 'drop view if exists `dogs` cascade',
              parameters: [],
            },
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }
    })

    describe('create schema', () => {
      beforeEach(cleanup)
      afterEach(cleanup)

      if (
        dialect === 'postgres' ||
        dialect === 'mysql' ||
        dialect === 'mssql'
      ) {
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
            mssql: {
              sql: `create schema "pets"`,
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      if (dialect === 'postgres' || dialect === 'mysql') {
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
            mssql: NOT_SUPPORTED,
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
      beforeEach(cleanup)
      afterEach(cleanup)

      if (
        dialect === 'postgres' ||
        dialect === 'mysql' ||
        dialect === 'mssql'
      ) {
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
            mssql: {
              sql: `drop schema "pets"`,
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
            mssql: {
              sql: `drop schema if exists "pets"`,
              parameters: [],
            },
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      if (dialect === 'postgres') {
        it('should drop a schema cascade', async () => {
          await ctx.db.schema.createSchema('pets').execute()
          const builder = ctx.db.schema.dropSchema('pets').cascade()

          testSql(builder, dialect, {
            postgres: {
              sql: `drop schema "pets" cascade`,
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })

        it('should drop a schema cascade if exists', async () => {
          const builder = ctx.db.schema.dropSchema('pets').cascade().ifExists()

          testSql(builder, dialect, {
            postgres: {
              sql: `drop schema if exists "pets" cascade`,
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
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
            mssql: NOT_SUPPORTED,
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
            mssql: NOT_SUPPORTED,
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
            mssql: NOT_SUPPORTED,
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

      describe('add column', () => {
        it('should add a column', async () => {
          const builder = ctx.db.schema
            .alterTable('test')
            .addColumn('date_col', 'date', (cb) => cb.notNull())

          testSql(builder, dialect, {
            postgres: {
              sql: 'alter table "test" add column "date_col" date not null',
              parameters: [],
            },
            mysql: {
              sql: 'alter table `test` add column `date_col` date not null',
              parameters: [],
            },
            mssql: {
              sql: 'alter table "test" add "date_col" date not null',
              parameters: [],
            },
            sqlite: {
              sql: 'alter table "test" add column "date_col" date not null',
              parameters: [],
            },
          })

          await builder.execute()
        })

        if (dialect === 'postgres') {
          it('should add a column with "unique nulls not distinct" modifier', async () => {
            const builder = ctx.db.schema
              .alterTable('test')
              .addColumn('desc', 'varchar(20)', (cb) =>
                cb.unique().nullsNotDistinct(),
              )

            testSql(builder, dialect, {
              postgres: {
                sql: 'alter table "test" add column "desc" varchar(20) unique nulls not distinct',
                parameters: [],
              },
              mysql: NOT_SUPPORTED,
              mssql: NOT_SUPPORTED,
              sqlite: NOT_SUPPORTED,
            })

            await builder.execute()
          })

          it('should add a column with "if not exists" modifier', async () => {
            const builder = ctx.db.schema
              .alterTable('test')
              .addColumn('desc', 'varchar(20)', (cb) => cb.ifNotExists())

            testSql(builder, dialect, {
              postgres: {
                sql: 'alter table "test" add column if not exists "desc" varchar(20)',
                parameters: [],
              },
              mysql: NOT_SUPPORTED,
              mssql: NOT_SUPPORTED,
              sqlite: NOT_SUPPORTED,
            })

            await builder.execute()
          })
        }

        if (dialect === 'postgres' || dialect === 'mysql') {
          it('should add a unique column', async () => {
            const builder = ctx.db.schema
              .alterTable('test')
              .addColumn('bool_col', 'boolean', (cb) => cb.notNull().unique())

            testSql(builder, dialect, {
              postgres: {
                sql: 'alter table "test" add column "bool_col" boolean not null unique',
                parameters: [],
              },
              mysql: {
                sql: 'alter table `test` add column `bool_col` boolean not null unique',
                parameters: [],
              },
              mssql: NOT_SUPPORTED,
              sqlite: NOT_SUPPORTED,
            })

            await builder.execute()

            expect(await getColumnMeta('test.bool_col')).to.containSubset({
              name: 'bool_col',
              isNullable: false,
              dataType: dialect === 'postgres' ? 'bool' : 'tinyint',
            })
          })
        }

        if (
          dialect === 'postgres' ||
          dialect === 'mysql' ||
          dialect === 'mssql'
        ) {
          it('should add multiple columns', async () => {
            const builder = ctx.db.schema
              .alterTable('test')
              .addColumn('another_col', 'text')
              .addColumn('yet_another_col', 'integer')

            testSql(builder, dialect, {
              postgres: {
                sql: [
                  'alter table "test"',
                  'add column "another_col" text,',
                  'add column "yet_another_col" integer',
                ],
                parameters: [],
              },
              mysql: {
                sql: [
                  'alter table `test`',
                  'add column `another_col` text,',
                  'add column `yet_another_col` integer',
                ],
                parameters: [],
              },
              mssql: {
                sql: [
                  'alter table "test"',
                  'add "another_col" text,',
                  '"yet_another_col" integer',
                ],
                parameters: [],
              },
              sqlite: NOT_SUPPORTED,
            })

            await builder.execute()
          })
        }
      })

      if (dialect === 'mysql') {
        describe('modify column', () => {
          it('should set column data type', async () => {
            const builder = ctx.db.schema
              .alterTable('test')
              .modifyColumn('varchar_col', 'text')

            testSql(builder, dialect, {
              postgres: NOT_SUPPORTED,
              mysql: {
                sql: 'alter table `test` modify column `varchar_col` text',
                parameters: [],
              },
              mssql: NOT_SUPPORTED,
              sqlite: NOT_SUPPORTED,
            })

            await builder.execute()
          })

          it('should add not null constraint for column', async () => {
            const builder = ctx.db.schema
              .alterTable('test')
              .modifyColumn('varchar_col', 'varchar(255)', (cb) => cb.notNull())

            testSql(builder, dialect, {
              mysql: {
                sql: 'alter table `test` modify column `varchar_col` varchar(255) not null',
                parameters: [],
              },
              postgres: NOT_SUPPORTED,
              mssql: NOT_SUPPORTED,
              sqlite: NOT_SUPPORTED,
            })

            await builder.execute()
          })

          it('should drop not null constraint for column', async () => {
            await ctx.db.schema
              .alterTable('test')
              .modifyColumn('varchar_col', 'varchar(255)', (cb) => cb.notNull())
              .execute()

            expect(
              (await getColumnMeta('test.varchar_col')).isNullable,
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
              mssql: NOT_SUPPORTED,
              sqlite: NOT_SUPPORTED,
            })

            await builder.execute()

            expect(
              (await getColumnMeta('test.varchar_col')).isNullable,
            ).to.equal(true)
          })

          it('should modify multiple columns', async () => {
            const builder = ctx.db.schema
              .alterTable('test')
              .modifyColumn('varchar_col', 'varchar(255)')
              .modifyColumn('integer_col', 'bigint')

            testSql(builder, dialect, {
              mysql: {
                sql: [
                  'alter table `test`',
                  'modify column `varchar_col` varchar(255),',
                  'modify column `integer_col` bigint',
                ],
                parameters: [],
              },
              postgres: NOT_SUPPORTED,
              mssql: NOT_SUPPORTED,
              sqlite: NOT_SUPPORTED,
            })

            await builder.execute()
          })
        })
      }

      if (
        dialect === 'postgres' ||
        dialect === 'mysql' ||
        dialect === 'mssql'
      ) {
        describe('alter column', () => {
          if (dialect === 'postgres' || dialect === 'mysql') {
            it('should set default value', async () => {
              const builder = ctx.db.schema
                .alterTable('test')
                .alterColumn('varchar_col', (ac) => ac.setDefault('foo'))

              testSql(builder, dialect, {
                postgres: {
                  sql: `alter table "test" alter column "varchar_col" set default 'foo'`,
                  parameters: [],
                },
                mysql: {
                  sql: "alter table `test` alter column `varchar_col` set default 'foo'",
                  parameters: [],
                },
                mssql: NOT_SUPPORTED,
                sqlite: NOT_SUPPORTED,
              })

              await builder.execute()
            })

            it('should drop default value', async () => {
              const subject = 'varchar_col'

              await ctx.db.schema
                .alterTable('test')
                .alterColumn(subject, (ac) => ac.setDefault('foo'))
                .execute()

              const builder = ctx.db.schema
                .alterTable('test')
                .alterColumn(subject, (ac) => ac.dropDefault())

              testSql(builder, dialect, {
                postgres: {
                  sql: 'alter table "test" alter column "varchar_col" drop default',
                  parameters: [],
                },
                mysql: {
                  sql: 'alter table `test` alter column `varchar_col` drop default',
                  parameters: [],
                },
                mssql: NOT_SUPPORTED,
                sqlite: NOT_SUPPORTED,
              })
              await builder.execute()
            })
          }

          if (dialect === 'postgres' || dialect === 'mssql') {
            it('should set column data type', async () => {
              const builder = ctx.db.schema
                .alterTable('test')
                .alterColumn('varchar_col', (ac) => ac.setDataType('text'))

              testSql(builder, dialect, {
                postgres: {
                  sql: 'alter table "test" alter column "varchar_col" type text',
                  parameters: [],
                },
                mysql: NOT_SUPPORTED,
                mssql: {
                  sql: 'alter table "test" alter column "varchar_col" text',
                  parameters: [],
                },
                sqlite: NOT_SUPPORTED,
              })

              await builder.execute()
            })

            it('should set column data type from expression', async () => {
              const builder = ctx.db.schema
                .alterTable('test')
                .alterColumn('varchar_col', (ac) => ac.setDataType(sql`text`))

              testSql(builder, dialect, {
                postgres: {
                  sql: 'alter table "test" alter column "varchar_col" type text',
                  parameters: [],
                },
                mysql: NOT_SUPPORTED,
                mssql: {
                  sql: 'alter table "test" alter column "varchar_col" text',
                  parameters: [],
                },
                sqlite: NOT_SUPPORTED,
              })

              await builder.execute()
            })
          }

          if (dialect === 'postgres') {
            it('should add not null constraint for column', async () => {
              const builder = ctx.db.schema
                .alterTable('test')
                .alterColumn('varchar_col', (ac) => ac.setNotNull())

              testSql(builder, dialect, {
                postgres: {
                  sql: 'alter table "test" alter column "varchar_col" set not null',
                  parameters: [],
                },
                mysql: NOT_SUPPORTED,
                mssql: NOT_SUPPORTED,
                sqlite: NOT_SUPPORTED,
              })

              await builder.execute()
            })

            it('should drop not null constraint for column', async () => {
              await ctx.db.schema
                .alterTable('test')
                .alterColumn('varchar_col', (ac) => ac.setNotNull())
                .execute()

              const builder = ctx.db.schema
                .alterTable('test')
                .alterColumn('varchar_col', (ac) => ac.dropNotNull())

              testSql(builder, dialect, {
                postgres: {
                  sql: 'alter table "test" alter column "varchar_col" drop not null',
                  parameters: [],
                },
                mysql: NOT_SUPPORTED,
                mssql: NOT_SUPPORTED,
                sqlite: NOT_SUPPORTED,
              })

              await builder.execute()
            })
          }

          if (dialect === 'postgres' || dialect === 'mysql') {
            it('should alter multiple columns', async () => {
              const builder = ctx.db.schema
                .alterTable('test')
                .alterColumn('varchar_col', (ac) => ac.setDefault('foo'))
                .alterColumn('integer_col', (ac) => ac.setDefault(5))

              testSql(builder, dialect, {
                postgres: {
                  sql: [
                    `alter table "test"`,
                    `alter column "varchar_col" set default 'foo',`,
                    `alter column "integer_col" set default 5`,
                  ],
                  parameters: [],
                },
                mysql: {
                  sql: [
                    'alter table `test`',
                    "alter column `varchar_col` set default 'foo',",
                    'alter column `integer_col` set default 5',
                  ],
                  parameters: [],
                },
                mssql: NOT_SUPPORTED,
                sqlite: NOT_SUPPORTED,
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
            mssql: {
              sql: 'alter table "test" drop column "varchar_col"',
              parameters: [],
            },
            sqlite: {
              sql: 'alter table "test" drop column "varchar_col"',
              parameters: [],
            },
          })

          await builder.execute()
        })

        if (
          dialect === 'postgres' ||
          dialect === 'mysql' ||
          dialect === 'mssql'
        ) {
          it('should drop multiple columns', async () => {
            await ctx.db.schema
              .alterTable('test')
              .addColumn('text_col', 'text')
              .execute()

            const builder = ctx.db.schema
              .alterTable('test')
              .dropColumn('varchar_col')
              .dropColumn('text_col')

            testSql(builder, dialect, {
              postgres: {
                sql: [
                  'alter table "test"',
                  'drop column "varchar_col",',
                  'drop column "text_col"',
                ],
                parameters: [],
              },
              mysql: {
                sql: [
                  'alter table `test`',
                  'drop column `varchar_col`,',
                  'drop column `text_col`',
                ],
                parameters: [],
              },
              mssql: {
                sql: [
                  'alter table "test"',
                  'drop column "varchar_col",',
                  '"text_col"',
                ],
                parameters: [],
              },
              sqlite: {
                sql: [
                  'alter table "test"',
                  'drop column "varchar_col",',
                  'drop column "text_col"',
                ],
                parameters: [],
              },
            })

            await builder.execute()
          })
        }
      })

      if (
        dialect === 'postgres' ||
        dialect === 'mysql' ||
        dialect === 'sqlite'
      ) {
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
              mssql: NOT_SUPPORTED,
              sqlite: {
                sql: 'alter table "test" rename to "test2"',
                parameters: [],
              },
            })

            await builder.execute()
          })
        })
      }

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
              mssql: NOT_SUPPORTED,
              sqlite: NOT_SUPPORTED,
            })

            await builder.execute()
          })
        })
      }

      if (
        dialect === 'postgres' ||
        dialect === 'mysql' ||
        dialect === 'sqlite'
      ) {
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
              mssql: NOT_SUPPORTED,
              sqlite: {
                sql: 'alter table "test" rename column "varchar_col" to "text_col"',
                parameters: [],
              },
            })

            await builder.execute()
          })

          if (dialect === 'mysql') {
            it('should rename multiple columns', async () => {
              const builder = ctx.db.schema
                .alterTable('test')
                .renameColumn('varchar_col', 'text_col')
                .renameColumn('integer_col', 'number_col')

              testSql(builder, dialect, {
                postgres: NOT_SUPPORTED,
                mysql: {
                  sql: [
                    'alter table `test`',
                    'rename column `varchar_col` to `text_col`,',
                    'rename column `integer_col` to `number_col`',
                  ],
                  parameters: [],
                },
                mssql: NOT_SUPPORTED,
                sqlite: NOT_SUPPORTED,
              })

              await builder.execute()
            })
          }
        })
      }

      if (dialect === 'postgres' || dialect === 'mysql') {
        describe('mixed column alterations', () => {
          if (dialect === 'postgres') {
            it('should alter multiple columns in various ways', async () => {
              const builder = ctx.db.schema
                .alterTable('test')
                .addColumn('another_varchar_col', 'varchar(255)')
                .alterColumn('varchar_col', (ac) => ac.setDefault('foo'))
                .dropColumn('integer_col')

              testSql(builder, dialect, {
                postgres: {
                  sql: [
                    `alter table "test"`,
                    `add column "another_varchar_col" varchar(255),`,
                    `alter column "varchar_col" set default 'foo',`,
                    `drop column "integer_col"`,
                  ],
                  parameters: [],
                },
                mysql: NOT_SUPPORTED,
                mssql: NOT_SUPPORTED,
                sqlite: NOT_SUPPORTED,
              })

              await builder.execute()
            })
          }

          if (dialect === 'mysql') {
            it('should alter multiple columns in various ways', async () => {
              await ctx.db.schema
                .alterTable('test')
                .addColumn('rename_me', 'text')
                .addColumn('modify_me', 'boolean')
                .execute()

              const builder = ctx.db.schema
                .alterTable('test')
                .addColumn('another_varchar_col', 'varchar(255)')
                .alterColumn('varchar_col', (ac) => ac.setDefault('foo'))
                .dropColumn('integer_col')
                .renameColumn('rename_me', 'text_col')
                .modifyColumn('modify_me', 'bigint')

              testSql(builder, dialect, {
                postgres: NOT_SUPPORTED,
                mysql: {
                  sql: [
                    'alter table `test`',
                    'add column `another_varchar_col` varchar(255),',
                    "alter column `varchar_col` set default 'foo',",
                    'drop column `integer_col`,',
                    'rename column `rename_me` to `text_col`,',
                    'modify column `modify_me` bigint',
                  ],
                  parameters: [],
                },
                mssql: NOT_SUPPORTED,
                sqlite: NOT_SUPPORTED,
              })

              await builder.execute()
            })
          }
        })
      }

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
              mssql: {
                sql: 'alter table "test" add constraint "some_constraint" unique ("varchar_col", "integer_col")',
                parameters: [],
              },
              sqlite: {
                sql: 'alter table "test" add constraint "some_constraint" unique ("varchar_col", "integer_col")',
                parameters: [],
              },
            })

            await builder.execute()
          })

          if (dialect === 'postgres') {
            it('should add a unique constraint with "nulls not distinct" modifier', async () => {
              const builder = ctx.db.schema
                .alterTable('test')
                .addUniqueConstraint(
                  'varchar_col_constaint',
                  ['varchar_col'],
                  (builder) => builder.nullsNotDistinct(),
                )

              testSql(builder, dialect, {
                postgres: {
                  sql: 'alter table "test" add constraint "varchar_col_constaint" unique nulls not distinct ("varchar_col")',
                  parameters: [],
                },
                mysql: NOT_SUPPORTED,
                mssql: NOT_SUPPORTED,
                sqlite: NOT_SUPPORTED,
              })

              await builder.execute()
            })

            it('should add a deferrable unique constraint', async () => {
              const builder = ctx.db.schema
                .alterTable('test')
                .addUniqueConstraint(
                  'some_constraint',
                  ['varchar_col', 'integer_col'],
                  (uc) => uc.deferrable(),
                )

              testSql(builder, dialect, {
                postgres: {
                  sql: 'alter table "test" add constraint "some_constraint" unique ("varchar_col", "integer_col") deferrable',
                  parameters: [],
                },
                mysql: NOT_SUPPORTED,
                mssql: NOT_SUPPORTED,
                sqlite: NOT_SUPPORTED,
              })

              await builder.execute()
            })

            it('should add a not deferrable unique constraint', async () => {
              const builder = ctx.db.schema
                .alterTable('test')
                .addUniqueConstraint(
                  'some_constraint',
                  ['varchar_col', 'integer_col'],
                  (uc) => uc.notDeferrable(),
                )

              testSql(builder, dialect, {
                postgres: {
                  sql: 'alter table "test" add constraint "some_constraint" unique ("varchar_col", "integer_col") not deferrable',
                  parameters: [],
                },
                mysql: NOT_SUPPORTED,
                mssql: NOT_SUPPORTED,
                sqlite: NOT_SUPPORTED,
              })

              await builder.execute()
            })

            it('should add a deferrable initially deferred unique constraint', async () => {
              const builder = ctx.db.schema
                .alterTable('test')
                .addUniqueConstraint(
                  'some_constraint',
                  ['varchar_col', 'integer_col'],
                  (uc) => uc.deferrable().initiallyDeferred(),
                )

              testSql(builder, dialect, {
                postgres: {
                  sql: 'alter table "test" add constraint "some_constraint" unique ("varchar_col", "integer_col") deferrable initially deferred',
                  parameters: [],
                },
                mysql: NOT_SUPPORTED,
                mssql: NOT_SUPPORTED,
                sqlite: NOT_SUPPORTED,
              })

              await builder.execute()
            })

            it('should add a deferrable initially immediate unique constraint', async () => {
              const builder = ctx.db.schema
                .alterTable('test')
                .addUniqueConstraint(
                  'some_constraint',
                  ['varchar_col', 'integer_col'],
                  (uc) => uc.deferrable().initiallyImmediate(),
                )

              testSql(builder, dialect, {
                postgres: {
                  sql: 'alter table "test" add constraint "some_constraint" unique ("varchar_col", "integer_col") deferrable initially immediate',
                  parameters: [],
                },
                mysql: NOT_SUPPORTED,
                mssql: NOT_SUPPORTED,
                sqlite: NOT_SUPPORTED,
              })

              await builder.execute()
            })
          }
        })
      }

      if (dialect == 'mysql') {
        it('should add a unique constraint using expressions', async () => {
          const builder = ctx.db.schema
            .alterTable('test')
            .addUniqueConstraint('unique_constraint', [
              sql`(lower(varchar_col))`,
              'integer_col',
            ])

          testSql(builder, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: {
              sql: 'alter table `test` add constraint `unique_constraint` unique ((lower(varchar_col)), `integer_col`)',
              parameters: [],
            },
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      if (
        dialect === 'postgres' ||
        dialect === 'mysql' ||
        dialect === 'mssql'
      ) {
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
              mssql: {
                sql: 'alter table "test" add constraint "some_constraint" check (integer_col > 0)',
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

      if (
        dialect === 'postgres' ||
        dialect === 'mysql' ||
        dialect === 'mssql'
      ) {
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
                ['a', 'b'],
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
              mssql: {
                sql: 'alter table "test" add constraint "some_constraint" foreign key ("integer_col", "varchar_col") references "test2" ("a", "b")',
                parameters: [],
              },
              sqlite: NOT_SUPPORTED,
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
                ['a', 'b'],
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
              mssql: {
                sql: 'alter table "test" add constraint "some_constraint" foreign key ("integer_col", "varchar_col") references "test2" ("a", "b") on delete set null on update cascade',
                parameters: [],
              },
              sqlite: NOT_SUPPORTED,
            })

            await builder.execute()
          })
        })
      }

      if (dialect === 'postgres') {
        it('should add a deferrable initially deferred foreign key constraint', async () => {
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
              ['a', 'b'],
              (fk) => fk.deferrable().initiallyDeferred(),
            )

          testSql(builder, dialect, {
            postgres: {
              sql: 'alter table "test" add constraint "some_constraint" foreign key ("integer_col", "varchar_col") references "test2" ("a", "b") deferrable initially deferred',
              parameters: [],
            },
            mysql: NOT_SUPPORTED,
            mssql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await builder.execute()
        })
      }

      if (dialect !== 'sqlite') {
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
                ['id'],
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
              mssql: {
                sql: 'alter table "test" drop constraint "foreign_key_constraint"',
                parameters: [],
              },
              sqlite: NOT_SUPPORTED,
            })

            await builder.execute()
          })
        })
      }

      if (dialect === 'postgres') {
        describe('rename constraint', () => {
          it('should rename a foreign key constraint', async () => {
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
                ['id'],
              )
              .execute()

            const builder = ctx.db.schema
              .alterTable('test')
              .renameConstraint(
                'foreign_key_constraint',
                'new_foreign_key_constraint',
              )

            testSql(builder, dialect, {
              postgres: {
                sql: 'alter table "test" rename constraint "foreign_key_constraint" to "new_foreign_key_constraint"',
                parameters: [],
              },
              mysql: NOT_SUPPORTED,
              mssql: NOT_SUPPORTED,
              sqlite: NOT_SUPPORTED,
            })

            await builder.execute()
          })
        })
      }

      if (
        dialect === 'postgres' ||
        dialect === 'mysql' ||
        dialect === 'mssql'
      ) {
        describe('add primary key constraint', async () => {
          beforeEach(() => {
            return ctx.db.schema
              .alterTable('test')
              .addColumn('decimal_col', 'decimal', (cb) => cb.notNull())
              .addColumn('smallint_col', sql`smallint`, (cb) => cb.notNull())
              .execute()
          })

          afterEach(async () => {
            if (dialect === 'mssql') {
              await ctx.db.schema
                .alterTable('test')
                .dropConstraint('test_pkey')
                .execute()
            }

            await ctx.db.schema
              .alterTable('test')
              .dropColumn('decimal_col')
              .dropColumn('smallint_col')
              .execute()
          })

          it('should add a primary key constraint', async () => {
            const builder = ctx.db.schema
              .alterTable('test')
              .addPrimaryKeyConstraint('test_pkey', ['decimal_col'])

            testSql(builder, dialect, {
              postgres: {
                sql: 'alter table "test" add constraint "test_pkey" primary key ("decimal_col")',
                parameters: [],
              },
              mysql: {
                sql: 'alter table `test` add constraint `test_pkey` primary key (`decimal_col`)',
                parameters: [],
              },
              mssql: {
                sql: 'alter table "test" add constraint "test_pkey" primary key ("decimal_col")',
                parameters: [],
              },
              sqlite: NOT_SUPPORTED,
            })

            await builder.execute()
          })

          if (dialect === 'postgres') {
            it('should add a deferrable initially deferred primary key constraint', async () => {
              const builder = ctx.db.schema
                .alterTable('test')
                .addPrimaryKeyConstraint('test_pkey', ['decimal_col'], (pk) =>
                  pk.deferrable().initiallyDeferred(),
                )

              testSql(builder, dialect, {
                postgres: {
                  sql: 'alter table "test" add constraint "test_pkey" primary key ("decimal_col") deferrable initially deferred',
                  parameters: [],
                },
                mysql: NOT_SUPPORTED,
                mssql: NOT_SUPPORTED,
                sqlite: NOT_SUPPORTED,
              })

              await builder.execute()
            })
          }

          it('should add a primary key constraint for multiple columns', async () => {
            const builder = ctx.db.schema
              .alterTable('test')
              .addPrimaryKeyConstraint('test_pkey', [
                'decimal_col',
                'smallint_col',
              ])

            testSql(builder, dialect, {
              postgres: {
                sql: 'alter table "test" add constraint "test_pkey" primary key ("decimal_col", "smallint_col")',
                parameters: [],
              },
              mysql: {
                sql: 'alter table `test` add constraint `test_pkey` primary key (`decimal_col`, `smallint_col`)',
                parameters: [],
              },
              mssql: {
                sql: 'alter table "test" add constraint "test_pkey" primary key ("decimal_col", "smallint_col")',
                parameters: [],
              },
              sqlite: NOT_SUPPORTED,
            })

            await builder.execute()
          })
        })
      }

      if (
        dialect === 'postgres' ||
        dialect === 'mysql' ||
        dialect === 'mssql'
      ) {
        describe('parse schema name', () => {
          beforeEach(cleanup)
          afterEach(cleanup)

          it('should parse the schema from table name', async () => {
            await ctx.db.schema.createSchema('test_schema').execute()
            await ctx.db.schema
              .createTable('test_schema.test')
              .addColumn('id', 'varchar(36)')
              .execute()

            const builder = ctx.db.schema
              .alterTable('test_schema.test')
              .addColumn('second_column', 'text')

            testSql(builder, dialect, {
              postgres: {
                sql: `alter table "test_schema"."test" add column "second_column" text`,
                parameters: [],
              },
              mysql: {
                sql: 'alter table `test_schema`.`test` add column `second_column` text',
                parameters: [],
              },
              mssql: {
                sql: `alter table "test_schema"."test" add "second_column" text`,
                parameters: [],
              },
              sqlite: NOT_SUPPORTED,
            })

            await builder.execute()
          })

          async function cleanup() {
            await ctx.db.schema
              .dropTable('test_schema.test')
              .ifExists()
              .execute()
            await ctx.db.schema.dropSchema('test_schema').ifExists().execute()
          }
        })
      }

      it('should alter a table calling query builder functions', async () => {
        const builder = ctx.db.schema
          .alterTable('test')
          .$call((builder) =>
            builder.addColumn('abc', 'integer', (col) => col.notNull()),
          )

        testSql(builder, dialect, {
          postgres: {
            sql: [`alter table "test" add column "abc" integer not null`],
            parameters: [],
          },
          mysql: {
            sql: ['alter table `test` add column `abc` integer not null'],
            parameters: [],
          },
          mssql: {
            sql: [`alter table "test" add "abc" integer not null`],
            parameters: [],
          },
          sqlite: {
            sql: [`alter table "test" add column "abc" integer not null`],
            parameters: [],
          },
        })

        await builder.execute()
      })

      if (dialect === 'mysql') {
        describe('add index', () => {
          it('should add an index', async () => {
            const query = ctx.db.schema
              .alterTable('test')
              .addIndex('test_integer_col_index')
              .column('integer_col')

            testSql(query, dialect, {
              mysql: {
                sql: 'alter table `test` add index `test_integer_col_index` (`integer_col`)',
                parameters: [],
              },
              postgres: NOT_SUPPORTED,
              mssql: NOT_SUPPORTED,
              sqlite: NOT_SUPPORTED,
            })

            await query.execute()
          })

          it('should add a unique index', async () => {
            const query = ctx.db.schema
              .alterTable('test')
              .addIndex('test_integer_col_index')
              .unique()
              .column('integer_col')

            testSql(query, dialect, {
              mysql: {
                sql: 'alter table `test` add unique index `test_integer_col_index` (`integer_col`)',
                parameters: [],
              },
              postgres: NOT_SUPPORTED,
              mssql: NOT_SUPPORTED,
              sqlite: NOT_SUPPORTED,
            })

            await query.execute()
          })

          it('should add an index for multiple columns', async () => {
            const query = ctx.db.schema
              .alterTable('test')
              .addIndex('test_integer_varchar_col_index')
              .unique()
              .columns(['integer_col', 'varchar_col'])

            testSql(query, dialect, {
              mysql: {
                sql: 'alter table `test` add unique index `test_integer_varchar_col_index` (`integer_col`, `varchar_col`)',
                parameters: [],
              },
              postgres: NOT_SUPPORTED,
              mssql: NOT_SUPPORTED,
              sqlite: NOT_SUPPORTED,
            })

            await query.execute()
          })

          it('should add an index for an expression', async () => {
            const query = ctx.db.schema
              .alterTable('test')
              .addIndex('test_varchar_col_index')
              .expression(sql`(varchar_col < 'Sami')`)

            testSql(query, dialect, {
              mysql: {
                sql: "alter table `test` add index `test_varchar_col_index` ((varchar_col < 'Sami'))",
                parameters: [],
              },
              postgres: NOT_SUPPORTED,
              mssql: NOT_SUPPORTED,
              sqlite: NOT_SUPPORTED,
            })

            await query.execute()
          })

          it('should add a sorted index, single column', async () => {
            const query = ctx.db.schema
              .alterTable('test')
              .addIndex('test_integer_col_index')
              .column('integer_col desc')

            testSql(query, dialect, {
              mysql: {
                sql: 'alter table `test` add index `test_integer_col_index` (`integer_col` desc)',
                parameters: [],
              },
              postgres: NOT_SUPPORTED,
              mssql: NOT_SUPPORTED,
              sqlite: NOT_SUPPORTED,
            })

            await query.execute()
          })

          it('should add a sorted index, multi-column', async () => {
            const query = ctx.db.schema
              .alterTable('test')
              .addIndex('test_integer_varchar_col_index')
              .columns(['integer_col desc', 'varchar_col desc'])

            testSql(query, dialect, {
              mysql: {
                sql: 'alter table `test` add index `test_integer_varchar_col_index` (`integer_col` desc, `varchar_col` desc)',
                parameters: [],
              },
              postgres: NOT_SUPPORTED,
              mssql: NOT_SUPPORTED,
              sqlite: NOT_SUPPORTED,
            })

            await query.execute()
          })
        })
      }

      if (dialect === 'mysql') {
        describe('drop index', () => {
          beforeEach(async () => {
            await ctx.db.schema
              .alterTable('test')
              .addIndex('test_integer_col_index')
              .column('integer_col')
              .execute()
          })

          it('should drop an index', async () => {
            const query = ctx.db.schema
              .alterTable('test')
              .dropIndex('test_integer_col_index')

            testSql(query, dialect, {
              mysql: {
                sql: 'alter table `test` drop index `test_integer_col_index`',
                parameters: [],
              },
              postgres: NOT_SUPPORTED,
              mssql: NOT_SUPPORTED,
              sqlite: NOT_SUPPORTED,
            })

            await query.execute()
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
