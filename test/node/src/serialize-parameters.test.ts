import {
  ColumnType,
  createDefaultPostgresCaster,
  Generated,
  Kysely,
  SerializeParametersPlugin,
  sql,
} from '../../../'

import {
  BUILT_IN_DIALECTS,
  createTableWithId,
  destroyTest,
  expect,
  initTest,
  NOT_SUPPORTED,
  TestContext,
  testSql,
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
            id: 1,
            tags: ['educated'],
            metadata: { seniority: 12 },
          },
          {
            id: 2,
            tags: [],
            metadata: {},
          },
        ])

        testSql(query, dialect, {
          postgres: {
            sql: 'insert into "serializePerson" ("id", "tags", "metadata") values ($1, $2, $3), ($4, $5, $6)',
            parameters: [1, '["educated"]', '{"seniority":12}', 2, '[]', '{}'],
          },
          mysql: {
            sql: 'insert into `serializePerson` (`id`, `tags`, `metadata`) values (?, ?, ?), (?, ?, ?)',
            parameters: [1, '["educated"]', '{"seniority":12}', 2, '[]', '{}'],
          },
          sqlite: NOT_SUPPORTED,
        })

        await expect(query.execute()).to.not.be.rejected
      })

      it('should update using javascript objects and arrays as strings', async () => {
        const query = serializeDb.updateTable('serializePerson').set({
          tags: ['senior_citizen'],
          metadata: { lastLogin: '2022-01-15T12:52:24.536Z' },
        })

        testSql(query, dialect, {
          postgres: {
            sql: 'update "serializePerson" set "tags" = $1, "metadata" = $2',
            parameters: [
              '["senior_citizen"]',
              '{"lastLogin":"2022-01-15T12:52:24.536Z"}',
            ],
          },
          mysql: {
            sql: 'update `serializePerson` set `tags` = ?, `metadata` = ?',
            parameters: [
              '["senior_citizen"]',
              '{"lastLogin":"2022-01-15T12:52:24.536Z"}',
            ],
          },
          sqlite: NOT_SUPPORTED,
        })

        await expect(query.execute()).to.not.be.rejected
      })

      if (dialect === 'postgres') {
        it('should insert into on conflict update set javascript objects and arrays as strings', async () => {
          const query = serializeDb
            .insertInto('serializePerson')
            .values([
              {
                id: 1,
                tags: ['educated', 'nice'],
                metadata: { seniority: 12 },
              },
            ])
            .onConflict((oc) =>
              oc.column('id').doUpdateSet({
                tags: ['educated', 'nice'],
                metadata: { seniority: 12 },
              })
            )

          testSql(query, dialect, {
            postgres: {
              sql: 'insert into "serializePerson" ("id", "tags", "metadata") values ($1, $2, $3) on conflict ("id") do update set "tags" = $4, "metadata" = $5',
              parameters: [
                1,
                '["educated","nice"]',
                '{"seniority":12}',
                '["educated","nice"]',
                '{"seniority":12}',
              ],
            },
            mysql: NOT_SUPPORTED,
            sqlite: NOT_SUPPORTED,
          })

          await expect(query.execute()).to.not.be.rejected
        })
      }

      if (dialect === 'mysql') {
        it('should insert into on duplicate key update javascript objects and arrays as strings', async () => {
          const query = serializeDb
            .insertInto('serializePerson')
            .values([
              {
                id: 1,
                tags: ['educated', 'nice'],
                metadata: { seniority: 12 },
              },
            ])
            .onDuplicateKeyUpdate({
              tags: ['educated', 'nice'],
              metadata: { seniority: 12 },
            })

          testSql(query, dialect, {
            postgres: NOT_SUPPORTED,
            mysql: {
              sql: 'insert into `serializePerson` (`id`, `tags`, `metadata`) values (?, ?, ?) on duplicate key update `tags` = ?, `metadata` = ?',
              parameters: [
                1,
                '["educated","nice"]',
                '{"seniority":12}',
                '["educated","nice"]',
                '{"seniority":12}',
              ],
            },
            sqlite: NOT_SUPPORTED,
          })

          await expect(query.execute()).to.not.be.rejected
        })
      }
    })
  }

  if (dialect === 'postgres') {
    describe(`${dialect}: serialize parameters with casting test`, () => {
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
          plugins: [
            new SerializeParametersPlugin({
              caster: createDefaultPostgresCaster('jsonb'),
            }),
          ],
        })

        await serializeDb.schema
          .dropTable('serializePerson')
          .ifExists()
          .execute()
        await createTableWithId(serializeDb.schema, dialect, 'serializePerson')
          .addColumn('tags', 'jsonb')
          .addColumn('metadata', 'jsonb')
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

      it('should insert javascript objects and arrays as strings and cast to jsonb', async () => {
        const query = serializeDb.insertInto('serializePerson').values([
          {
            id: 1,
            tags: ['educated'],
            metadata: sql`${{ seniority: 12 }}::jsonb`,
          },
          {
            id: 2,
            tags: [],
            metadata: {},
          },
        ])

        testSql(query, dialect, {
          postgres: {
            sql: 'insert into "serializePerson" ("id", "tags", "metadata") values ($1, $2::jsonb, $3::jsonb), ($4, $5::jsonb, $6::jsonb)',
            parameters: [1, '["educated"]', '{"seniority":12}', 2, '[]', '{}'],
          },
          mysql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await expect(query.execute()).to.not.be.rejected
      })

      it('should insert into on conflict update set javascript objects and arrays as strings and cast to jsonb', async () => {
        const query = serializeDb
          .insertInto('serializePerson')
          .values([
            {
              id: 1,
              tags: ['educated', 'nice'],
              metadata: { seniority: 12 },
            },
          ])
          .onConflict((oc) =>
            oc.column('id').doUpdateSet({
              tags: ['educated', 'nice'],
              metadata: { seniority: 12 },
            })
          )

        testSql(query, dialect, {
          postgres: {
            sql: 'insert into "serializePerson" ("id", "tags", "metadata") values ($1, $2::jsonb, $3::jsonb) on conflict ("id") do update set "tags" = $4::jsonb, "metadata" = $5::jsonb',
            parameters: [
              1,
              '["educated","nice"]',
              '{"seniority":12}',
              '["educated","nice"]',
              '{"seniority":12}',
            ],
          },
          mysql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await expect(query.execute()).to.not.be.rejected
      })

      it('should update using javascript objects and arrays as strings', async () => {
        const query = serializeDb.updateTable('serializePerson').set({
          tags: ['senior_citizen'],
          metadata: { lastLogin: '2022-01-15T12:52:24.536Z' },
        })

        testSql(query, dialect, {
          postgres: {
            sql: 'update "serializePerson" set "tags" = $1::jsonb, "metadata" = $2::jsonb',
            parameters: [
              '["senior_citizen"]',
              '{"lastLogin":"2022-01-15T12:52:24.536Z"}',
            ],
          },
          mysql: NOT_SUPPORTED,
          sqlite: NOT_SUPPORTED,
        })

        await expect(query.execute()).to.not.be.rejected
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
            id: 1,
            tags: ['educated'],
            metadata: { seniority: 12 },
          },
          {
            id: 2,
            tags: [],
            metadata: {},
          },
        ])

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: NOT_SUPPORTED,
          sqlite: {
            sql: 'insert into "serializePerson" ("id", "tags", "metadata") values (?, ?, ?), (?, ?, ?)',
            parameters: [1, '["educated"]', '{"seniority":12}', 2, '[]', '{}'],
          },
        })

        await expect(query.execute()).to.not.be.rejected
      })

      it('should update using javascript objects and arrays as strings', async () => {
        const query = serializeDb.updateTable('serializePerson').set({
          tags: ['senior_citizen'],
          metadata: { lastLogin: '2022-01-15T12:52:24.536Z' },
        })

        testSql(query, dialect, {
          postgres: NOT_SUPPORTED,
          mysql: NOT_SUPPORTED,
          sqlite: {
            sql: 'update "serializePerson" set "tags" = ?, "metadata" = ?',
            parameters: [
              '["senior_citizen"]',
              '{"lastLogin":"2022-01-15T12:52:24.536Z"}',
            ],
          },
        })

        await expect(query.execute()).to.not.be.rejected
      })
    })
  }
}
