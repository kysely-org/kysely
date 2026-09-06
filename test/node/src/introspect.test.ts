import { sql, type SqlBool } from '../../../dist/index.js'
import {
  clearDatabase,
  destroyTest,
  initTest,
  type TestContext,
  expect,
  insertDefaultDataSet,
  DIALECTS,
  createTableWithId,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  const { sqlSpec, variant } = dialect

  describe(`${variant}: introspect`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)

      if (sqlSpec === 'postgres' || sqlSpec === 'mssql') {
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

      if (sqlSpec === 'postgres') {
        await dropSchema()
      }

      await destroyTest(ctx)
    })

    describe('getSchemas', () => {
      it('should get schema names', async () => {
        const schemas = await ctx.db.introspection.getSchemas()

        if (sqlSpec === 'postgres') {
          expect(schemas).to.containSubset([
            { name: 'public' },
            { name: 'information_schema' },
            { name: 'pg_catalog' },
            { name: 'some_schema' },
            { name: 'dtype_schema' },
          ])
        } else if (sqlSpec === 'mysql') {
          expect(schemas).to.containSubset([
            { name: 'mysql' },
            { name: 'information_schema' },
            { name: 'performance_schema' },
            { name: 'sys' },
            { name: 'kysely_test' },
          ])
        } else if (sqlSpec === 'mssql') {
          expect(schemas).to.containSubset([
            { name: 'dbo' },
            { name: 'sys' },
            { name: 'guest' },
            { name: 'INFORMATION_SCHEMA' },
            { name: 'some_schema' },
          ])
        } else if (sqlSpec === 'sqlite') {
          expect(schemas).to.eql([])
        }
      })

      it('should apply a where expression to the metadata query', async () => {
        const schemaName =
          sqlSpec === 'postgres' || sqlSpec === 'mssql'
            ? 'some_schema'
            : sqlSpec === 'mysql'
              ? 'kysely_test'
              : undefined
        const schemas = await ctx.db.introspection.getSchemas({
          where: ({ schema }) =>
            sql<SqlBool>`${schema} = ${schemaName ?? 'some_schema'}`,
        })

        expect(schemas).to.eql(schemaName ? [{ name: schemaName }] : [])
      })
    })

    describe('getTables', () => {
      it('should get table metadata', async () => {
        const meta = await ctx.db.introspection.getTables()

        if (sqlSpec === 'postgres') {
          expect(meta).to.eql([
            {
              name: 'person',
              isForeign: false,
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
                  comment: undefined,
                },
                {
                  name: 'first_name',
                  dataType: 'varchar',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'middle_name',
                  dataType: 'varchar',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },

                {
                  name: 'last_name',
                  dataType: 'varchar',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'gender',
                  dataType: 'varchar',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'marital_status',
                  dataType: 'varchar',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'children',
                  dataType: 'int4',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: true,
                  comment: undefined,
                },
              ],
            },
            {
              name: 'pet',
              isView: false,
              isForeign: false,
              schema: 'public',
              columns: [
                {
                  name: 'id',
                  dataType: 'int4',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: true,
                  hasDefaultValue: true,
                  comment: undefined,
                },
                {
                  name: 'name',
                  dataType: 'varchar',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'owner_id',
                  dataType: 'int4',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'species',
                  dataType: 'varchar',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
              ],
            },
            {
              name: 'toy',
              isView: false,
              isForeign: false,
              schema: 'public',
              columns: [
                {
                  name: 'id',
                  dataType: 'int4',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: true,
                  hasDefaultValue: true,
                  comment: undefined,
                },
                {
                  name: 'name',
                  dataType: 'varchar',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'pet_id',
                  dataType: 'int4',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'price',
                  dataType: 'float8',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: 'Price in USD',
                },
              ],
            },
            {
              name: 'toy_names',
              isForeign: false,
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
                  comment: undefined,
                },
              ],
            },
            {
              name: 'MixedCaseTable',
              isForeign: false,
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
                  comment: undefined,
                },
              ],
            },
            {
              name: 'pet',
              isForeign: false,
              isView: false,
              schema: 'some_schema',
              columns: [
                {
                  name: 'some_column_renamed',
                  dataType: 'int4',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: false,
                  isAutoIncrementing: true,
                  hasDefaultValue: true,
                  comment: undefined,
                },
                {
                  dataType: 'species',
                  dataTypeSchema: 'dtype_schema',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: true,
                  name: 'spcies',
                  comment: undefined,
                },
              ],
            },
            {
              name: 'pet_partition',
              isForeign: false,
              isView: false,
              schema: 'some_schema',
              columns: [
                {
                  name: 'part_column',
                  dataType: 'text',
                  dataTypeSchema: 'pg_catalog',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
              ],
            },
          ])
        } else if (sqlSpec === 'mysql') {
          expect(meta).to.eql([
            {
              name: 'person',
              isForeign: false,
              isView: false,
              schema: 'kysely_test',
              columns: [
                {
                  name: 'id',
                  dataType: 'int',
                  isNullable: false,
                  isAutoIncrementing: true,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'first_name',
                  dataType: 'varchar',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'middle_name',
                  dataType: 'varchar',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'last_name',
                  dataType: 'varchar',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },

                {
                  name: 'gender',
                  dataType: 'varchar',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'marital_status',
                  dataType: 'varchar',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'children',
                  dataType: 'int',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: true,
                  comment: undefined,
                },
              ],
            },
            {
              name: 'pet',
              isForeign: false,
              isView: false,
              schema: 'kysely_test',
              columns: [
                {
                  name: 'id',
                  dataType: 'int',
                  isNullable: false,
                  isAutoIncrementing: true,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'name',
                  dataType: 'varchar',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'owner_id',
                  dataType: 'int',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'species',
                  dataType: 'varchar',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
              ],
            },
            {
              name: 'toy',
              isForeign: false,
              isView: false,
              schema: 'kysely_test',
              columns: [
                {
                  name: 'id',
                  dataType: 'int',
                  isNullable: false,
                  isAutoIncrementing: true,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'name',
                  dataType: 'varchar',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'pet_id',
                  dataType: 'int',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'price',
                  dataType: 'double',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: 'Price in USD',
                },
              ],
            },
            {
              name: 'toy_names',
              isForeign: false,
              isView: true,
              schema: 'kysely_test',
              columns: [
                {
                  dataType: 'varchar',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: false,
                  name: 'name',
                  comment: undefined,
                },
              ],
            },
          ])
        } else if (sqlSpec === 'mssql') {
          expect(meta).to.eql([
            {
              isForeign: false,
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
                  comment: undefined,
                },
                {
                  dataType: 'varchar',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: true,
                  name: 'first_name',
                  comment: undefined,
                },
                {
                  dataType: 'varchar',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: false,
                  name: 'gender',
                  comment: undefined,
                },
                {
                  dataType: 'int',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: true,
                  isAutoIncrementing: true,
                  isNullable: false,
                  name: 'id',
                  comment: undefined,
                },
                {
                  dataType: 'varchar',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: true,
                  name: 'last_name',
                  comment: undefined,
                },
                {
                  dataType: 'varchar',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: true,
                  name: 'marital_status',
                  comment: undefined,
                },
                {
                  dataType: 'varchar',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: true,
                  name: 'middle_name',
                  comment: undefined,
                },
              ],
            },
            {
              isForeign: false,
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
                  comment: undefined,
                },
                {
                  dataType: 'varchar',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: false,
                  name: 'name',
                  comment: undefined,
                },
                {
                  dataType: 'int',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: false,
                  name: 'owner_id',
                  comment: undefined,
                },
                {
                  dataType: 'varchar',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: false,
                  name: 'species',
                  comment: undefined,
                },
              ],
            },
            {
              isForeign: false,
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
                  comment: undefined,
                },
                {
                  dataType: 'varchar',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: false,
                  name: 'name',
                  comment: undefined,
                },
                {
                  dataType: 'int',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: false,
                  name: 'pet_id',
                  comment: undefined,
                },
                {
                  dataType: 'float',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: false,
                  name: 'price',
                  comment: 'Price in USD',
                },
              ],
            },
            {
              isForeign: false,
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
                  comment: undefined,
                },
              ],
            },
            {
              isForeign: false,
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
                  comment: undefined,
                },
                {
                  dataType: 'int',
                  dataTypeSchema: 'sys',
                  hasDefaultValue: true,
                  isAutoIncrementing: false,
                  isNullable: true,
                  name: 'some_column_plus_1',
                  comment: undefined,
                },
              ],
            },
          ])
        } else if (sqlSpec === 'sqlite') {
          expect(meta).to.eql([
            {
              name: 'person',
              isForeign: false,
              isView: false,
              columns: [
                {
                  name: 'id',
                  dataType: 'INTEGER',
                  isNullable: true,
                  isAutoIncrementing: true,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'first_name',
                  dataType: 'varchar(255)',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'middle_name',
                  dataType: 'varchar(255)',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'last_name',
                  dataType: 'varchar(255)',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },

                {
                  name: 'gender',
                  dataType: 'varchar(50)',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'marital_status',
                  dataType: 'varchar(50)',
                  isNullable: true,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'children',
                  dataType: 'INTEGER',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: true,
                  comment: undefined,
                },
              ],
            },
            {
              name: 'pet',
              isForeign: false,
              isView: false,
              columns: [
                {
                  name: 'id',
                  dataType: 'INTEGER',
                  isNullable: true,
                  isAutoIncrementing: true,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'name',
                  dataType: 'varchar(255)',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'owner_id',
                  dataType: 'INTEGER',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'species',
                  dataType: 'varchar(50)',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
              ],
            },
            {
              name: 'toy',
              isForeign: false,
              isView: false,
              columns: [
                {
                  name: 'id',
                  dataType: 'INTEGER',
                  isNullable: true,
                  isAutoIncrementing: true,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'name',
                  dataType: 'varchar(255)',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'pet_id',
                  dataType: 'INTEGER',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
                {
                  name: 'price',
                  dataType: 'double precision',
                  isNullable: false,
                  isAutoIncrementing: false,
                  hasDefaultValue: false,
                  comment: undefined,
                },
              ],
            },
            {
              name: 'toy_names',
              isForeign: false,
              isView: true,
              columns: [
                {
                  dataType: 'varchar(255)',
                  hasDefaultValue: false,
                  isAutoIncrementing: false,
                  isNullable: true,
                  name: 'name',
                  comment: undefined,
                },
              ],
            },
          ])
        }
      })

      if (sqlSpec === 'sqlite') {
        describe('implicit autoincrement', () => {
          const testTableName = 'implicit_increment_test'

          before(async () => {
            await createTableWithId(ctx.db.schema, dialect, testTableName, true)
              .ifNotExists()
              .execute()
          })

          after(async () => {
            await ctx.db.schema.dropTable(testTableName).ifExists().execute()
          })

          it('should detect autoincrement on implicitly auto incrementing columns', async () => {
            const tables = await ctx.db.introspection.getTables()

            const testTable = tables.find(
              (table) => table.name === testTableName,
            )

            expect(testTable).to.eql({
              name: testTableName,
              isForeign: false,
              isView: false,
              columns: [
                {
                  name: 'id',
                  dataType: 'INTEGER',
                  isNullable: true,
                  isAutoIncrementing: true,
                  hasDefaultValue: false,
                  comment: undefined,
                },
              ],
            })
          })
        })
      }

      it('should apply a where expression to the metadata query', async () => {
        const meta = await ctx.db.introspection.getTables({
          withInternalKyselyTables: false,
          where: ({ table }) => sql<SqlBool>`${table} = ${'person'}`,
        })

        expect(meta.map((table) => table.name)).to.eql(['person'])
      })

      it('should apply a where expression using the table and schema', async () => {
        const schemaName =
          sqlSpec === 'postgres' || sqlSpec === 'mssql'
            ? 'some_schema'
            : sqlSpec === 'mysql'
              ? 'kysely_test'
              : undefined
        const meta = await ctx.db.introspection.getTables({
          withInternalKyselyTables: false,
          where: ({ schema, table }) => {
            if (schemaName) {
              if (!schema) {
                throw new Error('expected the introspector to provide a schema')
              }

              return sql<SqlBool>`${schema} = ${schemaName} and ${table} = ${'pet'}`
            }

            expect(schema).to.be.undefined

            return sql<SqlBool>`${table} = ${'pet'}`
          },
        })

        expect(meta).to.have.length(1)
        expect(meta[0].name).to.equal('pet')
        expect(meta[0].schema).to.equal(schemaName)
      })

      it('should apply the where expression together with the internal table option', async () => {
        const internalTableName = 'kysely_migration'

        await ctx.db.schema
          .createTable(internalTableName)
          .addColumn('name', 'varchar(255)', (col) => col.notNull())
          .execute()

        try {
          const excluded = await ctx.db.introspection.getTables({
            where: ({ table }) => sql<SqlBool>`${table} = ${internalTableName}`,
            withInternalKyselyTables: false,
          })
          const included = await ctx.db.introspection.getTables({
            where: ({ table }) => sql<SqlBool>`${table} = ${internalTableName}`,
            withInternalKyselyTables: true,
          })

          expect(excluded).to.eql([])
          expect(included.map((table) => table.name)).to.eql([
            internalTableName,
          ])
        } finally {
          await ctx.db.schema.dropTable(internalTableName).execute()
        }
      })

      if (sqlSpec === 'mysql') {
        it('should optionally introspect tables outside the default database', async () => {
          const otherDatabase = 'kysely_test_other'

          await ctx.db.schema.createSchema(otherDatabase).execute()

          try {
            await ctx.db.schema
              .withSchema(otherDatabase)
              .createTable('person')
              .addColumn('other_id', 'integer', (col) => col.notNull())
              .execute()

            const defaultDatabaseMeta = await ctx.db.introspection.getTables({
              withInternalKyselyTables: false,
              where: ({ table }) => sql<SqlBool>`${table} = ${'person'}`,
            })
            const meta = await ctx.db.introspection.getTables({
              defaultDatabaseOnly: false,
              withInternalKyselyTables: false,
              where: ({ schema, table }) => {
                if (!schema) {
                  throw new Error(
                    'expected the introspector to provide a schema',
                  )
                }

                return sql<SqlBool>`${schema} in (${'kysely_test'}, ${otherDatabase}) and ${table} = ${'person'}`
              },
            })

            expect(defaultDatabaseMeta.map((table) => table.schema)).to.eql([
              'kysely_test',
            ])
            expect(meta).to.have.length(2)
            expect(meta.map((table) => table.schema)).to.eql([
              'kysely_test',
              otherDatabase,
            ])
            expect(meta[1].columns.map((column) => column.name)).to.eql([
              'other_id',
            ])
          } finally {
            await ctx.db.schema.dropSchema(otherDatabase).execute()
          }
        })

        it('should exclude tables in system databases', async () => {
          const systemDatabases = [
            'information_schema',
            'mysql',
            'performance_schema',
            'sys',
          ]

          for (const defaultDatabaseOnly of [true, false]) {
            const meta = await ctx.db.introspection.getTables({
              defaultDatabaseOnly,
              withInternalKyselyTables: false,
              where: ({ schema }) =>
                sql<SqlBool>`${schema} in (${sql.join(systemDatabases)})`,
            })

            expect(meta).to.eql([])
          }
        })
      }
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

      if (sqlSpec === 'postgres') {
        await ctx.db.schema.createSchema('dtype_schema').execute()
        await ctx.db.schema
          .createType('dtype_schema.species')
          .asEnum(['cat', 'dog', 'frog'])
          .execute()

        await ctx.db.schema
          .createTable('some_schema.MixedCaseTable')
          .addColumn('some_column', 'serial', (col) => col.primaryKey())
          .execute()

        await ctx.db.schema
          .createTable('some_schema.pet')
          .addColumn('some_column', 'serial', (col) => col.primaryKey())
          .addColumn('spcies', sql`dtype_schema.species`)
          .execute()
        // check that a renamed column with sequence is still detected as autoincrement
        await ctx.db.schema
          .alterTable('some_schema.pet')
          .renameColumn('some_column', 'some_column_renamed')
          .execute()
        await ctx.db.schema
          .createTable('some_schema.pet_partition')
          .addColumn('part_column', 'text')
          .modifyEnd(sql`PARTITION by LIST ("part_column")`)
          .execute()
      } else {
        await ctx.db.schema
          .createTable('some_schema.pet')
          .addColumn('some_column', 'integer', (col) =>
            col.identity().notNull().primaryKey(),
          )
          .addColumn('some_column_plus_1', sql``, (col) =>
            col.modifyEnd(sql`as (some_column + 1)`),
          )
          .execute()
      }
    }

    async function dropSchema() {
      await ctx.db.schema.dropTable('some_schema.pet').ifExists().execute()
      await ctx.db.schema
        .dropTable('some_schema.MixedCaseTable')
        .ifExists()
        .execute()
      await ctx.db.schema
        .dropTable('some_schema.pet_partition')
        .ifExists()
        .execute()
      await ctx.db.schema.dropSchema('some_schema').ifExists().execute()

      if (sqlSpec === 'postgres') {
        await ctx.db.schema
          .dropType('dtype_schema.species')
          .ifExists()
          .execute()
        await ctx.db.schema.dropSchema('dtype_schema').ifExists().execute()
      }
    }
  })
}
