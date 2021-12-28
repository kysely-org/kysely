import * as path from 'path'

import {
  Migration,
  MigrationResultSet,
  MIGRATION_LOCK_TABLE,
  MIGRATION_TABLE,
  NO_MIGRATIONS,
} from '../../'

import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  expect,
  initTest,
  TestContext,
  TEST_INIT_TIMEOUT,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: migration`, () => {
    let ctx: TestContext

    before(async function () {
      this.timeout(TEST_INIT_TIMEOUT)
      ctx = await initTest(dialect)
      await deleteMigrationTables()
    })

    afterEach(async () => {
      await deleteMigrationTables()
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    describe('migrateToLatest', () => {
      it('should run all unexecuted migrations', async () => {
        const [migrations1, executedUpMethods1] = createMigrations([
          'migration1',
          'migration2',
        ])

        const { results: results1 } = await ctx.db.migration.migrateToLatest(
          migrations1
        )

        const [migrations2, executedUpMethods2] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
          'migration4',
        ])

        const { results: results2 } = await ctx.db.migration.migrateToLatest(
          migrations2
        )

        expect(results1).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
          { migrationName: 'migration2', direction: 'Up', status: 'Success' },
        ])

        expect(results2).to.eql([
          { migrationName: 'migration3', direction: 'Up', status: 'Success' },
          { migrationName: 'migration4', direction: 'Up', status: 'Success' },
        ])

        expect(executedUpMethods1).to.eql(['migration1', 'migration2'])
        expect(executedUpMethods2).to.eql(['migration3', 'migration4'])
      })

      it('should return an error if a new migration is added before the last executed one', async () => {
        const [migrations1, executedUpMethods1] = createMigrations([
          'migration1',
          'migration3',
        ])

        await ctx.db.migration.migrateToLatest(migrations1)

        const [migrations2, executedUpMethods2] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
        ])

        const { error } = await ctx.db.migration.migrateToLatest(migrations2)

        expect(error).to.be.an.instanceOf(Error)
        expect(getMessage(error)).to.eql(
          'corrupted migrations: expected previously executed migration migration3 to be at index 1 but migration2 was found in its place. New migrations must always have a name that comes alphabetically after the last executed migration.'
        )

        expect(executedUpMethods1).to.eql(['migration1', 'migration3'])
        expect(executedUpMethods2).to.eql([])
      })

      it('should return an error if a previously executed migration is missing', async () => {
        const [migrations1, executedUpMethods1] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
        ])

        await ctx.db.migration.migrateToLatest(migrations1)

        const [migrations2, executedUpMethods2] = createMigrations([
          'migration2',
          'migration3',
          'migration4',
        ])

        const { error } = await ctx.db.migration.migrateToLatest(migrations2)

        expect(error).to.be.an.instanceOf(Error)
        expect(getMessage(error)).to.eql(
          'corrupted migrations: previously executed migration migration1 is missing'
        )

        expect(executedUpMethods1).to.eql([
          'migration1',
          'migration2',
          'migration3',
        ])
        expect(executedUpMethods2).to.eql([])
      })

      it('should return an error if a the last executed migration is not found', async () => {
        const [migrations1, executedUpMethods1] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
        ])

        const [migrations2, executedUpMethods2] = createMigrations([
          'migration1',
          'migration2',
          'migration4',
        ])

        await ctx.db.migration.migrateToLatest(migrations1)

        const { error } = await ctx.db.migration.migrateToLatest(migrations2)

        expect(error).to.be.an.instanceOf(Error)
        expect(getMessage(error)).to.eql(
          'corrupted migrations: previously executed migration migration3 is missing'
        )

        expect(executedUpMethods1).to.eql([
          'migration1',
          'migration2',
          'migration3',
        ])
        expect(executedUpMethods2).to.eql([])
      })

      it('should return an error if one of the migrations fails', async () => {
        const [migrations, executedUpMethods] = createMigrations([
          'migration1',
          { name: 'migration2', error: 'whoopsydaisy' },
          'migration3',
        ])

        const { error, results } = await ctx.db.migration.migrateToLatest(
          migrations
        )

        expect(getMessage(error)).to.equal('whoopsydaisy')

        expect(results).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
          { migrationName: 'migration2', direction: 'Up', status: 'Error' },
          {
            migrationName: 'migration3',
            direction: 'Up',
            status: 'NotExecuted',
          },
        ])

        expect(executedUpMethods).to.eql(['migration1'])
      })

      it('should work correctly when run in parallel', async () => {
        const [migrations, executedUpMethods] = createMigrations([
          'migration1',
          'migration2',
        ])

        const promises: Promise<MigrationResultSet>[] = []
        for (let i = 0; i < 100; ++i) {
          promises.push(ctx.db.migration.migrateToLatest(migrations))
        }

        await Promise.all(promises)
        expect(executedUpMethods).to.eql(['migration1', 'migration2'])
      })

      describe('using folder of migration files', () => {
        beforeEach(async () => {
          await dropTestMigrationTables()
        })

        afterEach(async () => {
          await dropTestMigrationTables()
        })

        it('should run migrations from a folder', async () => {
          await ctx.db.migration.migrateToLatest(
            path.join(__dirname, 'test-migrations')
          )

          // The migrations should create two tables test1 and test2.
          // Make sure they were correctly created.

          expect(await doesTableExists('test1')).to.eql(true)
          expect(await doesTableExists('test2')).to.eql(true)
        })

        async function dropTestMigrationTables(): Promise<void> {
          await ctx.db.schema.dropTable('test2').ifExists().execute()
          await ctx.db.schema.dropTable('test1').ifExists().execute()
        }
      })
    })

    describe('migrateTo', () => {
      it('should migrate up to a specific migration', async () => {
        const [migrations1, executedUpMethods1] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
          'migration4',
        ])

        const { results: results1 } = await ctx.db.migration.migrateTo(
          migrations1,
          'migration2'
        )

        const [migrations2, executedUpMethods2] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
          'migration4',
        ])

        const { results: results2 } = await ctx.db.migration.migrateTo(
          migrations2,
          'migration3'
        )

        expect(results1).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
          { migrationName: 'migration2', direction: 'Up', status: 'Success' },
        ])

        expect(results2).to.eql([
          { migrationName: 'migration3', direction: 'Up', status: 'Success' },
        ])

        expect(executedUpMethods1).to.eql(['migration1', 'migration2'])
        expect(executedUpMethods2).to.eql(['migration3'])
      })

      it('should migrate all the way down', async () => {
        const [migrations, executedUpMethods, executedDownMethods] =
          createMigrations(['migration1', 'migration2', 'migration3'])

        const { results: results1 } = await ctx.db.migration.migrateToLatest(
          migrations
        )

        const { results: results2 } = await ctx.db.migration.migrateTo(
          migrations,
          NO_MIGRATIONS
        )

        expect(results1).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
          { migrationName: 'migration2', direction: 'Up', status: 'Success' },
          { migrationName: 'migration3', direction: 'Up', status: 'Success' },
        ])

        expect(results2).to.eql([
          { migrationName: 'migration3', direction: 'Down', status: 'Success' },
          { migrationName: 'migration2', direction: 'Down', status: 'Success' },
          { migrationName: 'migration1', direction: 'Down', status: 'Success' },
        ])

        expect(executedUpMethods).to.eql([
          'migration1',
          'migration2',
          'migration3',
        ])
        expect(executedDownMethods).to.eql([
          'migration3',
          'migration2',
          'migration1',
        ])
      })

      it('should migrate down to a specific migration', async () => {
        const [migrations1, executedUpMethods1] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
          'migration4',
        ])

        const { results: results1 } = await ctx.db.migration.migrateTo(
          migrations1,
          'migration4'
        )

        const [migrations2, executedUpMethods2, executedDownMethods2] =
          createMigrations([
            'migration1',
            'migration2',
            'migration3',
            'migration4',
          ])

        const { results: results2 } = await ctx.db.migration.migrateTo(
          migrations2,
          'migration2'
        )

        expect(results1).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
          { migrationName: 'migration2', direction: 'Up', status: 'Success' },
          { migrationName: 'migration3', direction: 'Up', status: 'Success' },
          { migrationName: 'migration4', direction: 'Up', status: 'Success' },
        ])

        expect(results2).to.eql([
          { migrationName: 'migration4', direction: 'Down', status: 'Success' },
          { migrationName: 'migration3', direction: 'Down', status: 'Success' },
        ])

        expect(executedUpMethods1).to.eql([
          'migration1',
          'migration2',
          'migration3',
          'migration4',
        ])

        expect(executedUpMethods2).to.eql([])
        expect(executedDownMethods2).to.eql(['migration4', 'migration3'])
      })
    })

    describe('migrateUp', () => {
      it('should migrate up one step', async () => {
        const [migrations, executedUpMethods] = createMigrations([
          'migration1',
          'migration2',
        ])

        const { results: results1 } = await ctx.db.migration.migrateUp(
          migrations
        )

        expect(results1).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
        ])

        expect(executedUpMethods).to.eql(['migration1'])

        const { results: results2 } = await ctx.db.migration.migrateUp(
          migrations
        )

        expect(results2).to.eql([
          { migrationName: 'migration2', direction: 'Up', status: 'Success' },
        ])

        expect(executedUpMethods).to.eql(['migration1', 'migration2'])

        const { results: results3 } = await ctx.db.migration.migrateUp(
          migrations
        )

        expect(results3).to.eql([])
        expect(executedUpMethods).to.eql(['migration1', 'migration2'])
      })
    })

    describe('migrateDown', () => {
      it('should migrate down one step', async () => {
        const [migrations, executedUpMethods, executedDownMethods] =
          createMigrations([
            'migration1',
            'migration2',
            'migration3',
            'migration4',
          ])

        await ctx.db.migration.migrateUp(migrations)
        await ctx.db.migration.migrateUp(migrations)

        const { results: results1 } = await ctx.db.migration.migrateDown(
          migrations
        )

        const { results: results2 } = await ctx.db.migration.migrateDown(
          migrations
        )

        const { results: results3 } = await ctx.db.migration.migrateDown(
          migrations
        )

        expect(results1).to.eql([
          { migrationName: 'migration2', direction: 'Down', status: 'Success' },
        ])

        expect(results2).to.eql([
          { migrationName: 'migration1', direction: 'Down', status: 'Success' },
        ])

        expect(results3).to.eql([])

        expect(executedUpMethods).to.eql(['migration1', 'migration2'])
        expect(executedDownMethods).to.eql(['migration2', 'migration1'])
      })
    })

    async function deleteMigrationTables(): Promise<void> {
      await ctx.db.schema.dropTable(MIGRATION_TABLE).ifExists().execute()
      await ctx.db.schema.dropTable(MIGRATION_LOCK_TABLE).ifExists().execute()
    }

    function createMigrations(
      migrationConfigs: (string | { name: string; error?: string })[]
    ): [Record<string, Migration>, string[], string[]] {
      const executedUpMethods: string[] = []
      const executedDownMethods: string[] = []

      const migrations = migrationConfigs.reduce<Record<string, Migration>>(
        (migrations, rawConfig) => {
          const config =
            typeof rawConfig === 'string' ? { name: rawConfig } : rawConfig

          return {
            ...migrations,
            [config.name]: {
              async up(_db): Promise<void> {
                await sleep(20)

                if (config.error) {
                  throw new Error(config.error)
                }

                executedUpMethods.push(config.name)
              },

              async down(_db): Promise<void> {
                await sleep(20)

                if (config.error) {
                  throw new Error(config.error)
                }

                executedDownMethods.push(config.name)
              },
            },
          }
        },
        {}
      )

      return [migrations, executedUpMethods, executedDownMethods]
    }

    async function doesTableExists(tableName: string): Promise<boolean> {
      const metadata = await ctx.db.introspection.getMetadata()
      return !!metadata.tables.find((it) => it.name === tableName)
    }

    function sleep(millis: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, millis))
    }
  })
}

function getMessage(obj: unknown): string | undefined {
  if (isObject(obj) && typeof obj.message === 'string') {
    return obj.message
  }
}

function isObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null
}
