import * as path from 'path'
import { promises as fs } from 'fs'

import {
  FileMigrationProvider,
  Migration,
  MigrationResultSet,
  DEFAULT_MIGRATION_LOCK_TABLE,
  DEFAULT_MIGRATION_TABLE,
  Migrator,
  NO_MIGRATIONS,
  MigratorProps,
} from '../../../'

import {
  clearDatabase,
  destroyTest,
  expect,
  initTest,
  TestContext,
  DIALECTS,
} from './test-setup.js'

const CUSTOM_MIGRATION_SCHEMA = 'migrate'
const CUSTOM_MIGRATION_TABLE = 'custom_migrations'
const CUSTOM_MIGRATION_LOCK_TABLE = 'custom_migrations_lock'

for (const dialect of DIALECTS) {
  describe(`${dialect}: migration`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
      await deleteMigrationTables()
    })

    afterEach(async () => {
      await deleteMigrationTables()
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    describe('getMigrations', () => {
      it('should get migrations', async () => {
        const [migrator] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
        ])

        const migrations1 = await migrator.getMigrations()
        expect(migrations1).to.have.length(3)
        expect(migrations1[0].name).to.equal('migration1')
        expect(migrations1[0].executedAt).to.equal(undefined)
        expect(migrations1[1].name).to.equal('migration2')
        expect(migrations1[1].executedAt).to.equal(undefined)
        expect(migrations1[2].name).to.equal('migration3')
        expect(migrations1[2].executedAt).to.equal(undefined)

        await migrator.migrateTo('migration2')

        const migrations2 = await migrator.getMigrations()
        expect(migrations2).to.have.length(3)
        expect(migrations2[0].name).to.equal('migration1')
        expect(migrations2[0].executedAt).to.be.instanceOf(Date)
        expect(migrations2[1].name).to.equal('migration2')
        expect(migrations2[1].executedAt).to.be.instanceOf(Date)
        expect(migrations2[2].name).to.equal('migration3')
        expect(migrations2[2].executedAt).to.equal(undefined)
      })
    })

    describe('migrateToLatest', () => {
      it('should run all unexecuted migrations', async () => {
        const [migrator1, executedUpMethods1] = createMigrations([
          'migration1',
          'migration2',
        ])

        const { results: results1 } = await migrator1.migrateToLatest()

        const [migrator2, executedUpMethods2] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
          'migration4',
        ])

        const { results: results2 } = await migrator2.migrateToLatest()

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
        const [migrator1, executedUpMethods1] = createMigrations([
          'migration1',
          'migration3',
        ])

        await migrator1.migrateToLatest()

        const [migrator2, executedUpMethods2] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
        ])

        const { error } = await migrator2.migrateToLatest()

        expect(error).to.be.an.instanceOf(Error)
        expect(getMessage(error)).to.eql(
          'corrupted migrations: expected previously executed migration migration3 to be at index 1 but migration2 was found in its place. New migrations must always have a name that comes alphabetically after the last executed migration.'
        )

        expect(executedUpMethods1).to.eql(['migration1', 'migration3'])
        expect(executedUpMethods2).to.eql([])
      })

      it('should run a new migration added before the last executed one with allowUnorderedMigrations enabled', async () => {
        const [migrator1, executedUpMethods1] = createMigrations(
          ['migration1', 'migration3'],
          { allowUnorderedMigrations: true }
        )

        const { results: results1 } = await migrator1.migrateToLatest()

        const [migrator2, executedUpMethods2] = createMigrations(
          ['migration1', 'migration2', 'migration3', 'migration4'],
          { allowUnorderedMigrations: true }
        )

        const { results: results2 } = await migrator2.migrateToLatest()

        expect(results1).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
          { migrationName: 'migration3', direction: 'Up', status: 'Success' },
        ])

        expect(results2).to.eql([
          { migrationName: 'migration2', direction: 'Up', status: 'Success' },
          { migrationName: 'migration4', direction: 'Up', status: 'Success' },
        ])

        expect(executedUpMethods1).to.eql(['migration1', 'migration3'])
        expect(executedUpMethods2).to.eql(['migration2', 'migration4'])
      })

      it('should return an error if a previously executed migration is missing', async () => {
        const [migrator1, executedUpMethods1] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
        ])

        await migrator1.migrateToLatest()

        const [migrator2, executedUpMethods2] = createMigrations([
          'migration2',
          'migration3',
          'migration4',
        ])

        const { error } = await migrator2.migrateToLatest()

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
        const [migrator1, executedUpMethods1] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
        ])

        const [migrator2, executedUpMethods2] = createMigrations([
          'migration1',
          'migration2',
          'migration4',
        ])

        await migrator1.migrateToLatest()
        const { error } = await migrator2.migrateToLatest()

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

      describe('with allowUnorderedMigrations', () => {
        it('should return an error if a previously executed migration is missing', async () => {
          const [migrator1, executedUpMethods1] = createMigrations(
            ['migration1', 'migration2', 'migration3'],
            { allowUnorderedMigrations: true }
          )

          await migrator1.migrateToLatest()

          const [migrator2, executedUpMethods2] = createMigrations(
            ['migration2', 'migration3', 'migration4'],
            { allowUnorderedMigrations: true }
          )

          const { error } = await migrator2.migrateToLatest()

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
          const [migrator1, executedUpMethods1] = createMigrations(
            ['migration1', 'migration2', 'migration3'],
            { allowUnorderedMigrations: true }
          )

          const [migrator2, executedUpMethods2] = createMigrations(
            ['migration1', 'migration2', 'migration4'],
            { allowUnorderedMigrations: true }
          )

          await migrator1.migrateToLatest()
          const { error } = await migrator2.migrateToLatest()

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
      })

      it('should return an error if one of the migrations fails', async () => {
        const [migrator, executedUpMethods] = createMigrations([
          'migration1',
          { name: 'migration2', error: 'whoopsydaisy' },
          'migration3',
        ])

        const { error, results } = await migrator.migrateToLatest()

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
        const [migrator, executedUpMethods] = createMigrations([
          'migration1',
          'migration2',
        ])

        const promises: Promise<MigrationResultSet>[] = []
        for (let i = 0; i < 100; ++i) {
          promises.push(migrator.migrateToLatest())
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
          const migrator = new Migrator({
            db: ctx.db,
            provider: new FileMigrationProvider({
              fs,
              path,
              migrationFolder: path.join(__dirname, 'test-migrations'),
            }),
          })

          await migrator.migrateToLatest()

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
        const [migrator1, executedUpMethods1] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
          'migration4',
        ])

        const { results: results1 } = await migrator1.migrateTo('migration2')

        const [migrator2, executedUpMethods2] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
          'migration4',
        ])

        const { results: results2 } = await migrator2.migrateTo('migration3')

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
        const [migrator, executedUpMethods, executedDownMethods] =
          createMigrations(['migration1', 'migration2', 'migration3'])

        const { results: results1 } = await migrator.migrateToLatest()
        const { results: results2 } = await migrator.migrateTo(NO_MIGRATIONS)

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
        const [migrator1, executedUpMethods1] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
          'migration4',
        ])

        const { results: results1 } = await migrator1.migrateTo('migration4')

        const [migrator2, executedUpMethods2, executedDownMethods2] =
          createMigrations([
            'migration1',
            'migration2',
            'migration3',
            'migration4',
          ])

        const { results: results2 } = await migrator2.migrateTo('migration2')

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

      describe('with allowUnorderedMigrations enabled', () => {
        it('should migrate up to a specific migration', async () => {
          const [migrator1, executedUpMethods1] = createMigrations(
            ['migration1', 'migration3', 'migration4', 'migration5'],
            { allowUnorderedMigrations: true }
          )

          const { results: results1 } = await migrator1.migrateTo('migration3')

          const [migrator2, executedUpMethods2] = createMigrations(
            [
              'migration1',
              'migration2',
              'migration3',
              'migration4',
              'migration5',
            ],
            { allowUnorderedMigrations: true }
          )

          const { results: results2 } = await migrator2.migrateTo('migration4')

          expect(results1).to.eql([
            { migrationName: 'migration1', direction: 'Up', status: 'Success' },
            { migrationName: 'migration3', direction: 'Up', status: 'Success' },
          ])

          expect(results2).to.eql([
            { migrationName: 'migration2', direction: 'Up', status: 'Success' },
            { migrationName: 'migration4', direction: 'Up', status: 'Success' },
          ])

          expect(executedUpMethods1).to.eql(['migration1', 'migration3'])
          expect(executedUpMethods2).to.eql(['migration2', 'migration4'])
        })

        it('should migrate all the way down', async () => {
          const [migrator1, executedUpMethods1] = createMigrations(
            ['migration1', 'migration2', 'migration4'],
            { allowUnorderedMigrations: true }
          )

          const { results: results1 } = await migrator1.migrateToLatest()

          const [migrator2, executedUpMethods2, executedDownMethods2] =
            createMigrations(
              ['migration1', 'migration2', 'migration3', 'migration4'],
              { allowUnorderedMigrations: true }
            )

          const { results: results2 } = await migrator2.migrateTo(NO_MIGRATIONS)

          expect(results1).to.eql([
            { migrationName: 'migration1', direction: 'Up', status: 'Success' },
            { migrationName: 'migration2', direction: 'Up', status: 'Success' },
            { migrationName: 'migration4', direction: 'Up', status: 'Success' },
          ])

          expect(results2).to.eql([
            {
              migrationName: 'migration4',
              direction: 'Down',
              status: 'Success',
            },
            {
              migrationName: 'migration2',
              direction: 'Down',
              status: 'Success',
            },
            {
              migrationName: 'migration1',
              direction: 'Down',
              status: 'Success',
            },
          ])

          expect(executedUpMethods1).to.eql([
            'migration1',
            'migration2',
            'migration4',
          ])
          expect(executedUpMethods2).to.eql([])
          expect(executedDownMethods2).to.eql([
            'migration4',
            'migration2',
            'migration1',
          ])
        })

        it('should migrate down to a specific migration', async () => {
          const [migrator1, executedUpMethods1] = createMigrations(
            ['migration1', 'migration2', 'migration3', 'migration5'],
            { allowUnorderedMigrations: true }
          )

          const { results: results1 } = await migrator1.migrateTo('migration5')

          const [migrator2, executedUpMethods2, executedDownMethods2] =
            createMigrations(
              [
                'migration1',
                'migration2',
                'migration3',
                'migration4',
                'migration5',
              ],
              { allowUnorderedMigrations: true }
            )

          const { results: results2 } = await migrator2.migrateTo('migration2')

          expect(results1).to.eql([
            { migrationName: 'migration1', direction: 'Up', status: 'Success' },
            { migrationName: 'migration2', direction: 'Up', status: 'Success' },
            { migrationName: 'migration3', direction: 'Up', status: 'Success' },
            { migrationName: 'migration5', direction: 'Up', status: 'Success' },
          ])

          expect(results2).to.eql([
            {
              migrationName: 'migration5',
              direction: 'Down',
              status: 'Success',
            },
            {
              migrationName: 'migration3',
              direction: 'Down',
              status: 'Success',
            },
          ])

          expect(executedUpMethods1).to.eql([
            'migration1',
            'migration2',
            'migration3',
            'migration5',
          ])

          expect(executedUpMethods2).to.eql([])
          expect(executedDownMethods2).to.eql(['migration5', 'migration3'])
        })
      })
    })

    describe('migrateUp', () => {
      it('should migrate up one step', async () => {
        const [migrator, executedUpMethods] = createMigrations([
          'migration1',
          'migration2',
        ])

        const { results: results1 } = await migrator.migrateUp()

        expect(results1).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
        ])

        expect(executedUpMethods).to.eql(['migration1'])

        const { results: results2 } = await migrator.migrateUp()

        expect(results2).to.eql([
          { migrationName: 'migration2', direction: 'Up', status: 'Success' },
        ])

        expect(executedUpMethods).to.eql(['migration1', 'migration2'])

        const { results: results3 } = await migrator.migrateUp()

        expect(results3).to.eql([])
        expect(executedUpMethods).to.eql(['migration1', 'migration2'])
      })

      it('should return an error when migrating up if a new migration is added before the last executed one', async () => {
        const [migrator1, executedUpMethods1] = createMigrations([
          'migration1',
          'migration3',
        ])

        await migrator1.migrateToLatest()

        const [migrator2, executedUpMethods2] = createMigrations([
          'migration1',
          'migration2',
          'migration3',
          'migration4',
        ])

        const { error } = await migrator2.migrateUp()

        expect(error).to.be.an.instanceOf(Error)
        expect(getMessage(error)).to.eql(
          'corrupted migrations: expected previously executed migration migration3 to be at index 1 but migration2 was found in its place. New migrations must always have a name that comes alphabetically after the last executed migration.'
        )

        expect(executedUpMethods1).to.eql(['migration1', 'migration3'])
        expect(executedUpMethods2).to.eql([])
      })

      it('should migrate up one step with allowUnorderedMigrations enabled', async () => {
        const [migrator1, executedUpMethods1] = createMigrations(
          ['migration1', 'migration3'],
          { allowUnorderedMigrations: true }
        )

        const { results: results1 } = await migrator1.migrateToLatest()

        const [migrator2, executedUpMethods2] = createMigrations(
          ['migration1', 'migration2', 'migration3', 'migration4'],
          { allowUnorderedMigrations: true }
        )

        const { results: results2 } = await migrator2.migrateUp()
        const { results: results3 } = await migrator2.migrateUp()

        expect(results1).to.eql([
          { migrationName: 'migration1', direction: 'Up', status: 'Success' },
          { migrationName: 'migration3', direction: 'Up', status: 'Success' },
        ])

        expect(results2).to.eql([
          { migrationName: 'migration2', direction: 'Up', status: 'Success' },
        ])

        expect(results3).to.eql([
          { migrationName: 'migration4', direction: 'Up', status: 'Success' },
        ])

        expect(executedUpMethods1).to.eql(['migration1', 'migration3'])
        expect(executedUpMethods2).to.eql(['migration2', 'migration4'])
      })
    })

    describe('migrateDown', () => {
      it('should migrate down one step', async () => {
        const [migrator, executedUpMethods, executedDownMethods] =
          createMigrations([
            'migration1',
            'migration2',
            'migration3',
            'migration4',
          ])

        await migrator.migrateUp()
        await migrator.migrateUp()

        const { results: results1 } = await migrator.migrateDown()
        const { results: results2 } = await migrator.migrateDown()
        const { results: results3 } = await migrator.migrateDown()

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

      it('should return an error if a new migration is added before the last executed one', async () => {
        const [migrator1, executedUpMethods1] = createMigrations([
          'migration1',
          'migration3',
        ])

        await migrator1.migrateToLatest()

        const [migrator2, _executedUpMethods2, executedDownMethods2] =
          createMigrations(['migration1', 'migration2', 'migration3'])

        const { error } = await migrator2.migrateDown()

        expect(error).to.be.an.instanceOf(Error)
        expect(getMessage(error)).to.eql(
          'corrupted migrations: expected previously executed migration migration3 to be at index 1 but migration2 was found in its place. New migrations must always have a name that comes alphabetically after the last executed migration.'
        )

        expect(executedUpMethods1).to.eql(['migration1', 'migration3'])
        expect(executedDownMethods2).to.eql([])
      })

      it('should migrate down one step with allowUnorderedMigrations enabled', async () => {
        const [migrator1, executedUpMethods1, _executedDownMethods1] =
          createMigrations(['migration1', 'migration2', 'migration4'], {
            allowUnorderedMigrations: true,
          })

        await migrator1.migrateToLatest()

        const [migrator2, _executedUpMethods2, executedDownMethods2] =
          createMigrations(
            [
              'migration1',
              'migration2',
              'migration3',
              'migration4',
              'migration5',
            ],
            { allowUnorderedMigrations: true }
          )

        const { results: results1 } = await migrator2.migrateDown()
        const { results: results2 } = await migrator2.migrateDown()
        const { results: results3 } = await migrator2.migrateDown()
        const { results: results4 } = await migrator2.migrateDown()

        expect(results1).to.eql([
          { migrationName: 'migration4', direction: 'Down', status: 'Success' },
        ])

        expect(results2).to.eql([
          { migrationName: 'migration2', direction: 'Down', status: 'Success' },
        ])

        expect(results3).to.eql([
          { migrationName: 'migration1', direction: 'Down', status: 'Success' },
        ])

        expect(results4).to.eql([])

        expect(executedUpMethods1).to.eql([
          'migration1',
          'migration2',
          'migration4',
        ])
        expect(executedDownMethods2).to.eql([
          'migration4',
          'migration2',
          'migration1',
        ])
      })

      describe('Migrate up should work when timestamps are equal', () => {
        // The following lines of code simulate a situation where the migrations would have the
        // timestamp

        let originalToIsoString: typeof Date.prototype.toISOString

        before(() => {
          originalToIsoString = Date.prototype.toISOString
          const defaultDateIsoString = new Date(2024, 0, 11).toISOString()
          Date.prototype.toISOString = () => defaultDateIsoString
        })

        after(() => {
          // Reset to originalToIsoString function so that upcoming tests are not affected
          Date.prototype.toISOString = originalToIsoString
        })

        it('should use the same ordering strategy for migrations for both not executed migrations and executed migrations', async () => {
          const [migrator1, executedUpMethods1] = createMigrations([
            '2024-01-01-create-table',
            '2024-01-01.2-update-table',
          ])

          await migrator1.migrateToLatest()

          const [migrator2, executedUpMethods2] = createMigrations([
            '2024-01-01-create-table',
            '2024-01-01.2-update-table',
          ])

          const { results: results2, error } = await migrator2.migrateToLatest()
          expect(error).to.be.undefined
          expect(results2).to.eql([])

          expect(executedUpMethods1).to.eql([
            '2024-01-01-create-table',
            '2024-01-01.2-update-table',
          ])
          expect(executedUpMethods2).to.eql([])
        })
      })
    })

    if (dialect === 'postgres') {
      describe('custom migration tables in a custom schema', () => {
        it('should create custom migration tables in custom schema', async () => {
          const [migrator, executedUpMethods] = createMigrations(
            ['migration1', 'migration2', 'migration3', 'migration4'],
            {
              migrationTableName: CUSTOM_MIGRATION_TABLE,
              migrationLockTableName: CUSTOM_MIGRATION_LOCK_TABLE,
              migrationTableSchema: CUSTOM_MIGRATION_SCHEMA,
            }
          )

          let promises: Promise<MigrationResultSet>[] = []
          // Run the migration 20 times in parallel to make sure the schema
          // related code can be run in parallel.
          for (let i = 0; i < 20; ++i) {
            promises.push(migrator.migrateTo('migration2'))
          }
          const results = await Promise.all(promises)
          for (const result of results) {
            expect(result.error).to.equal(undefined)
          }

          expect(executedUpMethods).to.eql(['migration1', 'migration2'])

          expect(
            await doesTableExists(
              CUSTOM_MIGRATION_LOCK_TABLE,
              CUSTOM_MIGRATION_SCHEMA
            )
          ).to.equal(true)

          expect(
            await doesTableExists(
              CUSTOM_MIGRATION_LOCK_TABLE,
              CUSTOM_MIGRATION_SCHEMA
            )
          ).to.equal(true)

          expect(await doesTableExists(DEFAULT_MIGRATION_TABLE)).to.equal(false)
          expect(await doesTableExists(DEFAULT_MIGRATION_LOCK_TABLE)).to.equal(
            false
          )
        })
      })
    }

    async function deleteMigrationTables(): Promise<void> {
      if (dialect !== 'sqlite') {
        await ctx.db.schema
          .withSchema(CUSTOM_MIGRATION_SCHEMA)
          .dropTable(CUSTOM_MIGRATION_TABLE)
          .ifExists()
          .execute()

        await ctx.db.schema
          .withSchema(CUSTOM_MIGRATION_SCHEMA)
          .dropTable(CUSTOM_MIGRATION_LOCK_TABLE)
          .ifExists()
          .execute()

        await ctx.db.schema
          .dropSchema(CUSTOM_MIGRATION_SCHEMA)
          .ifExists()
          .execute()
      }

      await ctx.db.schema
        .dropTable(DEFAULT_MIGRATION_TABLE)
        .ifExists()
        .execute()

      await ctx.db.schema
        .dropTable(DEFAULT_MIGRATION_LOCK_TABLE)
        .ifExists()
        .execute()
    }

    function createMigrations(
      migrationConfigs: (string | { name: string; error?: string })[],
      migratorConfig?: Partial<MigratorProps>
    ): [Migrator, string[], string[]] {
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

      return [
        new Migrator({
          db: ctx.db,
          provider: {
            getMigrations: () => Promise.resolve(migrations),
          },
          ...migratorConfig,
        }),
        executedUpMethods,
        executedDownMethods,
      ]
    }

    async function doesTableExists(
      tableName: string,
      schema?: string
    ): Promise<boolean> {
      const tables = await ctx.db.introspection.getTables()
      return !!tables.find(
        (it) => it.name === tableName && (!schema || it.schema === schema)
      )
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
