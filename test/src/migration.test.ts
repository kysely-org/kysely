import * as path from 'path'

import { Migration, MIGRATION_LOCK_TABLE, MIGRATION_TABLE } from '../../'

import {
  BUILT_IN_DIALECTS,
  clearDatabase,
  destroyTest,
  expect,
  initTest,
  TestContext,
} from './test-setup.js'

for (const dialect of BUILT_IN_DIALECTS) {
  describe(`${dialect}: migration`, () => {
    let ctx: TestContext

    before(async () => {
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

        const [migrations2, executedUpMethods2] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
          'migration4',
        ])

        await ctx.db.migration.migrateToLatest(migrations1)
        await ctx.db.migration.migrateToLatest(migrations2)

        expect(executedUpMethods1).to.eql(['migration1', 'migration2'])
        expect(executedUpMethods2).to.eql(['migration3', 'migration4'])
      })

      it('should throw if a new migration is added before the last executed one', async () => {
        const [migrations1, executedUpMethods1] = createMigrations([
          'migration1',
          'migration3',
        ])

        const [migrations2, executedUpMethods2] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
        ])

        await ctx.db.migration.migrateToLatest(migrations1)

        const error = await ctx.db.migration
          .migrateToLatest(migrations2)
          .catch((error) => error)

        expect(error).to.be.an.instanceOf(Error)
        expect(error.message).to.eql(
          'corrupted migrations: new migration migration2 comes alphabetically before the last executed migration. New migrations must always have a name that comes alphabetically after the last executed migration.'
        )

        expect(executedUpMethods1).to.eql(['migration1', 'migration3'])
        expect(executedUpMethods2).to.eql([])
      })

      it('should throw if a previously executed migration is missing', async () => {
        const [migrations1, executedUpMethods1] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
        ])

        const [migrations2, executedUpMethods2] = createMigrations([
          'migration2',
          'migration3',
          'migration4',
        ])

        await ctx.db.migration.migrateToLatest(migrations1)

        const error = await ctx.db.migration
          .migrateToLatest(migrations2)
          .catch((error) => error)

        expect(error).to.be.an.instanceOf(Error)
        expect(error.message).to.eql(
          'corrupted migrations: previously executed migration migration1 is missing'
        )

        expect(executedUpMethods1).to.eql([
          'migration1',
          'migration2',
          'migration3',
        ])
        expect(executedUpMethods2).to.eql([])
      })

      it('should throw if a the last executed migration is not found', async () => {
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

        const error = await ctx.db.migration
          .migrateToLatest(migrations2)
          .catch((error) => error)

        expect(error).to.be.an.instanceOf(Error)
        expect(error.message).to.eql(
          'corrupted migrations: previously executed migration migration3 is missing'
        )

        expect(executedUpMethods1).to.eql([
          'migration1',
          'migration2',
          'migration3',
        ])
        expect(executedUpMethods2).to.eql([])
      })

      it('should work correctly when run in parallel', async () => {
        const [migrations, executedUpMethods] = createMigrations([
          'migration1',
          'migration2',
        ])

        const promises: Promise<void>[] = []
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

    async function deleteMigrationTables(): Promise<void> {
      await ctx.db.schema.dropTable(MIGRATION_TABLE).ifExists().execute()
      await ctx.db.schema.dropTable(MIGRATION_LOCK_TABLE).ifExists().execute()
    }

    function createMigrations(
      migrationNames: string[]
    ): [Record<string, Migration>, string[], string[]] {
      const executedUpMethods: string[] = []
      const executedDownMethods: string[] = []

      const migrations = migrationNames.reduce<Record<string, Migration>>(
        (migrations, name) => ({
          ...migrations,
          [name]: {
            async up(_db): Promise<void> {
              await sleep(20)
              executedUpMethods.push(name)
            },

            async down(_db): Promise<void> {
              await sleep(20)
              executedDownMethods.push(name)
            },
          },
        }),
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
