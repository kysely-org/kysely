import { sql } from '../../../'
import {
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  expect,
  insertDefaultDataSet,
  DIALECTS,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: introspect`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)

      if (dialect === 'postgres' || dialect === 'mssql') {
        await dropSchema()
        await createSchema()
      }

      await createView()
    })

    beforeEach(async () => {
      await insertDefaultDataSet(ctx)
    })

    afterEach(async () => {
      await clearDatabase(ctx)
    })

    after(async () => {
      await dropView()

      if (dialect === 'postgres') {
        await dropSchema()
      }

      await destroyTest(ctx)
    })

    describe('getSchemas', () => {
      it('should get schema names', async () => {
        const schemas = await ctx.db.introspection.getSchemas()

        if (dialect === 'postgres') {
          expect(schemas).to.containSubset([
            { name: 'public' },
            { name: 'information_schema' },
            { name: 'pg_catalog' },
            { name: 'some_schema' },
            { name: 'dtype_schema' },
          ])
        } else if (dialect === 'mysql') {
          expect(schemas).to.containSubset([
            { name: 'mysql' },
            { name: 'information_schema' },
            { name: 'performance_schema' },
            { name: 'sys' },
            { name: 'kysely_test' },
          ])
        } else if (dialect === 'mssql') {
          expect(schemas).to.containSubset([
            { name: 'dbo' },
            { name: 'sys' },
            { name: 'guest' },
            { name: 'INFORMATION_SCHEMA' },
            { name: 'some_schema' },
          ])
        } else if (dialect === 'sqlite') {
          expect(schemas).to.eql([])
        }
      })
    })

    describe('getTables', () => {
      it('should get table metadata', async () => {
        const meta = await ctx.db.introspection.getTables()

        if (dialect === 'postgres') {
          expect(meta).to.eql([
            {
              name: 'person',
              isView: false,
              schema: 'public',
              columns: [
                {
                  name: 'id',
                  dataType: 'int4',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: true,
                  hasDefaultValue: true,
                },
                {
                  name: 'first_name',
                  dataType: 'varchar',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'middle_name',
                  dataType: 'varchar',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },

                {
                  name: 'last_name',
                  dataType: 'varchar',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'gender',
                  dataType: 'varchar',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'marital_status',
                  dataType: 'varchar',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'children',
                  dataType: 'int4',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: true,
                },
              ],
            },
            {
              name: 'pet',
              isView: false,
              schema: 'public',
              columns: [
                {
                  name: 'id',
                  dataType: 'int4',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: true,
                  hasDefaultValue: true,
                },
                {
                  name: 'name',
                  dataType: 'varchar',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'owner_id',
                  dataType: 'int4',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'species',
                  dataType: 'varchar',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
              ],
            },
            {
              name: 'toy',
              isView: false,
              schema: 'public',
              columns: [
                {
                  name: 'id',
                  dataType: 'int4',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: true,
                  hasDefaultValue: true,
                },
                {
                  name: 'name',
                  dataType: 'varchar',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'pet_id',
                  dataType: 'int4',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'price',
                  dataType: 'float8',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
              ],
            },
            {
              name: 'toy_names',
              isView: true,
              schema: 'public',
              columns: [
                {
                  name: 'name',
                  dataType: 'varchar',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
              ],
            },
            {
              name: 'pet',
              isView: false,
              schema: 'some_schema',
              columns: [
                {
                  name: 'some_column',
                  dataType: 'int4',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: true,
                  hasDefaultValue: true,
                },
                {
                  dataType: 'species',
                  dataTypeSchema: 'dtype_schema',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: true,
                  name: 'spcies',
                },
              ],
            },
          ])
        } else if (dialect === 'mysql') {
          expect(meta).to.eql([
            {
              name: 'person',
              isView: false,
              schema: 'kysely_test',
              columns: [
                {
                  name: 'id',
                  dataType: 'int',
                  isNullable: false,
                  isAutoIncrementing: true,
                  hasDefaultValue: false,
                },
                {
                  name: 'first_name',
                  dataType: 'varchar',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'middle_name',
                  dataType: 'varchar',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'last_name',
                  dataType: 'varchar',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },

                {
                  name: 'gender',
                  dataType: 'varchar',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'marital_status',
                  dataType: 'varchar',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'children',
                  dataType: 'int',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: true,
                },
              ],
            },
            {
              name: 'pet',
              isView: false,
              schema: 'kysely_test',
              columns: [
                {
                  name: 'id',
                  dataType: 'int',
                  isNullable: false,
                  isAutoIncrementing: true,
                  hasDefaultValue: false,
                },
                {
                  name: 'name',
                  dataType: 'varchar',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'owner_id',
                  dataType: 'int',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'species',
                  dataType: 'varchar',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
              ],
            },
            {
              name: 'toy',
              isView: false,
              schema: 'kysely_test',
              columns: [
                {
                  name: 'id',
                  dataType: 'int',
                  isNullable: false,
                  isAutoIncrementing: true,
                  hasDefaultValue: false,
                },
                {
                  name: 'name',
                  dataType: 'varchar',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'pet_id',
                  dataType: 'int',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'price',
                  dataType: 'double',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
              ],
            },
            {
              name: 'toy_names',
              isView: true,
              schema: 'kysely_test',
              columns: [
                {
                  dataType: 'varchar',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: false,
                  name: 'name',
                },
              ],
            },
          ])
        } else if (dialect === 'mssql') {
          expect(meta).to.eql([
            {
              isView: false,
              name: 'person',
              schema: 'dbo',
              columns: [
                {
                  dataType: 'int',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: true,
                  isAutoIncrementing: false,
                  isNullable: false,
                  name: 'children',
                },
                {
                  dataType: 'varchar',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: true,
                  name: 'first_name',
                },
                {
                  dataType: 'varchar',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: false,
                  name: 'gender',
                },
                {
                  dataType: 'int',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: true,
                  isAutoIncrementing: true,
                  isNullable: false,
                  name: 'id',
                },
                {
                  dataType: 'varchar',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: true,
                  name: 'last_name',
                },
                {
                  dataType: 'varchar',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: true,
                  name: 'marital_status',
                },
                {
                  dataType: 'varchar',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: true,
                  name: 'middle_name',
                },
              ],
            },
            {
              isView: false,
              name: 'pet',
              schema: 'dbo',
              columns: [
                {
                  dataType: 'int',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: true,
                  isAutoIncrementing: true,
                  isNullable: false,
                  name: 'id',
                },
                {
                  dataType: 'varchar',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: false,
                  name: 'name',
                },
                {
                  dataType: 'int',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: false,
                  name: 'owner_id',
                },
                {
                  dataType: 'varchar',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: false,
                  name: 'species',
                },
              ],
            },
            {
              isView: false,
              name: 'toy',
              schema: 'dbo',
              columns: [
                {
                  dataType: 'int',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: true,
                  isAutoIncrementing: true,
                  isNullable: false,
                  name: 'id',
                },
                {
                  dataType: 'varchar',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: false,
                  name: 'name',
                },
                {
                  dataType: 'int',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: false,
                  name: 'pet_id',
                },
                {
                  dataType: 'float',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: false,
                  name: 'price',
                },
              ],
            },
            {
              isView: true,
              name: 'toy_names',
              schema: 'dbo',
              columns: [
                {
                  dataType: 'varchar',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: false,
                  name: 'name',
                },
              ],
            },
            {
              isView: false,
              name: 'pet',
              schema: 'some_schema',
              columns: [
                {
                  dataType: 'int',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: true,
                  isAutoIncrementing: true,
                  isNullable: false,
                  name: 'some_column',
                },
                {
                  dataType: 'int',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: true,
                  isAutoIncrementing: false,
                  isNullable: true,
                  name: 'some_column_plus_1',
                },
              ],
            },
          ])
        } else if (dialect === 'sqlite') {
          expect(meta).to.eql([
            {
              name: 'person',
              isView: false,
              columns: [
                {
                  name: 'id',
                  dataType: 'INTEGER',
                  isNullable: true,
                  isAutoIncrementing: true,
                  hasDefaultValue: false,
                },
                {
                  name: 'first_name',
                  dataType: 'varchar(255)',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'middle_name',
                  dataType: 'varchar(255)',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'last_name',
                  dataType: 'varchar(255)',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },

                {
                  name: 'gender',
                  dataType: 'varchar(50)',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'marital_status',
                  dataType: 'varchar(50)',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'children',
                  dataType: 'INTEGER',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: true,
                },
              ],
            },
            {
              name: 'pet',
              isView: false,
              columns: [
                {
                  name: 'id',
                  dataType: 'INTEGER',
                  isNullable: true,
                  isAutoIncrementing: true,
                  hasDefaultValue: false,
                },
                {
                  name: 'name',
                  dataType: 'varchar(255)',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'owner_id',
                  dataType: 'INTEGER',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'species',
                  dataType: 'varchar(50)',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
              ],
            },
            {
              name: 'toy',
              isView: false,
              columns: [
                {
                  name: 'id',
                  dataType: 'INTEGER',
                  isNullable: true,
                  isAutoIncrementing: true,
                  hasDefaultValue: false,
                },
                {
                  name: 'name',
                  dataType: 'varchar(255)',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'pet_id',
                  dataType: 'INTEGER',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
                {
                  name: 'price',
                  dataType: 'double precision',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                },
              ],
            },
            {
              name: 'toy_names',
              isView: true,
              columns: [
                {
                  dataType: 'varchar(255)',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: true,
                  name: 'name',
                },
              ],
            },
          ])
        }
      })
    })

    async function createView() {
      ctx.db.schema
        .createView('toy_names')
        .as(ctx.db.selectFrom('toy').select('name'))
        .execute()
    }

    async function dropView() {
      ctx.db.schema.dropView('toy_names').ifExists().execute()
    }

    async function createSchema() {
      await ctx.db.schema.createSchema('some_schema').execute()

      if (dialect === 'postgres') {
        await ctx.db.schema.createSchema('dtype_schema').execute()
        await ctx.db.schema
          .createType('dtype_schema.species')
          .asEnum(['cat', 'dog', 'frog'])
          .execute()

        await ctx.db.schema
          .createTable('some_schema.pet')
          .addColumn('some_column', 'serial', (col) => col.primaryKey())
          .addColumn('spcies', sql`dtype_schema.species`)
          .execute()
      } else {
        await ctx.db.schema
          .createTable('some_schema.pet')
          .addColumn('some_column', 'integer', (col) =>
            col
              .notNull()
              .modifyFront(sql`identity(1,1)`)
              .primaryKey()
          )
          .addColumn('some_column_plus_1', sql``, (col) =>
            col.modifyEnd(sql`as (some_column + 1)`)
          )
          .execute()
      }
    }

    async function dropSchema() {
      await ctx.db.schema.dropTable('some_schema.pet').ifExists().execute()
      await ctx.db.schema.dropSchema('some_schema').ifExists().execute()

      if (dialect === 'postgres') {
        await ctx.db.schema
          .dropType('dtype_schema.species')
          .ifExists()
          .execute()
        await ctx.db.schema.dropSchema('dtype_schema').ifExists().execute()
      }
    }
  })
}
