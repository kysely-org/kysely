import {
  ColumnType,
  Generated,
  Kysely,
  SerializeParametersPlugin,
} from '../../../'

import {
  BUILT_IN_DIALECTS,
  createTableWithId,
  destroyTest,
  expect,
  initTest,
  TestContext,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  if (dialect === 'mysql' || dialect === 'postgres') {
    describe(`${dialect}: serialize parameters test`, () => {
      let ctx: TestContext
      let serializeDb: Kysely<SerializeDatabase>

      interface SerializePerson {
        id: Generated<number>
        tags: string[]
        metadata: Record<string, any>
      }

      interface SerializeDatabase {
        serializePerson: SerializePerson
      }

      before(async function () {
        ctx = await initTest(this, dialect)

        serializeDb = new Kysely<SerializeDatabase>({
          ...ctx.config,
          plugins: [new SerializeParametersPlugin()],
        })

        await serializeDb.schema
          .dropTable('serializePerson')
          .ifExists()
          .execute()
        await createTableWithId(serializeDb.schema, dialect, 'serializePerson')
          .addColumn('tags', 'json')
          .addColumn('metadata', 'json')
          .execute()
      })

      after(async () => {
        await serializeDb.schema
          .dropTable('serializePerson')
          .ifExists()
          .execute()
        await serializeDb.destroy()
        await destroyTest(ctx)
      })

      it('should insert javascript objects and arrays as strings', async () => {
        const query = serializeDb.insertInto('serializePerson').values([
          {
            tags: ['educated'],
            metadata: { seniority: 12 },
          },
          {
            tags: [],
            metadata: {},
          },
        ])

        expect(query.compile().parameters).to.containSubset([
          '["educated"]',
          '{"seniority":12}',
          '[]',
          '{}',
        ])

        await expect(query.execute()).to.not.be.rejected
      })

      it('should update using javascript objects and arrays as strings', async () => {
        const query = serializeDb.updateTable('serializePerson').set({
          tags: ['senior_citizen'],
          metadata: { lastLogin: '2022-01-15T12:52:24.536Z' },
        })

        expect(query.compile().parameters).to.containSubset([
          '["senior_citizen"]',
          '{"lastLogin":"2022-01-15T12:52:24.536Z"}',
        ])

        await expect(query.execute()).to.not.be.rejected

        const result = await serializeDb
          .selectFrom('serializePerson')
          .selectAll()
          .execute()

        expect(result).to.containSubset([
          {
            tags: ['senior_citizen'],
            metadata: { lastLogin: '2022-01-15T12:52:24.536Z' },
          },
        ])
      })
    })
  }

  if (dialect === 'sqlite') {
    describe(`${dialect}: serialize parameters test`, () => {
      let ctx: TestContext
      let serializeDb: Kysely<SerializeDatabase>

      interface SerializePerson {
        id: Generated<number>
        tags: ColumnType<string, string[], string[]>
        metadata: ColumnType<string, Record<string, any>, Record<string, any>>
      }

      interface SerializeDatabase {
        serializePerson: SerializePerson
      }

      before(async function () {
        ctx = await initTest(this, dialect)

        serializeDb = new Kysely<SerializeDatabase>({
          ...ctx.config,
          plugins: [new SerializeParametersPlugin()],
        })

        await serializeDb.schema
          .dropTable('serializePerson')
          .ifExists()
          .execute()
        await createTableWithId(serializeDb.schema, dialect, 'serializePerson')
          .addColumn('tags', 'text')
          .addColumn('metadata', 'text')
          .execute()
      })

      after(async () => {
        await serializeDb.schema
          .dropTable('serializePerson')
          .ifExists()
          .execute()
        await serializeDb.destroy()
        await destroyTest(ctx)
      })

      it('should insert javascript objects and arrays as strings', async () => {
        const query = serializeDb.insertInto('serializePerson').values([
          {
            tags: ['educated'],
            metadata: { seniority: 12 },
          },
          {
            tags: [],
            metadata: {},
          },
        ])

        expect(query.compile().parameters).to.containSubset([
          '["educated"]',
          '{"seniority":12}',
          '[]',
          '{}',
        ])

        await expect(query.execute()).to.not.be.rejected
      })

      it('should update using javascript objects and arrays as strings', async () => {
        const query = serializeDb.updateTable('serializePerson').set({
          tags: ['senior_citizen'],
          metadata: { lastLogin: '2022-01-15T12:52:24.536Z' },
        })

        expect(query.compile().parameters).to.containSubset([
          '["senior_citizen"]',
          '{"lastLogin":"2022-01-15T12:52:24.536Z"}',
        ])

        await expect(query.execute()).to.not.be.rejected

        const result = await serializeDb
          .selectFrom('serializePerson')
          .selectAll()
          .execute()

        expect(result).to.containSubset([
          {
            tags: '["senior_citizen"]',
            metadata: '{"lastLogin":"2022-01-15T12:52:24.536Z"}',
          },
        ])
      })
    })
  }
}
