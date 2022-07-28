import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  expect,
  insertDefaultDataSet,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: introspect`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)

      if (dialect === 'postgres') {
        await dropSchema()
        await createSchema()
      }
    })

    beforeEach(async () => {
      await insertDefaultDataSet(ctx)
    })

    afterEach(async () => {
      await clearDatabase(ctx)
    })

    after(async () => {
      if (dialect === 'postgres') {
        await dropSchema()
      }

      await destroyTest(ctx)
    })

    it('should get table metadata', async () => {
      const meta = await ctx.db.introspection.getTables()

      if (dialect === 'postgres') {
        expect(meta).to.eql([
          {
            name: 'person',
            schema: 'public',
            columns: [
              {
                name: 'id',
                dataType: 'int4',
                isNullable: false,
                isAutoIncrementing: true,
                hasDefaultValue: true,
              },
              {
                name: 'first_name',
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
            ],
          },
          {
            name: 'pet',
            schema: 'public',
            columns: [
              {
                name: 'id',
                dataType: 'int4',
                isNullable: false,
                isAutoIncrementing: true,
                hasDefaultValue: true,
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
                dataType: 'int4',
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
            schema: 'public',
            columns: [
              {
                name: 'id',
                dataType: 'int4',
                isNullable: false,
                isAutoIncrementing: true,
                hasDefaultValue: true,
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
                dataType: 'int4',
                isNullable: false,
                isAutoIncrementing: false,
                hasDefaultValue: false,
              },
              {
                name: 'price',
                dataType: 'float8',
                isNullable: false,
                isAutoIncrementing: false,
                hasDefaultValue: false,
              },
            ],
          },
          {
            name: 'pet',
            schema: 'some_schema',
            columns: [
              {
                name: 'some_column',
                dataType: 'int4',
                isNullable: false,
                isAutoIncrementing: false,
                hasDefaultValue: false,
              },
            ],
          },
        ])
      } else if (dialect === 'mysql') {
        expect(meta).to.eql([
          {
            name: 'person',
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
            ],
          },
          {
            name: 'pet',
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
        ])
      } else if (dialect === 'sqlite') {
        expect(meta).to.eql([
          {
            name: 'person',
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
            ],
          },
          {
            name: 'pet',
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
        ])
      }
    })

    async function createSchema() {
      await ctx.db.schema.createSchema('some_schema').execute()
      await ctx.db.schema
        .createTable('some_schema.pet')
        .addColumn('some_column', 'integer', (col) => col.primaryKey())
        .execute()
    }

    async function dropSchema() {
      await ctx.db.schema.dropTable('some_schema.pet').ifExists().execute()
      await ctx.db.schema.dropSchema('some_schema').ifExists().execute()
    }
  })
}
